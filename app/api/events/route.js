import { NextResponse } from 'next/server'
import db from '../../../lib/db'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    const events = db.prepare(`
      SELECT id, title, description, start_time as start, end_time as end
      FROM events 
      WHERE user_id = ? 
      ORDER BY start_time
    `).all(userId)

    console.log(`Fetching events for user ${userId}:`, events)

    return NextResponse.json({ events })
  } catch (error) {
    console.error('Events fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('eventId')
    const userId = searchParams.get('userId')

    if (!eventId || !userId) {
      return NextResponse.json({ error: 'eventId and userId required' }, { status: 400 })
    }

    db.prepare('DELETE FROM events WHERE id = ? AND user_id = ?').run(eventId, userId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Event delete error:', error)
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 })
  }
}
