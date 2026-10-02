// src/models/trips.js
import mongoose from "mongoose";
import Trip from "./schemas/trips.js";

export async function getTripById(id) {
  const query = mongoose.isValidObjectId(id) ? { $or: [{ id }, { _id: id }] } : { id };
  return Trip.findOne(query).lean();
}

export async function getAllTrips() {
  return Trip.find({}).lean();
}

export async function updateTrip(id, updateData) {
  const query = mongoose.isValidObjectId(id) ? { $or: [{ id }, { _id: id }] } : { id };
  return Trip.findOneAndUpdate(query, updateData, { new: true, runValidators: true });
}

export async function deleteTrip(id) {
  const query = mongoose.isValidObjectId(id) ? { $or: [{ id }, { _id: id }] } : { id };
  return Trip.findOneAndDelete(query);
}