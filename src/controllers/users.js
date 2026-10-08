//src/controllers/users.js
import {
    getUserById,
    getPaginatedUsers,
    updateUser,
    deleteUser
} from '../models/users.js';
import Role from '../models/schemas/roles.js';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

function parsePaginationParams(query) {
    const rawPage = query.page;
    const rawLimit = query.limit;

    const page = rawPage === undefined ? DEFAULT_PAGE : Number(rawPage);
    const limit = rawLimit === undefined ? DEFAULT_LIMIT : Number(rawLimit);

    if (!Number.isInteger(page) || page < 1) {
        return { error: 'page must be a positive integer' };
    }

    if (!Number.isInteger(limit) || limit < 1) {
        return { error: 'limit must be a positive integer' };
    }

    return { page, limit: Math.min(limit, MAX_LIMIT) };
}

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
        const parsed = parsePaginationParams(req.query);

        if (parsed.error) {
            return res.status(400).json({ message: parsed.error });
        }

        const { page, limit } = parsed;
        const role = typeof req.query.role === 'string' ? req.query.role.trim() : '';
        const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';

        const { users, totalItems } = await getPaginatedUsers({
            page,
            limit,
            role: role || undefined,
            q: q || undefined
        });
        const totalPages = Math.ceil(totalItems / limit) || 1;

        return res.status(200).json({
            data: users.map(toSafeUser),
            pagination: {
                page,
                limit,
                totalItems,
                totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1
            }
        });
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

export async function updateUserApi(req, res, next) {
    try {
        const { id } = req.params;

        if (req.user.role !== 'admin' && req.user.id !== id) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const existingUser = await getUserById(id);

        if (!existingUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        const updateData = {};

        if (req.body.displayName !== undefined) {
            updateData.displayName = req.body.displayName;
        }

        if (req.body.role !== undefined) {
            if (req.user.role !== 'admin') {
                return res.status(403).json({ message: "Only an administrator can change a user's role" });
            }

            const roleDoc = await Role.findOne({ name: req.body.role });

            if (!roleDoc) {
                return res.status(400).json({ message: 'Invalid role' });
            }

            updateData.role = roleDoc._id;
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: 'No valid fields to update' });
        }

        const updatedUser = await updateUser(id, updateData);

        return res.status(200).json(toSafeUser(updatedUser));
    } catch (error) {
        return next(error);
    }
}

export async function deleteUserApi(req, res, next) {
    try {
        const { id } = req.params;

        if (req.user.role !== 'admin' && req.user.id !== id) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const existingUser = await getUserById(id);

        if (!existingUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        await deleteUser(id);

        return res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        return next(error);
    }
}