import * as authService from "../services/auth.service.js";

export async function register(req, res, next) {
  try {
    const { role, ...data } = req.body;
    let result;
    if (role === "autista") {
      result = await authService.registerDriver(data);
    } else {
      result = await authService.registerPassenger(data);
    }
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
