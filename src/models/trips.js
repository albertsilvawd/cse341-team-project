//src/models/trips.js
import Trip from "./schemas/trips.js";

export async function getTripById(id) {
  return Trip.findOne({ id }).lean();
}

export async function getAllTrips() {
  return Trip.find({}).lean();
}

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