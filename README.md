# HoosGotTime 🗓️

An AI-powered scheduling assistant built with Next.js, Claude AI, and SQLite. Perfect for hackathon demos!

## Features

✨ **ChatGPT-like Interface** - Clean, modern dark UI with glass morphism design  
🤖 **Claude AI Integration** - Natural language scheduling with Claude 3.5 Sonnet  
📅 **Live Calendar View** - Interactive calendar that updates in real-time  
🔐 **User Authentication** - Secure username/password authentication  
💾 **SQLite Database** - Zero-config local database (perfect for demos!)  
⚡ **Real-time Updates** - Calendar refreshes automatically when events are created  

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create or edit `.env.local` in the project root:

```bash
# Anthropic Claude AI (REQUIRED)
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Application Configuration
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

**Get your Anthropic API key:**
1. Go to https://console.anthropic.com/settings/keys
2. Sign in or create an account
3. Click "Create Key" and copy it
4. Paste it in `.env.local`

See [CLAUDE_SETUP.md](./CLAUDE_SETUP.md) for detailed instructions.

### 3. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## How to Use

### First Time Setup

1. Click "Sign Up" on the login page
2. Fill in your details (first name, last name, email, username, password)
3. Click "Sign Up" - you'll be automatically logged in

### Using the AI Assistant

1. Type natural language requests in the chat:
   - "Schedule a study session tomorrow at 2pm for 2 hours"
   - "Create a weekly workout routine"
   - "Block out time for my project deadline next Friday"

2. Claude will:
   - Understand your request
   - Create calendar events automatically
   - Consider your existing schedule
   - Provide helpful scheduling suggestions

3. View your events in the calendar panel on the right

### Managing Events

- **View Events**: See all your events in the interactive calendar
- **Switch Views**: Toggle between Month, Week, and Day views
- **Delete Events**: Click any event and confirm deletion

## Tech Stack

- **Framework**: Next.js 13 (App Router)
- **AI**: Anthropic Claude 3.5 Sonnet
- **Database**: SQLite (better-sqlite3)
- **Calendar**: react-big-calendar
- **Styling**: Custom CSS with dark theme
- **Authentication**: bcryptjs + httpOnly cookies

## Project Structure

```
HoosGotTime/
├── app/
│   ├── page.js                  # Main page (chat + calendar)
│   ├── login/page.js            # Login/signup page
│   ├── api/
│   │   ├── chat/route.js        # Claude AI endpoint
│   │   ├── events/route.js      # Event CRUD operations
│   │   └── auth/                # Authentication routes
├── components/
│   ├── ChatClient.jsx           # Chat interface
│   ├── CalendarView.jsx         # Calendar component
│   └── AuthEntry.jsx            # Login/signup forms
├── lib/
│   └── db.js                    # SQLite database setup
├── styles/
│   └── globals.css              # Global styles
└── data/
    └── hoosGotTime.db           # SQLite database (auto-created)
```

## Database Schema

### Users Table
- `id`: Primary key
- `first_name`: User's first name
- `last_name`: User's last name
- `email`: User's email (unique)
- `username`: User's username (unique)
- `password_hash`: Hashed password

### Events Table
- `id`: Primary key
- `user_id`: Foreign key to users
- `title`: Event title
- `description`: Event description
- `start_time`: Event start (ISO timestamp)
- `end_time`: Event end (ISO timestamp)
- `created_at`: Creation timestamp

## Development Tips

### Reset Database

If you need to start fresh, delete the database file:

```bash
rm data/hoosGotTime.db
```

The database will be recreated automatically on next run.

### Check Database Contents

You can use any SQLite browser or CLI:

```bash
sqlite3 data/hoosGotTime.db
# Then run SQL queries:
# SELECT * FROM users;
# SELECT * FROM events;
```

### Customize AI Behavior

Edit the system prompt in `app/api/chat/route.js` to change how Claude responds:

```javascript
const systemPrompt = `Your custom instructions here...`
```

## Hackathon Demo Tips

1. **Pre-create an account** before your demo to save time
2. **Prepare example prompts** that showcase the AI capabilities
3. **Show the calendar updates** - it's the most impressive feature!
4. **Demonstrate natural language** - show it understands complex requests
5. **Highlight the tech stack** - Next.js, Claude AI, SQLite

## Troubleshooting

### "ANTHROPIC_API_KEY is not configured"
- Add your API key to `.env.local`
- Restart the dev server after adding it

### Database errors
- Check that `data/` directory exists
- Try deleting and recreating the database

### Calendar not updating
- Check browser console for errors
- Verify events are being created in the database
- Try refreshing the page

## Future Enhancements

- [ ] Google Calendar sync
- [ ] Email notifications
- [ ] Event sharing
- [ ] Recurring events
- [ ] Time zone support
- [ ] Dark/light theme toggle
- [ ] Mobile app

## License

MIT License - feel free to use this for your hackathon project!

## Credits

Built for hackathons with ❤️ using Claude AI

HoosGotTime, a project for Claude for Good Hackathon
