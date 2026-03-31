import * as carService from "../services/car.service.js";

export async function add(req, res, next) {
  try {
    const car = await carService.addCar(req.user.id, req.body);
    res.status(201).json(car);
  } catch (err) {
    next(err);
  }
}

export async function getMyCars(req, res, next) {
  try {
    const cars = await carService.getDriverCars(req.user.id);
    res.json(cars);
  } catch (err) {
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    await carService.deleteCar(req.params.targa, req.user.id);
    res.json({ message: "Macchina eliminata" });
  } catch (err) {
    next(err);
  }
}
