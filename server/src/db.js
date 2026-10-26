const mongoose = require('mongoose');

let mongodInstance = null;

async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/samadhan';
  
  try {
    // Attempt connecting to specified or local MongoDB with 2s timeout
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500,
    });
    console.log(`[Database] Connected successfully to MongoDB at ${uri}`);
    return;
  } catch (err) {
    console.warn(`[Database] Could not connect to external MongoDB (${err.message}). Starting embedded in-memory MongoDB...`);
  }

  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongodInstance = await MongoMemoryServer.create();
    const memoryUri = mongodInstance.getUri();
    await mongoose.connect(memoryUri);
    console.log(`[Database] Connected successfully to embedded in-memory MongoDB at ${memoryUri}`);
  } catch (fallbackErr) {
    console.error('[Database] Fatal: Failed to initialize in-memory database:', fallbackErr);
    throw fallbackErr;
  }
}

async function closeDB() {
  await mongoose.disconnect();
  if (mongodInstance) {
    await mongodInstance.stop();
  }
}

module.exports = { connectDB, closeDB };
