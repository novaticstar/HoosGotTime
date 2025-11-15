export function naturalLanguageTaskPrompt({
  text,
  fallbackDueDate,
}: {
  text: string
  fallbackDueDate: string
}) {
  return `You are a task parser for a student scheduling app. Parse the following natural language input into a structured task list.

Input: "${text}"

Today's date: ${new Date().toISOString().slice(0, 10)}
Fallback due date (if no date specified): ${fallbackDueDate}

Instructions:
1. Extract all tasks mentioned in the input
2. Infer due dates from natural language (e.g., "tomorrow", "next week", "Friday")
3. Estimate time in minutes based on task complexity (default: 90 minutes)
4. Classify task type as one of: homework, exam, project, reading, quiz, other, life
5. Return ONLY valid JSON array with no additional text

Response format:
[
  {
    "title": "Task title",
    "due_date": "YYYY-MM-DD",
    "estimated_minutes": 90,
    "type": "homework"
  }
]

Return only the JSON array, no other text.`
}

export function syllabusExtractionPrompt(syllabusText: string) {
  return `You are a syllabus parser for a student scheduling app. Extract all assignments, exams, and deadlines from the syllabus.

Syllabus text:
${syllabusText}

Instructions:
1. Extract every assignment, exam, quiz, project, or reading with a due date
2. Parse dates into YYYY-MM-DD format
3. Estimate time required in minutes (exams: 180-240, homework: 60-120, readings: 30-90, projects: 240-480)
4. Classify each item as: homework, exam, project, reading, quiz, or other
5. Return ONLY valid JSON array with no additional text

Response format:
[
  {
    "title": "Assignment name",
    "due_date": "YYYY-MM-DD",
    "estimated_minutes": 90,
    "type": "homework"
  }
]

Return only the JSON array, no other text.`
}

export function studyContentPrompt(task: any, materialText?: string) {
  const material = materialText
    ? `\n\nStudy materials:\n${materialText}`
    : ""

  return `You are a study assistant helping a student prepare for a task. Generate comprehensive study content.

Task: ${task.title}
Type: ${task.type}
Due: ${task.dueAt}
Estimated time: ${task.estimatedMinutes} minutes
${task.description ? `Description: ${task.description}` : ""}${material}

Generate the following content:

1. **Study Plan**: Break down how to study for this task into concrete steps with time estimates
2. **Flashcards**: Create 8-12 flashcards covering key concepts (each with front/back)
3. **Practice Questions**: Generate 5-8 practice questions with answers

Return ONLY valid JSON in this exact format:
{
  "study_plan": [
    { "step": "Review lecture notes", "minutes": 30, "order": 1 },
    { "step": "Read chapter 3", "minutes": 45, "order": 2 }
  ],
  "flashcards": [
    { "front": "What is...?", "back": "Answer..." }
  ],
  "practice_questions": [
    { "question": "Question text?", "answer": "Answer text", "difficulty": "medium" }
  ]
}

Return only the JSON, no other text.`
}

export function dailySummaryPrompt({
  date,
  schedule,
  eatingStats,
  atRiskTasks,
}: {
  date: string
  schedule: any[]
  eatingStats: any
  atRiskTasks: any[]
}) {
  return `You are a helpful scheduling assistant. Provide a brief, friendly daily summary for the student.

Date: ${date}

Schedule for today:
${schedule.map((block) => `- ${block.type}: ${block.label || "Untitled"} (${new Date(block.startAt).toLocaleTimeString()} - ${new Date(block.endAt).toLocaleTimeString()})`).join("\n")}

Eating stats: ${eatingStats.scheduledMeals} meals scheduled today

At-risk tasks (due soon):
${atRiskTasks.length > 0 ? atRiskTasks.map((t) => `- ${t.title} (due ${new Date(t.dueAt).toLocaleDateString()})`).join("\n") : "None"}

Write a brief, encouraging summary (3-4 sentences) highlighting:
1. What their day looks like
2. Whether they have adequate meal breaks
3. Any urgent tasks they should prioritize

Keep it friendly, concise, and actionable. Don't use lists or bullet points in your response.`
}

export function weeklySummaryPrompt({
  startDate,
  endDate,
  blocks,
  atRiskTasks,
}: {
  startDate: string
  endDate: string
  blocks: any[]
  atRiskTasks: any[]
}) {
  const studyBlocks = blocks.filter((b) => b.type === "study")
  const totalStudyMinutes = studyBlocks.reduce((sum, b) => {
    const duration =
      (new Date(b.endAt).getTime() - new Date(b.startAt).getTime()) /
      (1000 * 60)
    return sum + duration
  }, 0)

  return `You are a helpful scheduling assistant. Provide a brief weekly planning summary for the student.

Week: ${startDate} to ${endDate}

Total study blocks scheduled: ${studyBlocks.length}
Total study time: ${Math.round(totalStudyMinutes)} minutes (${(totalStudyMinutes / 60).toFixed(1)} hours)

At-risk tasks:
${atRiskTasks.length > 0 ? atRiskTasks.map((t) => `- ${t.title} (due ${new Date(t.dueAt).toLocaleDateString()}, ${t.estimatedMinutes} min)`).join("\n") : "None"}

Write a brief weekly overview (3-5 sentences) that:
1. Summarizes their study time commitment
2. Highlights any concerning gaps or overload
3. Suggests priorities based on at-risk tasks
4. Offers encouragement

Keep it friendly, actionable, and motivating. Don't use lists or bullet points in your response.`
}
