import { Router } from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import * as userCtrl from "../controllers/user.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: path.join(__dirname, "../../public/uploads"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `avatar_${req.user.id}_${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Solo immagini consentite"));
  },
});

const router = Router();

router.get("/me", authenticate, userCtrl.getMe);
router.get("/public/:cf", authenticate, userCtrl.getPublicProfile);
router.put("/me", authenticate, userCtrl.updateMe);
router.post("/me/avatar", authenticate, upload.single("foto"), userCtrl.uploadAvatar);
router.delete("/me/avatar", authenticate, userCtrl.removeAvatar);

export default router;
