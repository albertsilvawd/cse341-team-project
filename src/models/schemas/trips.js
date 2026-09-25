//src/models/schemas/trips.js
import mongoose from "mongoose";

const tripSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    region: { type: String, required: true, trim: true },
    startStation: { type: String, required: true, trim: true },
    endStation: { type: String, required: true, trim: true },
    duration: { type: String, required: true, trim: true },
    distance: { type: Number, required: true, min: 0 },
    highlights: { type: [String], default: [] },
    bestSeason: { type: String, required: true, trim: true },
    operatingMonths: { type: [Number], default: [] },
    imageUrl: { type: String, required: false, trim: true },
  },
  { timestamps: true }
);

const Trip = mongoose.model("Trip", tripSchema);

export default Trip;