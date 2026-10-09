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
function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function getPaginatedTrips({ page, limit, region, season, q }) {
  const skip = (page - 1) * limit;
  const filter = {};

  if (region) {
    filter.region = region;
  }

  if (season) {
    filter.bestSeason = season;
  }

  if (q) {
    const pattern = new RegExp(escapeRegExp(q), "i");
    filter.$or = [{ name: pattern }, { description: pattern }];
  }

  const [trips, totalItems] = await Promise.all([
    Trip.find(filter).skip(skip).limit(limit).lean(),
    Trip.countDocuments(filter),
  ]);

  return { trips, totalItems };
}