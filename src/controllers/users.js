//src/controllers/users.js
import { getUserById, getAllUsers } from '../models/users.js';

export function toSafeUser(user) {
    if (!user) return null;

    return {
        id: user._id.toString(),
        displayName: user.displayName,
        username: user.username,
        email: user.email,
        role: user.role?.name || user.role
    };
}

export async function getAllUsersApi(req, res, next) {
    try {
        const users = await getAllUsers();

        return res.status(200).json({ data: users.map(toSafeUser) });
    } catch (error) {
        return next(error);
    }
}

export async function getUserByIdApi(req, res, next) {
    try {
        const { id } = req.params;

        if (req.user.role !== 'admin' && req.user.id !== id) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const user = await getUserById(id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json(toSafeUser(user));
    } catch (error) {
        return next(error);
    }
}