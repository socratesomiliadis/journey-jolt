import { z } from "zod";
import { Duffel } from "@duffel/api";
import { env } from "@/lib/env";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";

const duffel = new Duffel({
  token: env.DUFFEL_TOKEN,
});

const flightResultSchema = z.object({
  offerId: z.string().describe("Offer ID"),
  flightNumber: z.string().describe("Flight number, e.g., BA123, AA31"),
  departure: z.object({
    cityName: z.string().describe("Name of the departure city"),
    airportCode: z.string().describe("IATA code of the departure airport"),
    airportName: z.string().describe("Full name of the departure airport"),
    timestamp: z.string().describe("ISO 8601 departure date and time"),
    terminal: z.string().describe("Departure terminal"),
    gate: z.string().describe("Departure gate"),
  }),
  connection: z
    .object({
      airportCode: z.string().describe("IATA code of the connection airport"),
      airportName: z.string().describe("Full name of the connection airport"),
      arrivalTimestamp: z
        .string()
        .describe("ISO 8601 arrival time at connection"),
      departureTimestamp: z
        .string()
        .describe("ISO 8601 departure time from connection"),
    })
    .optional()
    .describe("Connection details if the flight is connecting"),
  arrival: z.object({
    cityName: z.string().describe("Name of the arrival city"),
    airportCode: z.string().describe("IATA code of the arrival airport"),
    airportName: z.string().describe("Full name of the arrival airport"),
    timestamp: z.string().describe("ISO 8601 arrival date and time"),
    terminal: z.string().describe("Arrival terminal"),
    gate: z.string().describe("Arrival gate"),
  }),
  airlines: z.array(z.string()).describe("List of airlines"),
  cabinClass: z.string().describe("Cabin class, e.g., economy, business"),
  totalDistanceInMiles: z.number().describe("Total flight distance in miles"),
  priceInEuros: z.number().describe("Price in euros"),
});

