# Claude AI Setup Guide

This guide will help you set up Claude AI integration for HoosGotTime.

## Prerequisites

- An Anthropic account (sign up at https://console.anthropic.com)
- Access to Claude API

## Steps

### 1. Get Your Anthropic API Key

1. Go to https://console.anthropic.com/settings/keys
2. Sign in or create an account if you haven't already
3. Click "Create Key" to generate a new API key
4. Copy the API key (it will look like: `sk-ant-api03-...`)

### 2. Add API Key to Environment Variables

1. Open the `.env.local` file in the root of your project
2. Find the line: `ANTHROPIC_API_KEY=your_anthropic_api_key_here`
3. Replace `your_anthropic_api_key_here` with your actual API key
4. Save the file

Example:
```bash
ANTHROPIC_API_KEY=sk-ant-api03-abcdefg123456789...
```

### 3. Restart Your Development Server

After adding the API key, restart your Next.js development server:

```bash
# Stop the current server (Ctrl+C)
# Then restart it
npm run dev
```

## Usage

Once configured, the Claude AI assistant will:

1. Respond to your scheduling requests in natural language
2. Automatically create calendar events based on your conversations
3. Consider your existing schedule when making suggestions
4. Parse dates and times intelligently from your messages

## Example Prompts

- "Schedule a study session for Math tomorrow at 2pm for 2 hours"
- "Create a weekly workout routine for me"
- "I need to prepare for my exam next Friday, help me plan study blocks"
- "Block out time for a project deadline next Wednesday"

## Troubleshooting

### "ANTHROPIC_API_KEY is not configured"

- Make sure you've added the API key to `.env.local`
- Ensure there are no spaces around the `=` sign
- Restart your dev server after making changes

### API Key Invalid

- Double-check that you copied the entire API key
- Make sure the key starts with `sk-ant-api`
- Try generating a new key from the Anthropic console

### Rate Limits

- Free tier has usage limits
- Consider upgrading your Anthropic plan for higher limits
- See https://docs.anthropic.com/claude/reference/rate-limits

## Learn More

- [Anthropic Documentation](https://docs.anthropic.com/)
- [Claude API Reference](https://docs.anthropic.com/claude/reference/getting-started-with-the-api)
- [Pricing](https://www.anthropic.com/pricing)
