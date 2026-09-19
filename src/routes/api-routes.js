//src/routes/api-routes.js
import { Router } from "express";
import { getTripById, getAllTrips } from "../controllers/trips.js";

const router = Router();

/**
 * @openapi
 * /api/trips:
 *   get:
 *     summary: Get all trips
 *     tags: [Trips]
 *     responses:
 *       200:
 *         description: A list of trips
 *       500:
 *         description: Server error
 */
router.get("/trips", getAllTrips);

/**
 * @openapi
 * /api/trips/{id}:
 *   get:
 *     summary: Get a trip by ID
 *     tags: [Trips]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: The trip
 *       404:
 *         description: Trip not found
 *       500:
 *         description: Server error
 */
router.get("/trips/:id", getTripById);

export default router;