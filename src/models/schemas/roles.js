//src/models/schemas/roles.js
import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            enum: ['customer', 'admin']
        }
    },
    {
        collection: 'roles'
    }
);

export default mongoose.model('Role', roleSchema);