import mongoose from 'mongoose';

const ticketClassSchema = new mongoose.Schema(
  {
    class: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    pricePerKm: {
      type: Number,
      required: true,
      min: 0
    },
    amenities: {
      type: [String],
      default: []
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    availableDays: {
      type: [String],
      enum: [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday'
      ],
      default: [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday'
      ]
    }
  },
  {
    collection: 'ticket-classes', 
    timestamps: true
  }
);

export default ticketClassSchema;