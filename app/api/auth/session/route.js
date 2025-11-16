import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const cookieStore = cookies()
    const sessionCookie = cookieStore.get('user_session')
    
    if (!sessionCookie) {
      return NextResponse.json({ userId: null }, { status: 401 })
    }
    
    // Parse the session cookie JSON to get userId
    const session = JSON.parse(sessionCookie.value)
    
    return NextResponse.json({ 
      userId: session.userId,
      username: session.username,
      firstName: session.firstName,
      lastName: session.lastName,
      email: session.email
    })
  } catch (error) {
    console.error('Session check error:', error)
    return NextResponse.json({ userId: null }, { status: 500 })
  }
}
