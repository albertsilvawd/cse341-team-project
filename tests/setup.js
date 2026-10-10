import { afterAll, beforeAll, beforeEach, inject } from 'vitest';
import { closeDb, connectToDb, getDb } from '../src/db/connect.js';
import { closeMongoose, connectToMongoose } from '../src/db/mongoose.js';
import { initializeDatabase } from '../src/db/initialize.js';

// Guarantees express-session has a secret during tests, even if .env
// isn't loaded by the test runner (the "test" npm script doesn't use --env-file).
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test-session-secret';

const connectionString = inject('MONGODB_TEST_URI');

beforeAll(async () => {
  await connectToDb({
    connectionString,
    databaseName: 'kizuna-rail-test'
  });

  await connectToMongoose({
    connectionString,
    databaseName: 'kizuna-rail-test'
  });
});

beforeEach(async () => {
  const db = getDb();
  await db.dropDatabase();
  await initializeDatabase(db);
});

afterAll(async () => {
  await closeDb();
  await closeMongoose();
});