import { google } from 'googleapis'
import { NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect('/')
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${baseUrl}/api/auth/callback`
  )

  try {
    const { tokens } = await oauth2Client.getToken(code)
    oauth2Client.setCredentials(tokens)

    // Get user info from Google
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client })
    const { data: googleUser } = await oauth2.userinfo.get()
    
    const googleEmail = googleUser.email
    const googleId = googleUser.id
    const googleFirstName = googleUser.given_name || ''
    const googleLastName = googleUser.family_name || ''

    // Check if user exists in Supabase
    let { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('google_id', googleId)
      .single()

    let userId
    if (!existingUser) {
      // Create new user
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          first_name: googleFirstName,
          last_name: googleLastName,
          email: googleEmail,
          google_id: googleId,
          auth_provider: 'google',
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (insertError) {
        console.error('Failed to create user in Supabase:', insertError)
        return NextResponse.redirect('/?auth_error=db_error')
      }
      userId = newUser.id
      existingUser = newUser
    } else {
      userId = existingUser.id
    }

    const res = NextResponse.redirect('/')
    const maxAge = tokens.expiry_date ? Math.floor((tokens.expiry_date - Date.now()) / 1000) : 3600
    res.cookies.set('gg_tokens', JSON.stringify(tokens), {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: maxAge,
    })

    res.cookies.set('user_session', JSON.stringify({
      userId: existingUser.id,
      username: existingUser.username || null,
      firstName: existingUser.first_name,
      lastName: existingUser.last_name,
      email: existingUser.email
    }), {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30,
    })

    // Clean up temp cookies
    res.cookies.delete('gg_userInfo')
    res.cookies.delete('gg_profile')

    return res
  } catch (err) {
    console.error('Error exchanging code for token', err)
    return NextResponse.redirect('/?auth_error=1')
  }
}
