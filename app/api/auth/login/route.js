import { NextResponse } from 'next/server'
import db from '../../../../lib/db'
import bcrypt from 'bcryptjs'

export async function POST(request) {
  try {
    const body = await request.json()
    const { username, password } = body || {}

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password required' }, { status: 400 })
    }

    // Find user by username
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username)
    
    if (!user) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 })
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash)
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 })
    }

    // Set session cookie
    const res = NextResponse.json({ success: true, userId: user.id })
    res.cookies.set('user_session', JSON.stringify({
      userId: user.id,
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email
    }), {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30 // 30 days
    })

    return res
  } catch (err) {
    console.error('login route error', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
