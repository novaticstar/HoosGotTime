import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import Database from 'better-sqlite3'
import path from 'path'

const dbPath = path.join(process.cwd(), 'data', 'hoosGotTime.db')

export async function GET(request) {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('user_session') || cookieStore.get('session')
    
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const session = JSON.parse(sessionCookie.value)
    const db = new Database(dbPath)
    
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(session.userId)
    
    if (!user) {
      db.close()
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    db.close()
    
    return NextResponse.json({
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      username: user.username,
      phoneNumber: user.phoneNumber || '',
      walkingTime: user.walkingTime || 10,
      notificationsEnabled: user.notificationsEnabled === 1
    })
  } catch (error) {
    console.error('GET profile error:', error)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('user_session') || cookieStore.get('session')
    
    console.log('PUT /api/user/profile - Session cookie:', sessionCookie ? 'exists' : 'missing')
    console.log('All cookies:', cookieStore.getAll().map(c => c.name))
    
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const session = JSON.parse(sessionCookie.value)
    const body = await request.json()
    
    const { firstName, lastName, email, phoneNumber, walkingTime, notificationsEnabled } = body

    const db = new Database(dbPath)
    
    // Check if email is taken by another user
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email, session.userId)
    if (existingUser) {
      db.close()
      return NextResponse.json({ error: 'Email already in use' }, { status: 400 })
    }

    // Update user profile
    db.prepare(`
      UPDATE users 
      SET first_name = ?, 
          last_name = ?, 
          email = ?, 
          phoneNumber = ?, 
          walkingTime = ?,
          notificationsEnabled = ?
      WHERE id = ?
    `).run(firstName, lastName, email, phoneNumber, walkingTime, notificationsEnabled ? 1 : 0, session.userId)

    db.close()

    return NextResponse.json({ 
      success: true,
      message: 'Profile updated successfully'
    })
  } catch (error) {
    console.error('PUT profile error:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
