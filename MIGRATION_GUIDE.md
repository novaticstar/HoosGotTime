# Migration Guide - Switching from Sample Data to Real Database

## Overview
The application has been updated to use real database data instead of hard-coded sample data. This guide will help you populate your database with test data.

## Prerequisites
- Database is properly configured and connected
- User authentication is working
- You can access the app and login

## Steps to Populate Database

### 1. Add Courses
Navigate to the courses page and add some test courses:
```
- ECON 372 - Microeconomics (Medium difficulty)
- CS 3240 - Advanced Software Development (Hard difficulty) 
- ECE 2200 - Circuits and Electronics (Medium difficulty)
- MATH 3351 - Linear Algebra (Easy difficulty)
```

### 2. Add Class Meetings
For each course, add class meeting times:
```
ECON 372:
- Monday, Wednesday, Friday: 9:30 AM - 10:45 AM
- Location: Monroe Hall

CS 3240:
- Tuesday, Thursday: 11:15 AM - 12:30 PM
- Location: Rice Hall 240

ECE 2200:
- Tuesday, Thursday: 2:00 PM - 3:15 PM
- Location: Thornton Hall

MATH 3351:
- Monday, Wednesday: 1:00 PM - 2:15 PM
- Location: Kerchof Hall
```

### 3. Add Tasks
Create some tasks with realistic due dates:
```
Task 1:
- Title: "CS 3240 Homework 2"
- Type: Homework
- Course: CS 3240
- Due: 2 days from today at 11:59 PM
- Estimated: 180 minutes (3 hours)
- Description: "Implement authentication service with tests"

Task 2:
- Title: "ECON Midterm Preparation"
- Type: Exam
- Course: ECON 372
- Due: 3 days from today at 11:59 PM
- Estimated: 240 minutes (4 hours)
- Description: "Review chapters 5-7, practice problems"

Task 3:
- Title: "ECE Lab Report"
- Type: Homework
- Course: ECE 2200
- Due: 5 days from today at 11:59 PM
- Estimated: 120 minutes (2 hours)
- Description: "Faraday and Lenz law experiments"

Task 4:
- Title: "MATH Problem Set"
- Type: Homework
- Course: MATH 3351
- Due: Tomorrow at 11:59 PM
- Estimated: 90 minutes
- Description: "Chapter 4 exercises 1-20"
```

### 4. Configure User Settings (if needed)
Go to setup/onboarding and configure:
- Wake time: 7:00 AM
- Sleep time: 11:00 PM
- Max study minutes per day: 480 (8 hours)
- Max study block: 120 minutes (2 hours)
- Walking buffer: 10 minutes
- Commute buffer: 15 minutes

### 5. Generate Schedule
Once you have courses and tasks:
1. Go to the Schedule page
2. Click "Regenerate schedule" or use the AI assistant
3. Ask the AI to "Plan my week ahead"
4. The AI will create schedule blocks based on your courses and tasks

### 6. Add Meal Preferences (Optional)
Add meal preferences to get meal blocks in your schedule:
```
Breakfast: 7:30 AM - 8:15 AM
Lunch: 12:00 PM - 1:00 PM  
Dinner: 6:30 PM - 7:30 PM
```

## Using the Schedule Runner
The app has a schedule generation API at `/api/schedule/run`. You can use it to automatically create schedule blocks based on your courses, tasks, and preferences.

### Option A: Use the AI Assistant
1. Go to the Schedule page
2. Click "Regenerate schedule" 
3. Or ask AI: "Can you create my schedule for this week?"

### Option B: Direct API Call (for testing)
```bash
curl -X POST http://localhost:3000/api/schedule/run \
  -H "Content-Type: application/json" \
  -d '{"date": "2024-11-15"}'
```

## Verifying Everything Works

### Check Schedule View
- Navigate to `/app/schedule`
- You should see your class meetings as colored blocks
- At-risk tasks should appear at the top
- Calendar should show real data from your database

### Check Tasks View  
- Navigate to `/app/tasks`
- You should see all your pending tasks
- At-risk tasks should be marked with orange badge
- Completed tasks should appear in separate section

### Check AI Assistant
- Ask "What's on my schedule today?"
- Should mention actual classes and tasks from database
- Ask "What tasks are due soon?"
- Should list real tasks, not fake sample data

### Test Task Creation
1. Go to Tasks page
2. Fill out "Add a task manually" form
3. Click "Save task"
4. Verify task appears in list immediately
5. Check if it shows up in schedule view (if due soon)

### Test AI Chat Scrolling
1. Paste a very long message (>1000 characters) into AI chat
2. Verify the message appears in a scrollable box
3. Check that you can scroll within the message

## Troubleshooting

### "No schedule blocks found"
- Make sure you have courses with class meetings added
- Run the schedule generator via AI or API
- Check that tasks have realistic due dates

### "No tasks appear"
- Verify tasks are created with status "pending"
- Check due dates are in the future
- Look at browser console for API errors

### "At-risk tasks not showing"
- Tasks need to be due within 4 days AND have >120 minute estimate
- Check task dates and estimated minutes

### "AI returns generic responses"
- Check that ANTHROPIC_API_KEY is set in .env
- Verify API route `/api/chat/message` is working
- Check browser console for errors

### Schedule doesn't auto-refresh
- Check browser console for fetch errors
- Verify you're logged in properly
- Check API routes return 200 status

## Database Schema Reference

Key tables:
- `User` - User accounts
- `Course` - Courses
- `ClassMeeting` - Class meeting times  
- `Task` - Assignments and tasks
- `ScheduleBlock` - Calendar events/blocks
- `UserSettings` - User preferences
- `MealPreference` - Meal time preferences

## Sample Data Creation Script

You can also create sample data programmatically via Prisma:

```typescript
// In prisma/seed.ts or a script
const userId = "your-user-id-here"

// Create course
const course = await prisma.course.create({
  data: {
    userId,
    name: "Advanced Software Development",
    code: "CS 3240",
    difficulty: "hard",
  }
})

// Add meetings
await prisma.classMeeting.create({
  data: {
    courseId: course.id,
    dayOfWeek: 2, // Tuesday
    startTime: "11:15",
    endTime: "12:30",
    building: "Rice Hall 240"
  }
})

// Create task
await prisma.task.create({
  data: {
    userId,
    courseId: course.id,
    title: "CS Homework 2",
    type: "homework",
    dueAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    estimatedMinutes: 180,
    status: "pending",
    createdFrom: "manual"
  }
})
```

Then run: `npx prisma db seed`

## Next Steps

After populating your database:
1. Test all functionality
2. Try the natural language task creation
3. Upload a syllabus to parse tasks
4. Use the AI assistant to plan your study time
5. Generate weekly schedules

Enjoy your AI-powered schedule management! 🎓
