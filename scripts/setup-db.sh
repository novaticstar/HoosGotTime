#!/bin/bash

# Setup script for database initialization
# This script should be run after configuring your .env file with Supabase credentials

echo "🔧 Setting up HoosGotTime database..."

# Check if .env exists
if [ ! -f .env ]; then
  echo "❌ Error: .env file not found!"
  echo "Please copy .env.example to .env and configure your Supabase credentials"
  exit 1
fi

# Install dependencies if needed
echo "📦 Installing dependencies..."
npm install

# Generate Prisma Client
echo "🔨 Generating Prisma Client..."
npx prisma generate

# Push schema to database (creates tables without migration files)
echo "📊 Pushing schema to database..."
npx prisma db push

# Seed the database with sample data
echo "🌱 Seeding database with sample data..."
npx tsx prisma/seed.ts

echo "✅ Database setup complete!"
echo ""
echo "Next steps:"
echo "1. Run 'npm run dev' to start the development server"
echo "2. Sign in with your Supabase credentials at http://localhost:3000/auth"
echo "3. Explore the calendar and task features!"
