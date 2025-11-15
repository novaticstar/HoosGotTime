import { NextRequest, NextResponse } from "next/server"
import { anthropic } from "@/lib/claude"
import { chatPrompt } from "@/lib/ai/prompts"

export async function POST(req: NextRequest) {
  try {
    console.log("Chat API: Received request")
    const body = await req.json()
    const { message, conversationHistory, userContext } = body

    console.log("Chat API: Message:", message)
    console.log("Chat API: Conversation history length:", conversationHistory?.length || 0)

    if (!message || typeof message !== "string") {
      console.error("Chat API: Invalid message format")
      return NextResponse.json(
        { error: "Message is required and must be a string" },
        { status: 400 }
      )
    }

    // Check if API key is configured
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error("Chat API: ANTHROPIC_API_KEY not configured")
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY is not configured. Please add it to your .env file." },
        { status: 500 }
      )
    }

    // Build the system prompt with context
    const systemPrompt = chatPrompt({
      message,
      conversationHistory,
      userContext,
    })

    console.log("Chat API: System prompt length:", systemPrompt.length)

    // Build messages array for Claude
    const messages: Array<{ role: "user" | "assistant"; content: string }> = []

    // Add conversation history if provided
    if (conversationHistory && Array.isArray(conversationHistory)) {
      conversationHistory.forEach((msg) => {
        if (msg.role === "user" || msg.role === "assistant") {
          messages.push({
            role: msg.role,
            content: msg.content,
          })
        }
      })
    }

    // Add the current message
    messages.push({
      role: "user",
      content: message,
    })

    console.log("Chat API: Calling Claude with", messages.length, "messages")

    // Call Claude API
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1024,
      temperature: 0.7,
      system: systemPrompt,
      messages,
    })

    console.log("Chat API: Received response from Claude")

    // Extract the text content from the response
    const textContent = response.content.find((block) => block.type === "text")
    const responseText = textContent && textContent.type === "text"
      ? textContent.text
      : "I'm here to help! Could you please rephrase your question?"

    console.log("Chat API: Response text length:", responseText.length)

    return NextResponse.json({
      response: responseText,
      usage: response.usage,
    })
  } catch (error) {
    console.error("Chat API error:", error)
    if (error instanceof Error) {
      console.error("Chat API error message:", error.message)
      console.error("Chat API error stack:", error.stack)
    }
    return NextResponse.json(
      {
        error: "Failed to generate response",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
