import { Router } from "express";
import * as tripCtrl from "../controllers/trip.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";

const router = Router();

// Public: search trips
router.get("/", tripCtrl.search);
router.get("/mine", authenticate, authorize("autista"), tripCtrl.getMyTrips);
router.get("/:id", tripCtrl.getById);

// Driver only
router.post("/", authenticate, authorize("autista"), tripCtrl.create);
router.put("/:id", authenticate, authorize("autista"), tripCtrl.update);
router.delete("/:id", authenticate, authorize("autista"), tripCtrl.remove);

export default router;
