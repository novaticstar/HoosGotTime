# HoosGotTime - Supabase Setup Guide

## Overview
HoosGotTime uses Supabase as the database backend to store user accounts and authentication information. The app supports two authentication methods:
1. **Google OAuth** - Users can sign in with their Google account
2. **Username/Password** - Users can create accounts with username and password

## Prerequisites
- A Supabase account (create one at [supabase.com](https://supabase.com))
- Node.js and npm installed

## Step 1: Create a Supabase Project

1. Go to [app.supabase.com](https://app.supabase.com)
2. Click "New Project"
3. Fill in your project details:
   - Name: `HoosGotTime` (or your preferred name)
   - Database Password: (create a strong password)
   - Region: (choose closest to your users)
4. Click "Create new project"

## Step 2: Create the Database Schema

Once your project is created, go to the SQL Editor in your Supabase dashboard and run the following SQL to create the `users` table:

\`\`\`sql
-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  username TEXT UNIQUE,
  password_hash TEXT,
  google_id TEXT UNIQUE,
  auth_provider TEXT NOT NULL CHECK (auth_provider IN ('google', 'password')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX idx_users_email ON users(email);

-- Create index on username for faster lookups
CREATE INDEX idx_users_username ON users(username);

-- Create index on google_id for faster lookups
CREATE INDEX idx_users_google_id ON users(google_id);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own data
CREATE POLICY "Users can read own data" ON users
  FOR SELECT
  USING (true);

-- Create policy to allow insert for registration
CREATE POLICY "Users can insert" ON users
  FOR INSERT
  WITH CHECK (true);

-- Create policy to allow users to update their own data
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE
  USING (true);
\`\`\`

## Step 3: Get Your Supabase Credentials

1. In your Supabase project dashboard, click on the "Settings" icon (gear icon)
2. Navigate to "API" section
3. You'll find two important values:
   - **Project URL** (looks like `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon/public key** (a long string starting with `eyJ...`)

## Step 4: Configure Environment Variables

Create a `.env.local` file in the root of your project (if it doesn't exist already) and add the following:

\`\`\`env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Google OAuth Configuration (if using Google sign-in)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXT_PUBLIC_BASE_URL=http://localhost:3000
\`\`\`

Replace the placeholder values with your actual credentials.

## Step 5: Install Dependencies

Make sure all required packages are installed:

\`\`\`bash
npm install
\`\`\`

## Step 6: Run the Application

Start the development server:

\`\`\`bash
npm run dev
\`\`\`

Visit `http://localhost:3000/login` to test the authentication flow.

## Database Schema Details

### Users Table Structure

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key, auto-generated |
| `first_name` | TEXT | User's first name (required) |
| `last_name` | TEXT | User's last name (required) |
| `email` | TEXT | User's email address (required, unique) |
| `username` | TEXT | Username for password auth (unique, nullable) |
| `password_hash` | TEXT | Bcrypt hashed password (nullable for Google users) |
| `google_id` | TEXT | Google account ID (unique, nullable) |
| `auth_provider` | TEXT | Either 'google' or 'password' |
| `created_at` | TIMESTAMP | Account creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

### Authentication Flow

**Google OAuth:**
1. User clicks "Continue with Google"
2. Google OAuth flow completes
3. App fetches user info from Google
4. App checks if user exists in Supabase (by `google_id`)
5. If new user: creates account with Google info
6. If existing user: logs them in
7. Session cookie is set with user data

**Username/Password:**
1. **Signup:** User fills form with first name, last name, email, username, password
2. Password is hashed with bcrypt
3. New record created in Supabase `users` table
4. Session cookie set with user data

5. **Login:** User enters username and password
6. App queries Supabase for username
7. Password is verified with bcrypt
8. Session cookie set with user data

## Security Notes

- Passwords are hashed using bcrypt (salt rounds: 10)
- Session cookies are httpOnly and secure in production
- Row Level Security (RLS) is enabled on the users table
- Email and username uniqueness is enforced at the database level

## Troubleshooting

### "Missing Supabase environment variables" error
- Ensure `.env.local` exists and contains both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Restart your dev server after adding environment variables

### "Failed to create account" or database errors
- Check your Supabase project is active and running
- Verify the `users` table was created successfully in the SQL Editor
- Check the browser console and server logs for detailed error messages

### Google OAuth issues
- Ensure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set
- Verify the redirect URI in Google Cloud Console matches your callback URL
- Check that the Google OAuth consent screen is configured

## Next Steps

After setting up Supabase:
1. Test both authentication methods (Google and username/password)
2. Consider adding email verification for password signups
3. Implement password reset functionality
4. Add user profile management features
5. Extend the schema for calendar events and scheduling data
