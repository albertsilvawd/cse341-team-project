import { getDb } from '../db/connect.js';

const trainsPage = (req, res) => {
    res.render('trains', { title: 'Trains' });
};

const trainsApi = async (req, res) => {
    try {
        const page = Number.parseInt(req.query.page ?? '1', 10);
        const limit = Number.parseInt(req.query.limit ?? '10', 10);
        const search =
            typeof req.query.search === 'string'
                ? req.query.search.trim()
                : '';

        if (!Number.isInteger(page) || page < 1) {
            return res.status(400).json({
                error: 'page must be a positive integer'
            });
        }

        if (!Number.isInteger(limit) || limit < 1) {
            return res.status(400).json({
                error: 'limit must be a positive integer'
            });
        }

        const collection = getDb().collection('trains');

        const filter = search
            ? {
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { operator: { $regex: search, $options: 'i' } },
                    { type: { $regex: search, $options: 'i' } },
                    { powerSource: { $regex: search, $options: 'i' } },
                    { bestFor: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } }
                ]
            }
            : {};

        const total = await collection.countDocuments(filter);

        const trains = await collection
            .find(filter)
            .skip((page - 1) * limit)
            .limit(limit)
            .toArray();

        const totalPages = Math.ceil(total / limit);

        return res.json({
            trains,
            metadata: {
                page,
                limit,
                total,
                totalPages,
                search
            }
        });
    } catch (error) {
        console.error('TRAIN API ERROR:', error);

        return res.status(500).json({
            error: error instanceof Error ? error.message : String(error)
        });
    }
};

export { trainsApi, trainsPage };
