import * as userService from "../services/user.service.js";

export async function getMe(req, res, next) {
  try {
    const profile = await userService.getProfile(req.user.id, req.user.role);
    res.json(profile);
  } catch (err) {
    next(err);
  }
}

export async function getPublicProfile(req, res, next) {
  try {
    const profile = await userService.getPublicProfile(req.params.cf);
    res.json(profile);
  } catch (err) { next(err); }
}

export async function updateMe(req, res, next) {
  try {
    const updated = await userService.updateProfile(req.user.id, req.user.role, req.body);
    res.json(updated);
  } catch (err) { next(err); }
}

export async function uploadAvatar(req, res, next) {
  try {
    if (!req.file) throw { status: 400, message: "Nessun file caricato" };
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const fotoUrl = `${baseUrl}/uploads/${req.file.filename}`;
    const updated = await userService.updateProfile(req.user.id, req.user.role, { fotoUrl });
    res.json(updated);
  } catch (err) { next(err); }
}

export async function removeAvatar(req, res, next) {
  try {
    const updated = await userService.updateProfile(req.user.id, req.user.role, { fotoUrl: null });
    res.json(updated);
  } catch (err) { next(err); }
}
