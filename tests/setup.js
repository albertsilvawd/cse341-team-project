import { beforeAll, afterAll } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectToDb, closeDb } from '../src/db/connect.js';
import { connectToMongoose, closeMongoose } from '../src/db/mongoose.js';
import { initializeDatabase } from '../src/db/initialize.js';

// These MUST be set at module load time.
// app.js reads SESSION_SECRET when it is imported.
process.env.SESSION_SECRET = 'test-session-secret';

let mongoServer;

// Start MongoDB Memory Server and seed the temporary test database.
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();

  process.env.MONGODB_URI = mongoServer.getUri();
  process.env.MONGODB_DB_NAME = 'kizuna-rail-test';

  // Connect the native MongoDB driver.
  const db = await connectToDb({
    connectionString: process.env.MONGODB_URI,
    databaseName: process.env.MONGODB_DB_NAME
  });

  // Connect Mongoose to the same temporary database.
  await connectToMongoose({
    connectionString: process.env.MONGODB_URI,
    databaseName: process.env.MONGODB_DB_NAME
  });

  // Seed the temporary database with the known starter data.
  await initializeDatabase(db);
});

// Clean everything up after the tests.
afterAll(async () => {
  await closeMongoose();
  await closeDb();

  if (mongoServer) {
    await mongoServer.stop();
    mongoServer = undefined;
  }
});