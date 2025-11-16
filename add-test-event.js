const Database = require('better-sqlite3');
const db = new Database('data/hoosGotTime.db');

// Get current time and add 12 minutes (so notification sends in ~2 minutes if walkingTime=10)
const now = new Date();
const eventTime = new Date(now.getTime() + 12 * 60 * 1000);

// Format as YYYY-MM-DD HH:MM
const startTime = eventTime.toISOString().slice(0, 16).replace('T', ' ');
const endTime = new Date(eventTime.getTime() + 60 * 60 * 1000).toISOString().slice(0, 16).replace('T', ' ');

const result = db.prepare(`
  INSERT INTO events (userId, title, description, startTime, endTime, location)
  VALUES (1, 'Test SMS Notification', 'Testing walking reminder', ?, ?, 'Rice Hall')
`).run(startTime, endTime);

console.log('✅ Test event created!');
console.log('Event starts at:', startTime);
console.log('You should receive SMS notification in ~2 minutes (if walkingTime=10)');
console.log('Event ID:', result.lastInsertRowid);

db.close();