export async function generateFlightSearchResults({
  origin,
  destination,
  departureDate,
  passengers,
}: {
  origin: string;
  destination: string;
  departureDate: string;
  passengers: string[];
}) {
  const flights = await duffel.offerRequests.create({
    max_connections: 1,
    supplier_timeout: 5000,
    slices: [
      {
        origin: origin,
        destination: destination,
        departure_date: departureDate,
        arrival_time: null,
        departure_time: null,
      },
    ],
    passengers: passengers.map((passenger) => ({
      id: passenger,
      type: "adult",
    })),
  });

  const results = transformFlightData(flights);
  const resultsWithoutDuffelAirways = results.filter(
    (result: any) => !result.airlines.includes("Duffel Airways")
  );

  const firstSevenResults = resultsWithoutDuffelAirways.slice(0, 7);

  return { flights: firstSevenResults };
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

export async function generateSampleSeatSelection({
  flightNumber,
}: {
  flightNumber: string;
}) {
  const { object: rows } = await generateObject({
    model: google("gemini-2.0-flash-001"),
    prompt: `Simulate available seats for flight number ${flightNumber}, 6 seats on each row and 5 rows in total, adjust pricing based on location of seat, randomize availability of seats`,
    output: "array",
    schema: z.array(
      z.object({
        seatNumber: z.string().describe("Seat identifier, e.g., 12A, 15C"),
        priceInUSD: z
          .number()
          .describe("Seat price in Euros, less than 100EUR"),
        isAvailable: z
          .boolean()
          .describe("Whether the seat is available for booking"),
      })
    ),
  });

  return { seats: rows };
}

const accommodationSchema = z.object({
  id: z.string(),
  name: z.string(),
  location: z.object({
    city: z.string(),
    area: z.string(),
    distance: z.string(),
  }),
  type: z.enum(["Hotel", "Apartment", "Boutique Hotel"]),
  amenities: z.array(
    z.enum([
      "wifi",
      "parking",
      "spa",
      "kitchen",
      "restaurant",
      "pool",
      "gym",
      "breakfast",
    ])
  ),
  rating: z.number().min(0).max(5),
});

export async function generateAccommodationSearchResults({
  destinationCountry,
  destinationCity,
  checkInDate,
  checkOutDate,
}: {
  destinationCountry: string;
  destinationCity: string;
  checkInDate: string;
  checkOutDate: string;
}) {
  const { object: accommodations } = await generateObject({
    model: google("gemini-2.0-flash-001"),
    prompt: `Generate a list of 3-7 accommodations in ${destinationCity}, ${destinationCountry} for the dates ${checkInDate} to ${checkOutDate} follow the schema CAREFULLY`,
    output: "array",
    schema: z.object({
      id: z.string().describe("Unique identifier for the accommodation"),
      name: z.string().describe("Name of the accommodation"),
      location: z.object({
        city: z.string().describe("City of the accommodation"),
        area: z.string().describe("Area of the accommodation"),
        distance: z
          .string()
          .describe(
            "Distance from a significant landmark and the landmarks name"
          ),
      }),
      type: z
        .enum(["Hotel", "Apartment", "Boutique Hotel"])
        .describe("Type of the accommodation"),
      amenities: z.array(
        z
          .enum([
            "wifi",
            "parking",
            "spa",
            "kitchen",
            "pool",
            "gym",
            "breakfast",
          ])
          .describe("Amenities of the accommodation")
      ),
      rating: z.number().min(0).max(5).describe("Rating of the accommodation"),
      pricePerNight: z.number().positive().describe("Price per night in Euros"),
      currency: z.enum(["EUR"]).describe("Currency of the price"),
    }),
  });

  return { accommodations };
}

export async function getOfferById({ id }: { id: string }) {
  const offer = localStorage.getItem(id);
  if (!offer) {
    return {
      hasCompletedPayment: false,
    };
  }
  const parsed = JSON.parse(offer);
  return parsed;
}

// type OutputAccommodation = {
//   id: string;
//   name: string;
//   location: {
//     city: string;
//     area: string;
//     distance: string;
//   };
//   type: "Hotel" | "Apartment" | "Boutique Hotel";
//   amenities: Array<"wifi" | "parking" | "spa" | "kitchen" | "restaurant">;
//   rating: number;
//   pricePerNight: number;
//   currency: "EUR";
// };

// function transformAccommodationData(input: any): OutputAccommodation {
//   const accommodation = input.data.results[0].accommodation;

//   // Map amenities to the expected format
//   const amenityMapping: {
//     [key: string]: "wifi" | "parking" | "spa" | "kitchen" | "restaurant";
//   } = {
//     parking: "parking",
//     // Add more mappings as needed
//   };

//   const transformedAmenities = accommodation.amenities
//     .map((a: any) => amenityMapping[a.type])
//     .filter(
//       (a: any): a is "wifi" | "parking" | "spa" | "kitchen" | "restaurant" =>
//         a !== undefined
//     );

//   // Calculate price per night
//   const totalNights = calculateNights(
//     input.data.results[0].check_in_date,
//     input.data.results[0].check_out_date
//   );
//   const pricePerNight =
//     parseFloat(input.data.results[0].cheapest_rate_total_amount) / totalNights;

//   // Transform the rating to 5-star scale
//   const normalizedRating = accommodation.rating / 2;

//   return {
//     id: accommodation.id,
//     name: accommodation.name,
//     location: {
//       city: accommodation.location.address.city_name,
//       area: accommodation.location.address.region,
//       distance: "0km", // Default value as it's not provided in input
//     },
//     type: "Hotel", // Default value as it's not provided in input
//     amenities: transformedAmenities,
//     rating: normalizedRating,
//     pricePerNight,
//     currency: "EUR", // Fixed value as per schema
//   };
// }

// function calculateNights(checkIn: string, checkOut: string): number {
//   const checkInDate = new Date(checkIn);
//   const checkOutDate = new Date(checkOut);
//   const diffTime = Math.abs(checkOutDate.getTime() - checkInDate.getTime());
//   const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
//   return diffDays;
// }
