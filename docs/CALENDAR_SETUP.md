# Calendar Functionality Setup Guide

This guide will help you set up and use the full calendar functionality of HoosGotTime with Supabase database integration.

## Prerequisites

1. **Supabase Project**: You need a Supabase account and project
2. **Environment Variables**: Configured `.env` file with Supabase credentials
3. **Node.js**: Version 18+ installed

## Setup Steps

### 1. Configure Environment Variables

Copy the example environment file and fill in your Supabase credentials:

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:

```env
# Anthropic API Key (for AI features)
ANTHROPIC_API_KEY=your-api-key-here

# Supabase project keys
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Prisma connection strings (use Supabase pool + direct URLs)
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres?sslmode=require"
```

**Finding your Supabase credentials:**
- Go to your Supabase project dashboard
- Navigate to Settings → API
- Copy the Project URL and anon public key
- Navigate to Settings → Database
- Copy the connection strings (both Pooler and Direct)

### 2. Run the Setup Script

Execute the automated setup script:

```bash
./scripts/setup-db.sh
```

This script will:
1. Install dependencies
2. Generate Prisma Client
3. Push the database schema to Supabase
4. Seed the database with sample data

### 3. Manual Setup (Alternative)

If you prefer to run steps manually:

```bash
# Install dependencies
npm install

# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed with sample data
npx tsx prisma/seed.ts
```

## Sample Data

The seed script creates:

- **1 Demo User** (demo@hoosgottime.com)
- **4 Courses** with class meetings:
  - Algorithms (CS 4102) - MWF 9:00-10:15
  - Machine Learning (CS 4774) - TR 2:00-3:15
  - Operating Systems (CS 4414) - MWF 1:00-2:15
  - Database Systems (CS 4750) - TR 11:00-12:15

- **11 Tasks** across courses:
  - Homework assignments
  - Exams and quizzes
  - Reading assignments
  - Projects
  - Personal tasks

- **Schedule Blocks** for today:
  - Sleep blocks
  - Class meetings
  - Meal times (breakfast, lunch, dinner)
  - Study sessions

## Features

### Calendar View

Access the calendar at `/app/schedule` to view:
- Daily and weekly views
- Color-coded blocks by type (class, meal, study, etc.)
- Real-time "now" indicator
- Filter by block type and course

### Smart Scheduling

The scheduler automatically:
- Places class meetings based on your course schedule
- Schedules meals within preferred time windows
- Adds travel buffers between classes
- Allocates study time for pending tasks
- Respects wake/sleep times

### Task Management

- Create tasks from natural language
- Parse syllabi to extract assignments
- Track time spent on tasks
- Get AI-powered study plans
- View at-risk tasks (insufficient study time scheduled)

### AI Features

- **Natural Language Task Creation**: "Finish calculus homework by Friday"
- **Syllabus Parsing**: Extract all assignments from course syllabi
- **Study Plan Generation**: Get optimized study sessions for exams
- **Daily/Weekly Summaries**: AI-generated planning insights

## API Endpoints

### Schedule

- `POST /api/schedule/run` - Generate optimized schedule
  ```json
  {
    "horizonDays": 7
  }
  ```

- `GET /api/schedule/get` - Fetch schedule blocks
  ```
  ?date=2024-01-15
  ?startDate=2024-01-15&endDate=2024-01-21
  ```

### Tasks

- `GET /api/tasks/get` - Get pending tasks
  ```
  ?atRiskOnly=true
  ```

- `POST /api/tasks/nl-create` - Create task from natural language
  ```json
  {
    "text": "Finish math homework by Friday",
    "save": true
  }
  ```

- `POST /api/tasks/complete` - Log task completion
  ```json
  {
    "taskId": 123,
    "startAt": "2024-01-15T14:00:00Z",
    "endAt": "2024-01-15T16:00:00Z",
    "markComplete": true
  }
  ```

### Courses

- `GET /api/courses/get` - Get user courses with meetings

## Database Schema

### Key Models

- **User**: User profile with Supabase auth integration
- **UserSettings**: Wake/sleep times, buffers, study limits
- **Course**: Course information and difficulty
- **ClassMeeting**: Recurring class times
- **Task**: Assignments with due dates and estimates
- **ScheduleBlock**: Calendar events (classes, meals, study)
- **MealPreference**: Meal timing preferences
- **UserMultiplier**: Learning-based time estimate adjustments

## Scheduling Algorithm

The scheduler uses a greedy algorithm with constraints:

1. **Fixed Blocks**: Sleep, classes (confidence = 1.0)
2. **High Priority**: Meals within preferred windows
3. **Travel Buffers**: Between classes based on settings
4. **Study Sessions**: Allocated to available time slots
5. **Task Priority**: Earlier due dates scheduled first
6. **Multipliers**: Adjusts estimates based on user history

## Customization

### User Settings

Update preferences in `/app/setup`:
- Wake and sleep times
- Travel buffer between classes
- Break buffer between tasks
- Maximum study hours per day
- Timezone

### Meal Preferences

Configure meal times and importance:
- Breakfast: 8:00-9:00 (30 min)
- Lunch: 12:00-1:30 (45 min)
- Dinner: 6:00-7:30 (45 min)

## Troubleshooting

### Prisma Client Not Generated

```bash
npx prisma generate
```

### Database Connection Issues

- Verify DATABASE_URL and DIRECT_URL in `.env`
- Check Supabase project is active
- Ensure connection strings use correct format

### No Schedule Blocks Showing

1. Run schedule generator: `POST /api/schedule/run`
2. Check you have courses and class meetings created
3. Verify tasks exist with future due dates

### TypeScript Errors

```bash
npm run build
```

This will show any type mismatches that need fixing.

## Next Steps

1. **Sign In**: Go to `/auth` and sign in with Supabase
2. **Add Courses**: Navigate to `/app/courses` and add your classes
3. **Create Tasks**: Use `/app/tasks` to add assignments
4. **Generate Schedule**: The app auto-generates on first load
5. **View Calendar**: Check `/app/schedule` to see your optimized schedule

## Architecture

```
/lib
  ├── prisma.ts           # Database client
  ├── auth.ts             # Authentication helpers
  ├── user.ts             # User profile management
  ├── scheduler.ts        # Schedule generation algorithm
  ├── agentData.ts        # Data fetching utilities
  ├── multipliers.ts      # Time estimate learning
  ├── schedule-data.ts    # Schedule display utilities
  ├── utils.ts            # Common utilities
  ├── claude.ts           # AI client
  └── ai/
      └── prompts.ts      # AI prompt templates

/prisma
  ├── schema.prisma       # Database schema
  └── seed.ts             # Sample data seeding

/app/api
  ├── schedule/
  │   ├── run/           # Generate schedule
  │   └── get/           # Fetch schedule blocks
  ├── tasks/
  │   ├── get/           # Fetch tasks
  │   ├── nl-create/     # Natural language task creation
  │   └── complete/      # Complete task with time log
  └── courses/
      └── get/           # Fetch courses
```

## Contributing

When extending the calendar functionality:

1. Update Prisma schema for new models
2. Run `npx prisma db push` to update database
3. Add new API routes in `/app/api`
4. Update TypeScript types
5. Add tests for new features

## Support

For issues or questions:
- Check existing GitHub issues
- Review the main README.md
- Consult Supabase and Prisma documentation
