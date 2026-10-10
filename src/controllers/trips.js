//src/controllers/trips.js
import { getDb } from "../db/connect.js";
import {
  getTripById as findTripById,
  getAllTrips as findAllTrips,
  updateTrip as updateTripModel,
  deleteTrip as deleteTripModel,
  getPaginatedTrips as findPaginatedTrips
} from "../models/trips.js";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

function parsePaginationParams(query) {
  const rawPage = query.page;
  const rawLimit = query.limit;

  const page = rawPage === undefined ? DEFAULT_PAGE : Number(rawPage);
  const limit = rawLimit === undefined ? DEFAULT_LIMIT : Number(rawLimit);

  if (!Number.isInteger(page) || page < 1) {
    return { error: "page must be a positive integer" };
  }

  if (!Number.isInteger(limit) || limit < 1) {
    return { error: "limit must be a positive integer" };
  }

  return { page, limit: Math.min(limit, MAX_LIMIT) };
}

// API controllers

export async function getTripById(req, res) {
  try {
    const { id } = req.params;

    const trip = await findTripById(id);

    if (!trip) {
      return res.status(404).json({
        error: "Trip not found",
      });
    }

    return res.status(200).json(trip);
  } catch (error) {
    console.error("Error fetching trip:", error);

    return res.status(500).json({
      error: "Failed to fetch trip",
    });
  }
}

export async function getAllTrips(req, res) {
  try {
    const parsed = parsePaginationParams(req.query);

    if (parsed.error) {
      return res.status(400).json({ error: parsed.error });
    }

    const { page, limit } = parsed;
    const region = typeof req.query.region === "string" ? req.query.region.trim() : "";
    const season = typeof req.query.season === "string" ? req.query.season.trim() : "";
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";

    const { trips, totalItems } = await findPaginatedTrips({
      page,
      limit,
      region: region || undefined,
      season: season || undefined,
      q: q || undefined,
    });
    const totalPages = Math.ceil(totalItems / limit) || 1;

    return res.status(200).json({
      data: trips,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching trips:", error);

    return res.status(500).json({
      error: "Failed to fetch trips",
    });
  }
}

// EJS controllers

export async function listTripsPage(req, res) {
  return res.render("trips/list", { title: "Scenic Train Trips" });
}

export async function tripDetailsPage(req, res) {
  try {
    const { tripId } = req.params;

    const details = await findTripById(tripId);

    if (!details) {
      return res.status(404).render("errors/404", { title: "Trip Not Found" });
    }

    const db = getDb();
    details.schedules = await db.collection("schedules").find({ tripId }).toArray();

    return res.render("trips/details", { title: "Trip Details", details });
  } catch (error) {
    console.error("Error fetching trip details:", error);

    return res.status(500).render("errors/500", { title: "Server Error" });
  }
}

/**
 * PUT /api/trips/:id
 * Only accessible to admins
 */
export async function updateTripApi(req, res) {
  try {
    const { id } = req.params;
    const allowedUpdates = {};
    if (req.body.name !== undefined) allowedUpdates.name = req.body.name;
    
    // Support both naming conventions to avoid schema mismatches
    if (req.body.startStation !== undefined) allowedUpdates.startStation = req.body.startStation;
    if (req.body.endStation !== undefined) allowedUpdates.endStation = req.body.endStation;
    if (req.body.origin !== undefined) allowedUpdates.origin = req.body.origin;
    if (req.body.destination !== undefined) allowedUpdates.destination = req.body.destination;

    if (req.body.distance !== undefined) allowedUpdates.distance = Number(req.body.distance);
    if (req.body.basePrice !== undefined) allowedUpdates.basePrice = Number(req.body.basePrice);
    if (req.body.stations !== undefined) allowedUpdates.stations = req.body.stations;
    if (req.body.schedules !== undefined) allowedUpdates.schedules = req.body.schedules;
    if (req.body.description !== undefined) allowedUpdates.description = req.body.description;
    if (req.body.isActive !== undefined) allowedUpdates.isActive = Boolean(req.body.isActive);

    const updatedTrip = await updateTripModel(id, allowedUpdates);
    if (!updatedTrip) {
      return res.status(404).json({ message: "Trip not found" });
    }
    return res.status(200).json(updatedTrip);
  } catch (error) {
    console.error("Error updating trip:", error);
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid trip ID format" });
    }
    return res.status(500).json({ message: "Internal server error while updating trip" });
  }
}

/**
 * DELETE /api/trips/:id
 * Only accessible to admins
 */
export async function deleteTripApi(req, res) {
  try {
    const { id } = req.params;

    const result = await deleteTripModel(id);

    if (!result) {
      return res.status(404).json({ message: "Trip not found" });
    }

    return res.status(200).json({ message: "Trip successfully deleted" });
  } catch (error) {
    console.error("Error deleting trip:", error);
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid trip ID format" });
    }
    return res.status(500).json({ message: "Internal server error while deleting trip" });
  }
}

/**
 * GET /trips-admin
 * Admin dashboard for managing trips
 */
export async function tripsAdminPage(req, res) {
  return res.render("trips/admin", {
    title: "Trip Management"
  });
}
