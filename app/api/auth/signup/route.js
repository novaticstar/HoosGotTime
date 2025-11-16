import { NextResponse } from 'next/server'
import db from '../../../../lib/db'
import bcrypt from 'bcryptjs'

export async function POST(request) {
  try {
    const body = await request.json()
    const { firstName, lastName, email, username, password } = body || {}

    if (!firstName || !lastName || !email || !username || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    // Check if username already exists
    const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username)
    if (existingUser) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 400 })
    }

    // Check if email already exists
    const existingEmail = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
    if (existingEmail) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const insert = db.prepare(`
      INSERT INTO users (first_name, last_name, email, username, password_hash)
      VALUES (?, ?, ?, ?, ?)
    `)
    const result = insert.run(firstName, lastName, email, username, hashedPassword)
    const userId = result.lastInsertRowid

    // Set session cookie
    const res = NextResponse.json({ success: true, userId })
    res.cookies.set('user_session', JSON.stringify({
      userId,
      username,
      firstName,
      lastName,
      email
    }), {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30 // 30 days
    })

    return res
  } catch (err) {
    console.error('signup route error', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
