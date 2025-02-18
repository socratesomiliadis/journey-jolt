"use server";

import { db } from "@/db";
import { eq, sql } from "drizzle-orm";
import {
  booking,
  bookingPassenger,
  bookingFlight,
  bookingAccommodation,
  passengerFlight,
} from "@/db/schema";
import { authClient } from "@/lib/auth-client";
import { headers } from "next/headers";

type bookingInsert = typeof booking.$inferInsert;
type bookingSelect = typeof booking.$inferSelect;
type bookingPassengerInsert = typeof bookingPassenger.$inferInsert;
type bookingFlightInsert = typeof bookingFlight.$inferInsert;
type bookingAccommodationInsert = typeof bookingAccommodation.$inferInsert;
type bookingFlightSelect = typeof bookingFlight.$inferSelect;
type bookingAccommodationSelect = typeof bookingAccommodation.$inferSelect;

export type bookingSelectWithFlightAndAccommodation = bookingSelect & {
  booking_flights: bookingFlightSelect[];
  booking_accommodations: bookingAccommodationSelect[];
};

export async function createInitialBooking({
  passengers,
  bookingType,
}: {
  passengers: string[];
  bookingType: string;
}) {
  const { data: session } = await authClient.getSession({
    fetchOptions: {
      headers: await headers(),
    },
  });

  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }

  let bookingId: string;

  const bookingData: bookingInsert = {
    userId: session.user.id,
    bookingType,
    status: "pending",
    totalAmount: "0",
    currency: "EUR",
    paymentStatus: "pending",
  };

  try {
    const result = await db.insert(booking).values(bookingData).returning();
    bookingId = result[0].id;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to create booking");
  }

  const bookingPassengerData: bookingPassengerInsert[] = passengers.map(
    (passengerId) => ({
      bookingId,
      passengerId,
      isPrimary: false,
    })
  );

  await db.insert(bookingPassenger).values(bookingPassengerData);

  return bookingId;
}

export async function createFlightBooking({
  bookingId,
  cabinClass,
  priceAmount,
  priceCurrency,
  airline,
  flightNumber,
  departureAirport,
  arrivalAirport,
  departureTime,
  arrivalTime,
}: {
  bookingId: string;
  cabinClass: string;
  priceAmount: string;
  priceCurrency: string;
  airline: string;
  flightNumber: string;
  departureAirport: string;
  arrivalAirport: string;
  departureTime: string;
  arrivalTime: string;
}) {
  let initialBooking: bookingSelect[];
  try {
    initialBooking = await db
      .select()
      .from(booking)
      .where(eq(booking.id, bookingId));
  } catch (error) {
    console.error(error);
    throw new Error("Failed to get initial booking");
  }

  if (!initialBooking) {
    throw new Error("Booking not found");
  }

  const bookingFlightData: bookingFlightInsert = {
    bookingId,
    cabinClass,
    priceAmount,
    priceCurrency,
    flightNumber,
    airline,
    departureAirport,
    arrivalAirport,
    departureTime,
    arrivalTime,
  };

  //Update the booking type
  if (initialBooking[0].bookingType === "accommodation") {
    try {
      await db
        .update(booking)
        .set({ bookingType: "both" })
        .where(eq(booking.id, bookingId));
    } catch (error) {
      console.error(error);
      throw new Error("Failed to update booking type");
    }
  }

  try {
    await db.insert(bookingFlight).values(bookingFlightData);
  } catch (error) {
    console.error(error);
    throw new Error("Failed to create booking flight");
  }

  return bookingId;
}

