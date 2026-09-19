//src/db/mongoose.js
import mongoose from 'mongoose';

const connectMongoose = async () => {
    if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }

    const connectionString = process.env.MONGODB_URI;
    const databaseName = process.env.MONGODB_DB_NAME || 'practice';

    if (!connectionString) {
        throw new Error('MONGODB_URI is required.');
    }

    await mongoose.connect(connectionString, { dbName: databaseName });

    return mongoose.connection;
};

export { connectMongoose };