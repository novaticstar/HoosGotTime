import { NextRequest, NextResponse } from "next/server"
import { anthropic } from "@/lib/claude"
import { chatPrompt } from "@/lib/ai/prompts"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { message, conversationHistory, userContext } = body

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required and must be a string" },
        { status: 400 }
      )
    }

    // Build the system prompt with context
    const systemPrompt = chatPrompt({
      message,
      conversationHistory,
      userContext,
    })

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

    // Call Claude API
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1024,
      temperature: 0.7,
      system: systemPrompt,
      messages,
    })

    // Extract the text content from the response
    const textContent = response.content.find((block) => block.type === "text")
    const responseText = textContent && textContent.type === "text"
      ? textContent.text
      : "I'm here to help! Could you please rephrase your question?"

    return NextResponse.json({
      response: responseText,
      usage: response.usage,
    })
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json(
      {
        error: "Failed to generate response",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
