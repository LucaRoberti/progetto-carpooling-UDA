import * as bookingService from "../services/booking.service.js";

export async function create(req, res, next) {
  try {
    const booking = await bookingService.createBooking(req.user.id, req.body.idViaggio, req.body.messaggio);
    res.status(201).json(booking);
  } catch (err) {
    next(err);
  }
}

export async function updateStatus(req, res, next) {
  try {
    const booking = await bookingService.updateBookingStatus(
      Number(req.params.id),
      req.user.id,
      req.body.stato
    );
    res.json(booking);
  } catch (err) {
    next(err);
  }
}

export async function getMyBookings(req, res, next) {
  try {
    let bookings;
    if (req.user.role === "passeggero") {
      bookings = await bookingService.getPassengerBookings(req.user.id);
    } else {
      bookings = await bookingService.getDriverBookings(req.user.id);
    }
    res.json(bookings);
  } catch (err) {
    next(err);
  }
}
