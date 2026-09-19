//src/routes/ejs-routes.js
import { Router } from "express";
import { listTripsPage, tripDetailsPage } from "../controllers/trips.js";

const router = Router();

router.get("/trips", listTripsPage);
router.get("/trips/:tripId", tripDetailsPage);

export default router;