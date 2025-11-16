const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, 'data', 'hoosGotTime.db')
const db = new Database(dbPath)

// Add new columns to users table if they don't exist
try {
  db.exec(`
    ALTER TABLE users ADD COLUMN phoneNumber TEXT;
  `)
  console.log('Added phoneNumber column')
} catch (error) {
  if (!error.message.includes('duplicate column name')) {
    console.error('Error adding phoneNumber:', error.message)
  }
}

try {
  db.exec(`
    ALTER TABLE users ADD COLUMN walkingTime INTEGER DEFAULT 10;
  `)
  console.log('Added walkingTime column')
} catch (error) {
  if (!error.message.includes('duplicate column name')) {
    console.error('Error adding walkingTime:', error.message)
  }
}

try {
  db.exec(`
    ALTER TABLE users ADD COLUMN notificationsEnabled INTEGER DEFAULT 0;
  `)
  console.log('Added notificationsEnabled column')
} catch (error) {
  if (!error.message.includes('duplicate column name')) {
    console.error('Error adding notificationsEnabled:', error.message)
  }
}

// Create notifications table for tracking sent notifications
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      eventId INTEGER NOT NULL,
      sentAt TEXT NOT NULL,
      phoneNumber TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      FOREIGN KEY (userId) REFERENCES users(id),
      FOREIGN KEY (eventId) REFERENCES events(id)
    )
  `)
  console.log('Created notifications table')
} catch (error) {
  console.error('Error creating notifications table:', error.message)
}

db.close()
console.log('Database migration complete!')
