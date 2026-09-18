import mongoose from 'mongoose';

const connectToMongoose = async () => {
    const connectionString = process.env.MONGODB_URI;
    const databaseName = process.env.MONGODB_DB_NAME || 'kizuna-rail';

    if (!connectionString) {
        throw new Error('MONGODB_URI is required.');
    }

    await mongoose.connect(connectionString, {
        dbName: databaseName
    });

    return mongoose.connection;
};

const closeMongoose = async () => {
    await mongoose.disconnect();
};

export { closeMongoose, connectToMongoose };
