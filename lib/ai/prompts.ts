/**
 * AI Prompt templates for various features
 */

export function syllabusExtractionPrompt(syllabusText: string) {
  return `You are a helpful assistant that extracts tasks, assignments, exams, and important dates from course syllabi.

Analyze the following syllabus text and extract all tasks, assignments, exams, quizzes, projects, and readings with their due dates.

For each item, provide:
1. title: A clear, concise title for the task
2. description: Any additional details about the task (optional)
3. type: The type of task - one of: "homework", "exam", "project", "reading", "quiz", "other"
4. dueDate: The due date in ISO 8601 format (YYYY-MM-DD) if available, or null if no specific date
5. estimatedMinutes: Your best estimate of how long this task will take in minutes (be realistic)
6. courseInfo: Any course name or code mentioned in the syllabus (optional)

Return your response as a JSON object with this structure:
{
  "courseName": "The course name if found",
  "courseCode": "The course code if found",
  "tasks": [
    {
      "title": "Assignment 1",
      "description": "Complete problems 1-10",
      "type": "homework",
      "dueDate": "2025-02-15",
      "estimatedMinutes": 120
    }
  ]
}

Important guidelines:
- Only include actual tasks/assignments, not general course policies
- If no due date is mentioned, set dueDate to null
- Be generous with time estimates - students often underestimate
- For exams, estimate study time needed, not just exam duration
- Combine related items (e.g., "Read Chapter 1-3" instead of three separate tasks)
- If the text doesn't contain any tasks, return an empty tasks array

Syllabus text:
${syllabusText}`;
}

export function naturalLanguageTaskPrompt(userInput: string) {
  return `You are a helpful assistant that converts natural language task descriptions into structured task objects.

The user has provided the following task description:
"${userInput}"

Extract all tasks mentioned and return them as a JSON array. For each task, provide:
1. title: A clear, concise title
2. description: Additional details if any (can be empty string)
3. type: Best guess from: "homework", "exam", "project", "reading", "quiz", "life", "other"
4. dueDate: ISO 8601 date (YYYY-MM-DD) if mentioned, otherwise null
5. estimatedMinutes: Realistic time estimate in minutes

Return ONLY a valid JSON array like this:
[
  {
    "title": "Finish calculus homework",
    "description": "Problems 1-20 from chapter 5",
    "type": "homework",
    "dueDate": "2025-02-01",
    "estimatedMinutes": 90
  }
]

If no tasks can be extracted, return an empty array: []`;
}

export function dailySummaryPrompt(date: string, scheduleData: any) {
  return `Generate a friendly daily summary for ${date}.

Schedule data: ${JSON.stringify(scheduleData, null, 2)}

Provide a brief, encouraging summary of the day ahead including:
- Key classes and their times
- Important tasks and deadlines
- Estimated study time needed
- Any scheduling conflicts or tight transitions
- A motivational closing remark

Keep it concise (3-4 sentences) and friendly.`;
}

export function weeklySummaryPrompt(startDate: string, endDate: string, scheduleData: any) {
  return `Generate a helpful weekly summary for the week of ${startDate} to ${endDate}.

Schedule data: ${JSON.stringify(scheduleData, null, 2)}

Provide an overview including:
- Total classes and major commitments
- Key deadlines and exams
- Busiest days
- Recommended prep time for upcoming exams
- Wellness tips for staying balanced

Keep it helpful and concise (4-5 sentences).`;
}

export function studyContentPrompt(task: any, materialText?: string) {
  const materialSection = materialText
    ? `\n\nStudy Materials:\n${materialText}`
    : "";

  return `You are a helpful study assistant. Generate comprehensive study content for this task:

Task: ${task.title}
${task.description ? `Description: ${task.description}` : ""}
Type: ${task.type}
${task.dueAt ? `Due: ${task.dueAt}` : ""}${materialSection}

Generate the following study materials in JSON format:
{
  "study_plan": {
    "overview": "Brief overview of what to study",
    "steps": [
      { "title": "Step title", "description": "What to do", "estimatedMinutes": 30 }
    ],
    "tips": ["Study tip 1", "Study tip 2"]
  },
  "flashcards": [
    { "front": "Question or term", "back": "Answer or definition" }
  ],
  "practice_questions": [
    {
      "question": "Practice question text",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "correctAnswer": "A",
      "explanation": "Why this is correct"
    }
  ]
}

Generate at least 5-10 flashcards and 3-5 practice questions. Make sure all content is relevant to the task.`;
}
