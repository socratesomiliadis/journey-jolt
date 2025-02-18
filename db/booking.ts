"use server";

import { db } from "@/db";
import { eq } from "drizzle-orm";
import {
  booking,
  bookingPassenger,
  bookingFlight,
  bookingHotel,
  flight,
  passengerFlight,
} from "@/db/schema";
import { authClient } from "@/lib/auth-client";
import { headers } from "next/headers";
import { Duffel } from "@duffel/api";
import { env } from "@/lib/env";
import { nanoid } from "nanoid";

const duffel = new Duffel({
  token: env.DUFFEL_TOKEN,
});

type bookingInsert = typeof booking.$inferInsert;
type bookingSelect = typeof booking.$inferSelect;
type bookingPassengerInsert = typeof bookingPassenger.$inferInsert;
type bookingFlightInsert = typeof bookingFlight.$inferInsert;
type bookingHotelInsert = typeof bookingHotel.$inferInsert;
type flightInsert = typeof flight.$inferInsert;

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
    bookingReference: nanoid(),
    bookingDate: new Date().toISOString(),
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

function transformFlightData(apiResponse: any) {
  const { offers } = apiResponse.data;

  return offers.map((offer: any) => {
    const slice = offer.slices[0];
    const segments = slice.segments;
    const offerId = offer.id;

    // Handling a direct flight (one segment)
    if (segments.length === 1) {
      const seg = segments[0];
      const flightNumber = `${seg.marketing_carrier.iata_code}${seg.marketing_carrier_flight_number}`;
      const airlines = Array.from(
        new Set([seg.marketing_carrier.name, seg.operating_carrier.name])
      );
      const cabinClass = seg.passengers[0].cabin_class;
      const totalDistanceInMiles = parseFloat(seg.distance) * 0.621371;

      return {
        offerId,
        flightNumber,
        departure: {
          cityName: seg.origin.city_name,
          airportCode: seg.origin.iata_code,
          airportName: seg.origin.name,
          timestamp: seg.departing_at,
          terminal: seg.origin_terminal || "",
          gate: "",
        },
        arrival: {
          cityName: seg.destination.city_name,
          airportCode: seg.destination.iata_code,
          airportName: seg.destination.name,
          timestamp: seg.arriving_at,
          terminal: seg.destination_terminal || "",
          gate: "",
        },
        airlines,
        cabinClass,
        totalDistanceInMiles,
        priceInEuros: offer.total_amount,
      };
    }
    // Handling a connecting flight (two segments)
    else if (segments.length === 2) {
      const firstSeg = segments[0];
      const secondSeg = segments[1];
      const flightNumber = `${firstSeg.marketing_carrier.iata_code}${firstSeg.marketing_carrier_flight_number} / ${secondSeg.marketing_carrier.iata_code}${secondSeg.marketing_carrier_flight_number}`;
      const airlines = Array.from(
        new Set([
          firstSeg.marketing_carrier.name,
          firstSeg.operating_carrier.name,
          secondSeg.marketing_carrier.name,
          secondSeg.operating_carrier.name,
        ])
      );
      const cabinClass = firstSeg.passengers[0].cabin_class; // assuming consistent cabin class
      const totalDistanceInMiles =
        (parseFloat(firstSeg.distance) + parseFloat(secondSeg.distance)) *
        0.621371;

      return {
        offerId,
        flightNumber,
        departure: {
          cityName: firstSeg.origin.city_name,
          airportCode: firstSeg.origin.iata_code,
          airportName: firstSeg.origin.name,
          timestamp: firstSeg.departing_at,
          terminal: firstSeg.origin_terminal || "",
          gate: "",
        },
        connection: {
          airportCode: firstSeg.destination.iata_code,
          airportName: firstSeg.destination.name,
          arrivalTimestamp: firstSeg.arriving_at,
          departureTimestamp: secondSeg.departing_at,
        },
        arrival: {
          cityName: secondSeg.destination.city_name,
          airportCode: secondSeg.destination.iata_code,
          airportName: secondSeg.destination.name,
          timestamp: secondSeg.arriving_at,
          terminal: secondSeg.destination_terminal || "",
          gate: "",
        },
        airlines,
        cabinClass,
        totalDistanceInMiles,
        priceInEuros: offer.total_amount,
      };
    }
    // Fallback: if segments count is unexpected, return data based on the first segment.
    else {
      const seg = segments[0];
      const flightNumber = `${seg.marketing_carrier.iata_code}${seg.marketing_carrier_flight_number}`;
      const airlines = Array.from(
        new Set([seg.marketing_carrier.name, seg.operating_carrier.name])
      );
      const cabinClass = seg.passengers[0].cabin_class;
      const totalDistanceInMiles = parseFloat(seg.distance) * 0.621371;

      return {
        offerId,
        flightNumber,
        departure: {
          cityName: seg.origin.city_name,
          airportCode: seg.origin.iata_code,
          airportName: seg.origin.name,
          timestamp: seg.departing_at,
          terminal: seg.origin_terminal || "",
          gate: "",
        },
        arrival: {
          cityName: seg.destination.city_name,
          airportCode: seg.destination.iata_code,
          airportName: seg.destination.name,
          timestamp: seg.arriving_at,
          terminal: seg.destination_terminal || "",
          gate: "",
        },
        airlines,
        cabinClass,
        totalDistanceInMiles,
        priceInEuros: offer.total_amount,
      };
    }
  });
}

export async function createFlightBooking({
  bookingId,
  flightOfferId,
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
  flightOfferId: string;
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

  const flightInsertData: flightInsert = {
    flightNumber,
    departureAirport,
    arrivalAirport,
    departureTime,
    arrivalTime,
    airline,
  };

  let flightId: string;

  try {
    const flightResult = await db
      .insert(flight)
      .values(flightInsertData)
      .returning();
    flightId = flightResult[0].id;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to create flight");
  }

  const bookingFlightData: bookingFlightInsert = {
    bookingId,
    flightId,
    cabinClass,
    priceAmount,
    priceCurrency,
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
}: {
  bookingId: string;
  pricePerNight: string;
  checkInDate: string;
  checkOutDate: string;
  accommodationNameAddressCityCountry: string;
  accommodationStarRating: number;
}) {
  const [
    accommodationName,
    accommodationAddress,
    accommodationCity,
    accommodationCountry,
  ] = accommodationNameAddressCityCountry.split(",");
  const bookingHotelData: bookingHotelInsert = {
    bookingId,
    pricePerNight,
    priceCurrency: "EUR",
    numberOfRooms: 1,
    checkInDate,
    checkOutDate,
    name: accommodationName,
    address: accommodationAddress,
    city: accommodationCity,
    country: accommodationCountry,
    starRating: Math.round(accommodationStarRating),
    hotelRoomId: "test",
  };

  await db.insert(bookingHotel).values(bookingHotelData);

  return bookingId;
}
