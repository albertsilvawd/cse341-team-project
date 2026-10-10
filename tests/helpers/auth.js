import bcrypt from 'bcrypt';
import request from 'supertest';
import Role from '../../src/models/schemas/roles.js';
import User from '../../src/models/schemas/users.js';

const DEFAULT_PASSWORD = 'Password123!';

export async function createTestUser({
  role = 'customer',
  displayName = 'Test User',
  username,
  email,
  password = DEFAULT_PASSWORD
} = {}) {
  const roleDoc = await Role.findOne({ name: role });

  if (!roleDoc) {
    throw new Error(`Role "${role}" was not found. Did the seed data load?`);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await User.create({
    displayName,
    username,
    email,
    passwordHash,
    role: roleDoc._id
  });

  return { user, password };
}

export async function loginAsTestUser(app, { email, password }) {
  const agent = request.agent(app);

  await agent.post('/login').type('form').send({ email, password });

  return agent;
}