export async function createAccommodationBooking({
  bookingId,
  pricePerNight,
  checkInDate,
  checkOutDate,
  accommodationNameAddressCityCountry,
  accommodationStarRating,
  numberOfRooms,
}: {
  bookingId: string;
  pricePerNight: string;
  checkInDate: string;
  checkOutDate: string;
  accommodationNameAddressCityCountry: string;
  accommodationStarRating: number;
  numberOfRooms: number;
}) {
  let initialBooking: bookingSelect[];
  try {
    initialBooking = await db
      .select()
      .from(booking)
      .where(eq(booking.id, bookingId));
  } catch (error) {
    console.error(error);
    throw new Error("Failed to get initial booking");
  }

  if (!initialBooking) {
    throw new Error("Booking not found");
  }

  if (initialBooking[0].bookingType === "flight") {
    try {
      await db
        .update(booking)
        .set({ bookingType: "both" })
        .where(eq(booking.id, bookingId));
    } catch (error) {
      console.error(error);
      throw new Error("Failed to update booking type");
    }
  }

  const [
    accommodationName,
    accommodationAddress,
    accommodationCity,
    accommodationCountry,
  ] = accommodationNameAddressCityCountry.split(",");
  const bookingAccommodationData: bookingAccommodationInsert = {
    bookingId,
    pricePerNight,
    priceCurrency: "EUR",
    numberOfRooms,
    checkInDate,
    checkOutDate,
    name: accommodationName,
    address: accommodationAddress,
    city: accommodationCity,
    country: accommodationCountry,
    starRating: Math.round(accommodationStarRating),
  };

  try {
    await db.insert(bookingAccommodation).values(bookingAccommodationData);
  } catch (error) {
    console.error(error);
    throw new Error("Failed to create booking accommodation");
  }

  return bookingId;
}

export async function getBookings(userId: string) {
  try {
    const bookings = await db
      .select({
        id: booking.id,
        userId: booking.userId,
        bookingType: booking.bookingType,
        status: booking.status,
        totalAmount: booking.totalAmount,
        currency: booking.currency,
        paymentStatus: booking.paymentStatus,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
        booking_flights: bookingFlight,
        booking_accommodations: bookingAccommodation,
      })
      .from(booking)
      .leftJoin(bookingFlight, eq(booking.id, bookingFlight.bookingId))
      .leftJoin(
        bookingAccommodation,
        eq(booking.id, bookingAccommodation.bookingId)
      )
      .where(eq(booking.userId, userId));

    // Group the results by booking to handle multiple flights/accommodations
    const groupedBookings: bookingSelectWithFlightAndAccommodation[] =
      bookings.reduce((acc, curr) => {
        const existingBooking = acc.find((b) => b.id === curr.id);

        if (!existingBooking) {
          acc.push({
            ...curr,
            booking_flights: curr.booking_flights ? [curr.booking_flights] : [],
            booking_accommodations: curr.booking_accommodations
              ? [curr.booking_accommodations]
              : [],
          });
        } else {
          if (
            curr.booking_flights &&
            !existingBooking.booking_flights.some(
              (f) => f.id === curr.booking_flights?.id
            )
          ) {
            existingBooking.booking_flights.push(curr.booking_flights);
          }
          if (
            curr.booking_accommodations &&
            !existingBooking.booking_accommodations.some(
              (a) => a.id === curr.booking_accommodations?.id
            )
          ) {
            existingBooking.booking_accommodations.push(
              curr.booking_accommodations
            );
          }
        }
        return acc;
      }, [] as bookingSelectWithFlightAndAccommodation[]);

    //return groupedBookings;

    const now = new Date();
    const { futureBookings, pastBookings } = groupedBookings.reduce(
      (acc, booking) => {
        const isInFuture = isFutureBooking(booking, now);
        if (isInFuture) {
          acc.futureBookings.push(booking);
        } else {
          acc.pastBookings.push(booking);
        }
        return acc;
      },
      { futureBookings: [], pastBookings: [] } as {
        futureBookings: bookingSelectWithFlightAndAccommodation[];
        pastBookings: bookingSelectWithFlightAndAccommodation[];
      }
    );

    return {
      futureBookings,
      pastBookings,
    };
  } catch (error) {
    console.error(error);
    throw new Error("Failed to get bookings");
  }

  function isFutureBooking(
  booking: bookingSelectWithFlightAndAccommodation,
  now: Date
): boolean {
  // Check flights
  const hasFutureFlights = booking.booking_flights.some((flight) => {
    return new Date(flight.departureTime) > now;
  });

  // Check accommodations
  const hasFutureAccommodations = booking.booking_accommodations.some((accommodation) => {
    return new Date(accommodation.checkOutDate) > now;
  });

  // A booking is considered future if either its flights or accommodations are in the future
  return hasFutureFlights || hasFutureAccommodations;
}
}

export async function deleteBookingInfo(bookingId: string): Promise<void> {
  try {
    await db.delete(booking).where(eq(booking.id, bookingId));
    console.log("Successfully deleted passenger info: ", bookingId);
  } catch (error) {
    console.error("Error deleting passenger info:", error);
    throw error;
  }
}

