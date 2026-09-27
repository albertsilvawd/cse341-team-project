import { getDb } from '../db/connect.js';

const getMyBookings = async (req, res) => {
    try {
        const email = req.user.email;

        const bookings = await getDb()
            .collection('confirmations')
            .find({ 'passengers.email': email })
            .toArray();

        return res.json(bookings);
    } catch (error) {
        console.error('Error fetching user bookings:', error);
        return res.status(500).json({
            message: 'Unable to load bookings.'
        });
    }
};

export { getMyBookings };
