import { NextRequest, NextResponse } from "next/server";
import { anthropic } from "@/lib/claude";
import { syllabusExtractionPrompt } from "@/lib/ai/prompts";
import { extractTextFromFile } from "@/lib/file-parser";

export async function POST(req: NextRequest) {
  try {
    let syllabusText: string;

    // Check if request is multipart/form-data (file upload) or JSON (text paste)
    const contentType = req.headers.get("content-type");

    if (contentType?.includes("multipart/form-data")) {
      // Handle file upload
      const formData = await req.formData();
      const file = formData.get("file") as File;

      if (!file) {
        return NextResponse.json(
          { error: "No file provided" },
          { status: 400 }
        );
      }

      // Convert file to buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Extract text based on file type
      syllabusText = await extractTextFromFile(buffer, file.type);
    } else {
      // Handle text paste
      const body = await req.json();
      syllabusText = body.syllabusText;
    }

    if (!syllabusText || syllabusText.trim().length === 0) {
      return NextResponse.json(
        { error: "Syllabus text is empty or could not be extracted" },
        { status: 400 }
      );
    }

    // Use Claude to extract tasks from syllabus
    const prompt = syllabusExtractionPrompt(syllabusText);

    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 4096,
      temperature: 0,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = msg.content[0]?.type === "text" ? msg.content[0].text : "";

    // Parse the JSON response
    let parsedTasks;
    try {
      parsedTasks = JSON.parse(raw);
    } catch (parseError) {
      console.error("Syllabus parse JSON error", parseError, raw);
      return NextResponse.json(
        { error: "Failed to parse AI response. Please try again." },
        { status: 500 }
      );
    }

    // Validate the response structure
    if (!Array.isArray(parsedTasks)) {
      return NextResponse.json(
        { error: "Invalid response format from AI" },
        { status: 500 }
      );
    }

    // Transform to expected format
    const tasks = parsedTasks.map((task: any) => ({
      title: task.title,
      description: task.description || "",
      type: task.type || "other",
      dueDate: task.due_date || null,
      estimatedMinutes: task.estimated_minutes || 90,
    }));

    return NextResponse.json({ 
      tasks,
      courseName: null,
      courseCode: null 
    });
  } catch (error) {
    console.error("Error parsing syllabus:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
