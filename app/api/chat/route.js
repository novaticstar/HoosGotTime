import { NextResponse } from 'next/server'
import db from '../../../lib/db'

export async function POST(request) {
  try {
    const { message, userId } = await request.json()

    if (!message || !userId) {
      return NextResponse.json({ error: 'Message and userId required' }, { status: 400 })
    }

    // Check if API key is configured
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY is not configured')
      return NextResponse.json({ 
        error: 'Claude AI is not configured. Please add your ANTHROPIC_API_KEY to .env.local and restart the server.' 
      }, { status: 500 })
    }

    // Get user's existing events for context
    const events = db.prepare('SELECT * FROM events WHERE user_id = ? ORDER BY start_time').all(userId)
    
    const eventsContext = events.length > 0 
      ? `Current schedule:\n${events.map(e => `- ${e.title} (${e.start_time} to ${e.end_time})`).join('\n')}`
      : 'No events scheduled yet.'

    const systemPrompt = `You are a scheduling assistant for HoosGotTime. Help users plan their time and create events. 
    
Today's date is ${new Date().toISOString().split('T')[0]} (${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}).

${eventsContext}

CRITICAL: You must respond with ONLY a valid JSON object, nothing else. No extra text before or after.

When users ask you to schedule something, respond with this EXACT format:
{
  "response": "your conversational response here",
  "events": [
    {
      "title": "Event Title",
      "description": "Event description",
      "start": "2025-11-16 14:00",
      "end": "2025-11-16 16:00"
    }
  ]
}

IMPORTANT: 
- Respond with ONLY the JSON object, no extra text
- Use REAL dates in format "YYYY-MM-DD HH:MM" (e.g., "2025-11-16 14:00")
- Calculate actual dates based on today's date
- Use 24-hour time format (14:00, not 2:00 PM)
- If creating multiple events (e.g., recurring), include them all in the events array

If you're just responding without creating events, use:
{
  "response": "your response here"
}

Remember: ONLY return the JSON object, nothing else.`

    console.log('Calling Claude API directly...')
    
    // Call Claude API directly using fetch - trying multiple model versions
    const models = [
      'claude-3-5-sonnet-20241022',
      'claude-3-5-sonnet-20240620',
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307'
    ]
    
    let assistantMessage = null
    
    for (const model of models) {
      console.log(`Trying model: ${model}`)
      
      const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: model,
          max_tokens: 1024,
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: message
            }
          ]
        })
      })

      const data = await claudeResponse.json()
      
      if (claudeResponse.ok) {
        console.log(`Success with model: ${model}`)
        console.log('Claude response:', data)
        assistantMessage = data.content[0].text
        break
      } else if (data.error?.type !== 'not_found_error') {
        // If it's not a "model not found" error, throw it
        console.error('Claude API error:', data)
        throw new Error(JSON.stringify(data))
      } else {
        console.log(`Model ${model} not available, trying next...`)
      }
    }
    
    if (!assistantMessage) {
      throw new Error('No Claude models available with this API key. Please check with your teammate which model they used.')
    }
    
    console.log('Raw assistant message:', assistantMessage)
    
    // Try to parse JSON response - extract JSON from markdown code blocks if present
    let parsedResponse
    try {
      // Remove markdown code blocks if present
      let jsonString = assistantMessage
      const jsonMatch = assistantMessage.match(/```json\s*([\s\S]*?)\s*```/) || 
                       assistantMessage.match(/```\s*([\s\S]*?)\s*```/) ||
                       assistantMessage.match(/\{[\s\S]*\}/)
      
      if (jsonMatch) {
        jsonString = jsonMatch[1] || jsonMatch[0]
      }
      
      parsedResponse = JSON.parse(jsonString.trim())
      console.log('Parsed response:', parsedResponse)
    } catch (e) {
      console.log('Failed to parse JSON, treating as plain text:', e.message)
      // If not JSON, treat as plain response
      parsedResponse = { response: assistantMessage }
    }

    // If events are included, save them to database
    if (parsedResponse.events && Array.isArray(parsedResponse.events)) {
      console.log(`Saving ${parsedResponse.events.length} events to database`)
      const insert = db.prepare(`
        INSERT INTO events (user_id, title, description, start_time, end_time)
        VALUES (?, ?, ?, ?, ?)
      `)

      for (const event of parsedResponse.events) {
        console.log('Inserting event:', event)
        insert.run(userId, event.title, event.description || '', event.start, event.end)
      }
      console.log('Events saved successfully')
    }

    return NextResponse.json({
      message: parsedResponse.response || parsedResponse.message || assistantMessage,
      events: parsedResponse.events || []
    })

  } catch (error) {
    console.error('Claude API error:', error)
    console.error('Error details:', error.message)
    
    // Provide helpful error message
    let errorMessage = 'Failed to get response from Claude'
    if (error.message.includes('not_found_error')) {
      errorMessage = 'Your Anthropic API key does not have access to Claude models. You need to add billing at console.anthropic.com/settings/billing'
    } else if (error.message.includes('authentication_error')) {
      errorMessage = 'Invalid API key. Please check your ANTHROPIC_API_KEY in .env.local'
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
