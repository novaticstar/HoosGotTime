# Google OAuth Setup Guide for HoosGotTime

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown at the top
3. Click "New Project"
4. Enter project name: "HoosGotTime" (or your preferred name)
5. Click "Create"

## Step 2: Enable Required APIs

1. In your project, go to **APIs & Services** → **Library**
2. Search for and enable these APIs:
   - **Google Calendar API** - Click "Enable"
   - **Google+ API** - Click "Enable"

## Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **External** (for testing with any Google account)
3. Click **Create**
4. Fill in required fields:
   - **App name:** HoosGotTime
   - **User support email:** your email
   - **Developer contact email:** your email
5. Click **Save and Continue**
6. **Scopes:** Click "Add or Remove Scopes"
   - Add: `userinfo.email`
   - Add: `userinfo.profile`
   - Add: `calendar.events.readonly`
   - Add: `calendar.events`
7. Click **Save and Continue**
8. **Test users:** Add your Google email address
9. Click **Save and Continue**

## Step 4: Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Application type: **Web application**
4. Name: "HoosGotTime Web Client"
5. **Authorized JavaScript origins:**
   - Add: `http://localhost:3000`
   - Add: `http://localhost:3001` (backup port)
6. **Authorized redirect URIs:**
   - Add: `http://localhost:3000/api/auth/callback`
   - Add: `http://localhost:3001/api/auth/callback`
7. Click **Create**
8. **IMPORTANT:** Copy both values that appear:
   - **Client ID** (looks like: `123456789-abc...apps.googleusercontent.com`)
   - **Client Secret** (looks like: `GOCSPX-abc...`)

## Step 5: Update .env.local File

Open `/Users/danieljimenez-palacios/development/HoosGotTime/.env.local` and paste your credentials:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=paste_your_client_id_here
GOOGLE_CLIENT_SECRET=paste_your_client_secret_here

# Supabase Configuration (skip for now if testing Google OAuth only)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Application Configuration
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## Step 6: Restart Your Dev Server

After saving `.env.local`:

```bash
# Stop current server (Ctrl+C or Cmd+C)
npm run dev
```

## Step 7: Test Google OAuth

1. Open `http://localhost:3000/login`
2. Select the **Google** tab
3. Click **Continue with Google**
4. You should be redirected to Google's sign-in page
5. Sign in with your Google account
6. Grant permissions
7. You'll be redirected back to your app

## Troubleshooting

### Error: "Access blocked: Authorization Error"
- Make sure you added your email to "Test users" in OAuth consent screen
- Verify all required scopes are added

### Error: "redirect_uri_mismatch"
- Check that `http://localhost:3000/api/auth/callback` is in Authorized redirect URIs
- Make sure there are no typos or extra spaces
- If your app runs on port 3001, add that redirect URI too

### Error: "invalid_client"
- Double-check your Client ID and Client Secret are correct in `.env.local`
- Make sure there are no extra quotes or spaces
- Restart your dev server after changing `.env.local`

### Error: "Missing Supabase environment variables"
- You can ignore this for now if only testing Google OAuth
- Or set up Supabase following `SUPABASE_SETUP.md`

## Quick Test Without Supabase

If you want to test Google OAuth without setting up Supabase immediately, I can create a temporary bypass. Let me know!
