import { NextResponse } from 'next/server'
import Database from 'better-sqlite3'
import path from 'path'

const dbPath = path.join(process.cwd(), 'data', 'hoosGotTime.db')

// Twilio credentials (add to .env.local)
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER

async function sendSMS(to, message) {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    console.error('Twilio credentials not configured')
    return { success: false, error: 'SMS service not configured' }
  }

  try {
    const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64')
    
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: to,
          From: TWILIO_PHONE_NUMBER,
          Body: message,
        }),
      }
    )

    const data = await response.json()
    
    if (response.ok) {
      return { success: true, sid: data.sid }
    } else {
      console.error('Twilio error:', data)
      return { success: false, error: data.message }
    }
  } catch (error) {
    console.error('SMS send error:', error)
    return { success: false, error: error.message }
  }
}

export async function POST(request) {
  try {
    const db = new Database(dbPath)
    
    // Get all users with notifications enabled
    const users = db.prepare(`
      SELECT id, phoneNumber, walkingTime, first_name, last_name
      FROM users 
      WHERE notificationsEnabled = 1 
      AND phoneNumber IS NOT NULL 
      AND phoneNumber != ''
    `).all()

    const now = new Date()
    const notifications = []

    for (const user of users) {
      // Get upcoming events for this user
      const events = db.prepare(`
        SELECT id, title, startTime, location
        FROM events 
        WHERE userId = ? 
        AND datetime(startTime) > datetime('now')
        AND datetime(startTime) <= datetime('now', '+1 day')
      `).all(user.id)

      for (const event of events) {
        const eventStart = new Date(event.startTime)
        const notifyTime = new Date(eventStart.getTime() - user.walkingTime * 60 * 1000)
        
        // Check if it's time to send notification (within 1 minute window)
        const timeDiff = notifyTime.getTime() - now.getTime()
        const minutesUntilNotify = timeDiff / (1000 * 60)
        
        if (minutesUntilNotify >= 0 && minutesUntilNotify < 1) {
          // Check if we already sent this notification
          const alreadySent = db.prepare(`
            SELECT id FROM notifications 
            WHERE userId = ? AND eventId = ? 
            AND datetime(sentAt) > datetime('now', '-${user.walkingTime + 5} minutes')
          `).get(user.id, event.id)

          if (!alreadySent) {
            const location = event.location || 'your next event'
            const message = `⏰ Time to head to ${location}! Your event "${event.title}" starts in ${user.walkingTime} minutes at ${eventStart.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}.`
            
            const result = await sendSMS(user.phoneNumber, message)
            
            // Log the notification
            db.prepare(`
              INSERT INTO notifications (userId, eventId, sentAt, phoneNumber, status)
              VALUES (?, ?, ?, ?, ?)
            `).run(
              user.id, 
              event.id, 
              now.toISOString(), 
              user.phoneNumber,
              result.success ? 'sent' : 'failed'
            )

            notifications.push({
              user: `${user.first_name} ${user.last_name}`,
              event: event.title,
              status: result.success ? 'sent' : 'failed',
              error: result.error
            })
          }
        }
      }
    }

    db.close()

    return NextResponse.json({
      success: true,
      processed: notifications.length,
      notifications
    })
  } catch (error) {
    console.error('Notification check error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Manual trigger for testing
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const testMode = searchParams.get('test') === 'true'
  
  if (testMode) {
    // Return info about upcoming notifications without sending
    try {
      const db = new Database(dbPath)
      
      const users = db.prepare(`
        SELECT id, phoneNumber, walkingTime, first_name, last_name
        FROM users 
        WHERE notificationsEnabled = 1 
        AND phoneNumber IS NOT NULL 
        AND phoneNumber != ''
      `).all()

      const upcomingNotifications = []
      const now = new Date()

      for (const user of users) {
        const events = db.prepare(`
          SELECT id, title, startTime, location
          FROM events 
          WHERE userId = ? 
          AND datetime(startTime) > datetime('now')
          AND datetime(startTime) <= datetime('now', '+1 day')
          ORDER BY startTime
        `).all(user.id)

        for (const event of events) {
          const eventStart = new Date(event.startTime)
          const notifyTime = new Date(eventStart.getTime() - user.walkingTime * 60 * 1000)
          const minutesUntilNotify = (notifyTime.getTime() - now.getTime()) / (1000 * 60)
          
          upcomingNotifications.push({
            user: `${user.first_name} ${user.last_name}`,
            phone: user.phoneNumber,
            event: event.title,
            eventTime: eventStart.toISOString(),
            notifyTime: notifyTime.toISOString(),
            minutesUntilNotify: Math.round(minutesUntilNotify),
            location: event.location
          })
        }
      }

      db.close()

      return NextResponse.json({
        test: true,
        currentTime: now.toISOString(),
        upcomingNotifications
      })
    } catch (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  return NextResponse.json({ error: 'Use POST to trigger notification check, or GET?test=true to see upcoming notifications' })
}
