import { google } from 'googleapis'

export async function GET(request) {
  try {
    const cookie = request.cookies.get('gg_tokens')
    if (!cookie) return new Response(JSON.stringify({ error: 'not_authenticated' }), { status: 401 })

    const tokens = JSON.parse(cookie.value)
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    )
    oauth2Client.setCredentials(tokens)

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

    const res = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: 50,
      singleEvents: true,
      orderBy: 'startTime',
    })

    return new Response(JSON.stringify({ events: res.data.items || [] }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('calendar/events error', err)
    return new Response(JSON.stringify({ error: 'server_error' }), { status: 500 })
  }
}
