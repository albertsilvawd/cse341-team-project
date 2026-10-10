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

export async function getUserById(id) {
    return User.findById(id).populate('role');
}

export async function getAllUsers() {
    return User.find({}).populate('role');
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function getPaginatedUsers({ page, limit, role, q }) {
    const filter = {};

    if (role) {
        const roleDoc = await Role.findOne({ name: role });

        // If the role doesn't exist, no user can match it.
        filter.role = roleDoc ? roleDoc._id : null;
    }

    if (q) {
        const regex = new RegExp(escapeRegExp(q), 'i');

        filter.$or = [
            { displayName: regex },
            { username: regex },
            { email: regex }
        ];
    }

    const totalItems = await User.countDocuments(filter);
    const users = await User.find(filter)
        .populate('role')
        .skip((page - 1) * limit)
        .limit(limit);

    return { users, totalItems };
}

export async function updateUser(id, data) {
    return User.findByIdAndUpdate(id, data, { new: true }).populate('role');
}

export async function deleteUser(id) {
    return User.findByIdAndDelete(id);
}