import { eq } from "drizzle-orm";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import {
  flight,
  bookingFlight,
  passengerFlight,
} from "./schema";
import {
  FlightBookingResponse,
  Segment,
  Passenger,
  Aircraft,
} from "@/types/flightTypes";
import { uuid } from "drizzle-orm/pg-core";

async function saveFlightBooking(
  db: PostgresJsDatabase,
  bookingId: string
): Promise<void> {
  try {
    //TODO remove if no API is used or update with the correct API route
    const response = await fetch("");

    const jsonFlightBookingData =
      (await response.json()) as FlightBookingResponse;
    const jsonSegmentData = (await response.json()) as Segment;
    const jsonPassengerData = (await response.json()) as Passenger;
    const jsonAircraftData = (await response.json()) as Aircraft;

    type bookingFlightInsertType = typeof bookingFlight.$inferInsert;
    type flightInsertType = typeof flight.$inferInsert;
    type passengerFlightInsertType = typeof passengerFlight.$inferInsert;

    const bookingFlightId = uuid().toString();

    const newBookingFlight: bookingFlightInsertType = {
      bookingId,
      flightId: jsonFlightBookingData.data.id,
      cabinClass: jsonPassengerData.cabin_class ?? "Economy",
      priceAmount: jsonFlightBookingData.data.total_amount,
      priceCurrency: jsonFlightBookingData.data.total_currency,
    };

    const newFlight: flightInsertType = {
      flightNumber: jsonFlightBookingData.data.booking_reference,
      airline: jsonFlightBookingData.data.owner.toString(),
      departureAirport: jsonSegmentData.origin.toString(),
      arrivalAirport: jsonSegmentData.destination.toString(),
      departureTime: jsonSegmentData.departing_at,
      arrivalTime: jsonSegmentData.arriving_at,
      aircraftType: jsonAircraftData.name,
    };

    const newPassengerFlight: passengerFlightInsertType = {
      bookingFlightId: bookingFlightId,
      passengerId: jsonPassengerData.passenger_id,
      seatNumber: jsonPassengerData.seat?.name ?? "N/A", //TODO: chekc later for seat allocation
      baggageAllowance:
        jsonPassengerData.baggages
          ?.reduce((sum, bag) => sum + bag.quantity, 0)
          .toString() ?? "0",
    };

    const bookingFlightResult = await db
      .insert(bookingFlight)
      .values(newBookingFlight)
      .returning();
    console.log("Successfully saved flight booking data", bookingFlightResult);

    const flightResult = await db.insert(flight).values(newFlight).returning();
    console.log("Successfully saved flight data", flightResult);

    const result = await db
      .insert(passengerFlight)
      .values(newPassengerFlight)
      .returning();
    console.log("Successfully saved passenger flight data", result);
  } catch (error) {
    console.error("Error saving flight booking:", error);
    throw error;
  }
}
