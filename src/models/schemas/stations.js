import mongoose from 'mongoose';

const stationSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            required: true,
            unique: true
        },
        name: {
            type: String,
            required: true
        },
        prefecture: {
            type: String,
            required: true
        },
        region: {
            type: String,
            required: true
        },
        facilities: {
            type: [String],
            default: []
        },
        description: {
            type: String,
            required: true
        }
    },
    {
        collection: 'stations'
    }
);

export default mongoose.model('Station', stationSchema);
