import { google } from 'googleapis'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const body = await request.json()
    const { firstName, lastName, email } = body || {}
    if (!firstName || !lastName || !email) {
      return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${baseUrl}/api/auth/callback`
    )

    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: [
        'https://www.googleapis.com/auth/calendar.events.readonly',
        'https://www.googleapis.com/auth/calendar.events',
      ],
    })

    // prepare response and set temp user info cookie
    const res = NextResponse.json({ redirect: url })
    res.cookies.set('gg_userInfo', JSON.stringify({ firstName, lastName, email }), {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 600, // 10 minutes window to complete OAuth
    })
    return res
  } catch (err) {
    console.error('register route error', err)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
