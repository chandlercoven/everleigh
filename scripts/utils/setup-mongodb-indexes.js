// MongoDB Indexes Setup Script for Everleigh

// Switch to the everleigh database
db = db.getSiblingDB('everleigh');

print("Setting up indexes for MongoDB collections...");

// Conversations collection indexes
print("Creating indexes for conversations collection...");
db.conversations.createIndex({ "user_id": 1 }, { background: true });
db.conversations.createIndex({ "created_at": 1 }, { background: true });
db.conversations.createIndex({ "updated_at": 1 }, { background: true });
db.conversations.createIndex({ "title": "text" }, { background: true });

// Messages collection indexes
print("Creating indexes for messages collection...");
db.messages.createIndex({ "conversation_id": 1 }, { background: true });
db.messages.createIndex({ "timestamp": 1 }, { background: true });
db.messages.createIndex({ "role": 1 }, { background: true });
db.messages.createIndex({ "conversation_id": 1, "timestamp": 1 }, { background: true });

// Voice recordings collection indexes
print("Creating indexes for voice_recordings collection...");
db.voice_recordings.createIndex({ "conversation_id": 1 }, { background: true });
db.voice_recordings.createIndex({ "created_at": 1 }, { background: true });
db.voice_recordings.createIndex({ "duration": 1 }, { background: true });

// Reminders collection indexes
print("Creating indexes for reminders collection...");
db.reminders.createIndex({ "dueDate": 1 }, { background: true });
db.reminders.createIndex({ "status": 1 }, { background: true });
db.reminders.createIndex({ "priority": 1 }, { background: true });
db.reminders.createIndex({ "tags": 1 }, { background: true });
db.reminders.createIndex({ "status": 1, "dueDate": 1 }, { background: true });

// Notifications collection indexes
print("Creating indexes for notifications collection...");
db.notifications.createIndex({ "reminderId": 1 }, { background: true });
db.notifications.createIndex({ "timestamp": 1 }, { background: true });
db.notifications.createIndex({ "status": 1 }, { background: true });

// Calendar operations collection indexes
print("Creating indexes for calendar_operations collection...");
db.calendar_operations.createIndex({ "operation": 1 }, { background: true });
db.calendar_operations.createIndex({ "timestamp": 1 }, { background: true });

// Weather queries collection indexes
print("Creating indexes for weather_queries collection...");
db.weather_queries.createIndex({ "location": 1 }, { background: true });
db.weather_queries.createIndex({ "timestamp": 1 }, { background: true });

// User settings collection indexes
print("Creating indexes for user_settings collection...");
db.user_settings.createIndex({ "user_id": 1 }, { unique: true, background: true });

// Cache metrics collection indexes
print("Creating indexes for cache_metrics collection...");
db.cache_metrics.createIndex({ "key": 1 }, { background: true });
db.cache_metrics.createIndex({ "timestamp": 1 }, { background: true });
db.cache_metrics.createIndex({ "operation": 1 }, { background: true });
db.cache_metrics.createIndex({ "key": 1, "timestamp": 1 }, { background: true });

// Rate limit collection indexes - uses TTL index for automatic cleanup
print("Creating indexes for rate_limits collection...");
db.rate_limits.createIndex({ "ip": 1 }, { background: true });
db.rate_limits.createIndex({ "endpoint": 1 }, { background: true });
db.rate_limits.createIndex({ "createdAt": 1 }, { expireAfterSeconds: 86400, background: true }); // Expires after 24 hours

print("MongoDB indexes setup completed!");
print("Total indexes created: " + (
  (db.conversations.getIndexes().length - 1) +
  (db.messages.getIndexes().length - 1) +
  (db.voice_recordings.getIndexes().length - 1) +
  (db.reminders.getIndexes().length - 1) +
  (db.notifications.getIndexes().length - 1) +
  (db.calendar_operations.getIndexes().length - 1) +
  (db.weather_queries.getIndexes().length - 1) +
  (db.user_settings.getIndexes().length - 1) +
  (db.cache_metrics.getIndexes().length - 1) +
  (db.rate_limits.getIndexes().length - 1)
)); 