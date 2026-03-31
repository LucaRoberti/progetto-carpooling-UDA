import { Router } from "express";
import * as carCtrl from "../controllers/car.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", authenticate, authorize("autista"), carCtrl.getMyCars);
router.post("/", authenticate, authorize("autista"), carCtrl.add);
router.delete("/:targa", authenticate, authorize("autista"), carCtrl.remove);

export default router;
