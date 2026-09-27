//src/models/users.js
import bcrypt from 'bcrypt';
import User from './schemas/users.js';
import Role from './schemas/roles.js';

export async function createUser(displayName, username, email, password) {
    const customerRole = await Role.findOne({ name: 'customer' });

    if (!customerRole) {
        throw new Error('Default role not found');
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
        displayName,
        username,
        email,
        passwordHash,
        role: customerRole._id
    });

    return user._id.toString();
}

export async function findUserByEmail(email) {
    return User.findOne({ email }).populate('role');
}

export async function verifyPassword(password, passwordHash) {
    return bcrypt.compare(password, passwordHash);
}