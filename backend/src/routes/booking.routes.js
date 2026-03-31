import { Router } from "express";
import * as bookingCtrl from "../controllers/booking.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/mine", authenticate, bookingCtrl.getMyBookings);
router.post("/", authenticate, authorize("passeggero"), bookingCtrl.create);
router.put("/:id/status", authenticate, authorize("autista"), bookingCtrl.updateStatus);

export default router;
