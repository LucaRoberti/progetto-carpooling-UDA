import * as tripService from "../services/trip.service.js";

export async function create(req, res, next) {
  try {
    const trip = await tripService.createTrip(req.user.id, req.body);
    res.status(201).json(trip);
  } catch (err) {
    next(err);
  }
}

export async function search(req, res, next) {
  try {
    const trips = await tripService.searchTrips(req.query);
    res.json(trips);
  } catch (err) {
    next(err);
  }
}

export async function getById(req, res, next) {
  try {
    const trip = await tripService.getTripById(Number(req.params.id));
    res.json(trip);
  } catch (err) {
    next(err);
  }
}

export async function getMyTrips(req, res, next) {
  try {
    const trips = await tripService.getDriverTrips(req.user.id);
    res.json(trips);
  } catch (err) {
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const trip = await tripService.updateTrip(Number(req.params.id), req.user.id, req.body);
    res.json(trip);
  } catch (err) {
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    await tripService.deleteTrip(Number(req.params.id), req.user.id);
    res.json({ message: "Viaggio eliminato" });
  } catch (err) {
    next(err);
  }
}
