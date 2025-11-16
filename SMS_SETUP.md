# SMS Notifications Setup Guide

## Overview
HoosGotTime now supports SMS notifications! Get text reminders before your events, giving you time to walk to your next location.

## Features
- ⏰ **Walking Reminders**: Get notified X minutes before each event
- 📱 **Configurable**: Set your preferred walking time (5-60 minutes)
- 🔔 **Enable/Disable**: Turn notifications on/off anytime
- 📍 **Location-Aware**: Messages include event location when available

## Setup Instructions

### 1. Sign Up for Twilio (Free Trial Available)

1. Go to [https://www.twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. Create a free account
3. Get a free trial phone number
4. Note your **Account SID**, **Auth Token**, and **Phone Number**

### 2. Configure Environment Variables

Add these to your `.env.local` file:

```bash
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+15551234567
```

### 3. Configure Your Settings

1. Navigate to **Settings** (⚙️ icon in sidebar)
2. Enter your phone number (include country code, e.g., +1 for US)
3. Set your **Walking Time** (minutes before event to be notified)
4. Enable **SMS Notifications** toggle
5. Click **Save Settings**

## How It Works

The notification system runs every minute and checks:
- Are you a user with notifications enabled?
- Do you have upcoming events in the next 24 hours?
- Is it time to send a "walking reminder" for any event?

Example notification:
```
⏰ Time to head to Rice Hall! Your event "CS 3240 Lecture" starts in 10 minutes at 2:30 PM.
```

## Automated Checking

To automatically check for notifications every minute, you have two options:

### Option 1: Cron Job (Recommended for Production)

Add to your crontab:
```bash
* * * * * curl -X POST http://localhost:3000/api/notifications/check
```

### Option 2: Manual Testing

Test the notification system:
```bash
# See upcoming notifications (doesn't send)
curl http://localhost:3000/api/notifications/check?test=true

# Trigger notification check (sends if time is right)
curl -X POST http://localhost:3000/api/notifications/check
```

## Database Schema

The migration added these columns to the `users` table:
- `phoneNumber` (TEXT): User's phone number
- `walkingTime` (INTEGER): Minutes before event to notify (default: 10)
- `notificationsEnabled` (INTEGER): 0 = off, 1 = on

And created a `notifications` table to track sent messages:
```sql
CREATE TABLE notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL,
  eventId INTEGER NOT NULL,
  sentAt TEXT NOT NULL,
  phoneNumber TEXT NOT NULL,
  status TEXT DEFAULT 'pending'
)
```

## Twilio Free Trial Limits

- **Trial Credit**: $15 USD (usually ~500 messages)
- **Verified Numbers**: Can only send to phone numbers you've verified
- **Messages Include**: "Sent from your Twilio trial account" prefix

To remove limitations, upgrade to a paid Twilio account.

## Troubleshooting

### Not Receiving Messages?

1. **Check Settings**: Is notifications enabled? Is phone number correct?
2. **Verify Number**: On Twilio trial, verify your phone number first
3. **Check Logs**: Look at Next.js console for notification check output
4. **Test Endpoint**: Use `?test=true` to see what would be sent

### Messages Going to Wrong Number?

- Update your phone number in Settings
- Ensure you're using international format (+1 for US)

### Rate Limiting?

- Twilio has rate limits on free tier
- Consider upgrading or reducing notification frequency

## API Endpoints

### `GET /api/notifications/check?test=true`
Returns upcoming notifications without sending them.

### `POST /api/notifications/check`
Checks for events that need notifications and sends SMS if applicable.

### `GET /api/user/profile`
Get current user profile (includes notification settings).

### `PUT /api/user/profile`
Update user profile (including notification settings).

## Privacy & Security

- Phone numbers are stored securely in SQLite database
- Only you can see/edit your phone number
- Twilio credentials never exposed to client
- Messages sent via secure HTTPS to Twilio API

## Next Steps

1. Set up your Twilio account
2. Configure `.env.local` with credentials
3. Add your phone number in Settings
4. Create an event to test!
5. Set up automated checking (cron job)

Happy scheduling! 🎓
