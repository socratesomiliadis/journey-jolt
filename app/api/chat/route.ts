import {
  generateAccommodationSearchResults,
  generateFlightSearchResults,
  generateSampleSeatSelection,
  getOfferById,
} from "@/ai/actions";
import { authClient } from "@/lib/auth-client";
import { generateUUID } from "@/lib/utils";
import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import { streamText } from "ai";
import { headers } from "next/headers";
import { z } from "zod";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { passenger } from "@/db/schema";
import {
  createAccommodationBooking,
  createFlightBooking,
  createInitialBooking,
} from "@/db/booking";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const headersList = await headers();
  const { data: session } = await authClient.getSession({
    fetchOptions: {
      headers: headersList,
    },
  });

  if (!session || !session.user || !session.user.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Extract the `messages` from the body of the request
  const { messages, id } = await req.json();

  console.log("chat id", id); // can be used for persisting the chat

  // Call the language model
  const result = streamText({
    model: google("gemini-2.0-flash-001"),
    maxSteps: 10,
    maxRetries: 4,
    system: `\n
      - you help users book flights and accommodations.
      - today's date is ${new Date().toLocaleDateString()}
      - your answers and questions must be concise and to the point.
      - DO NOT output lists.
      - you must use tools whenever possible.
      - you must not output/display lists of flights, seats, accommodations, etc.
      - ask follow up questions to nudge user into the optimal flow
      - ask questions to get the information you need to book the flights or accommodations
      - assume the most popular airports for the origin and destination
      - to search for flights you need:
        - origin
        - destination
        - departure date
        - number of passengers
        - cabin class
      - to search for accommodations you need:
        - destination
        - check in date
        - check out date
        - number of guests
        - number of rooms
      - here is the optimal flow:
        - ask the user if they want to book a one-way or round trip.
        - use 'getPassengers' tool ask the user to select the passengers for the trip.
        - wait for the user to select the passengers.
        - use 'createInitialBooking' tool to create the initial booking.
        - ask necessary questions to get the information you need to book the flights.
        - search for flights separately for each desired flight leg.
        - for each flight leg:
          - use 'searchFlights' tool to find flights.
          - ask the user to choose a flight, without outputting a list of flights.
          - use 'selectSeats' tool to prompt the user for seat selection.
          - use 'displayReservation' tool without outputting a list of details.
          - ask if he wants to continue to payment or change something.
          - use 'authorizePayment' tool if the user wants to continue to payment.
          - wait for payment authorization.
          - only after the user has authorized payment, use 'verifyPayment' tool to verify payment status.
          - use 'displayBoardingPass' tool to display the boarding pass after the payment is verified.
          - use 'createFlightBooking' tool to create the flight booking.
        - after the user has completed booking the flight or flights, you must ask if they want to book accommodations at their destination.
        - if they want to book accommodations, ask necessary questions to get the information you need to book the accommodations.
        - for accommodation booking:
          - ask if check in and check out dates are the same as the flight dates or not.
          - if they are not, ask for the check in and check out dates.
          - use 'searchAccommodations' tool to find accommodations.
          - ask the user to choose an accommodation, without outputting a list of accommodations.
          - use 'authorizePayment' tool
          - wait for payment authorization.
          - use 'verifyPayment' tool to verify payment status.
          - only after payment authorization is complete and you have verified the payment, confirm the booking details.
          - use 'createAccommodationBooking' tool to create the accommodation booking.
        - only after the booking is created, congratulate the user and say that the booking is complete and some basic details about the booking.
    `,

    messages,
    tools: {
      getPassengers: {
        description: "Get passengers associated with the user",
        parameters: z.object({
          userId: z.string().describe("User ID"),
        }),
        execute: async () => {
          const passengers = await db
            .select()
            .from(passenger)
            .where(eq(passenger.userId, session.user.id));
          return passengers;
        },
      },
      createInitialBooking: {
        description: "Create the initial booking",
        parameters: z.object({
          passengers: z.array(z.string()).describe("Passenger IDs"),
          bookingType: z
            .string()
            .describe("Type of booking, 'flight' or 'accommodation' or 'both'"),
        }),
        execute: async ({ passengers, bookingType }) => {
          const bookingId = await createInitialBooking({
            passengers,
            bookingType,
          });
          return bookingId;
        },
      },
      searchFlights: {
        description: "Search for flights based on the given parameters",
        parameters: z.object({
          origin: z.string().describe("Origin airport iata code"),
          destination: z.string().describe("Destination airport iata code"),
          departureDate: z
            .string()
            .describe("Departure date in ISO 8601 format"),
          passengers: z.array(z.string()).describe("Passenger IDs"),
        }),
        execute: async ({ origin, destination, departureDate, passengers }) => {
          const results = await generateFlightSearchResults({
            origin,
            destination,
            departureDate,
            passengers,
          });

          return results;
        },
      },
      selectSeats: {
        description: "Select seats for a flight",
        parameters: z.object({
          flightNumber: z.string().describe("Flight number"),
        }),
        execute: async ({ flightNumber }) => {
          const seats = await generateSampleSeatSelection({ flightNumber });
          return seats;
        },
      },
      displayReservation: {
        description: "Display pending reservation details",
        parameters: z.object({
          offerId: z.string().describe("Offer ID"),
          seats: z.string().array().describe("Array of selected seat numbers"),
          flightNumber: z.string().describe("Flight number"),
          departure: z.object({
            cityName: z.string().describe("Name of the departure city"),
            airportCode: z.string().describe("Code of the departure airport"),
            timestamp: z.string().describe("ISO 8601 date of departure"),
            gate: z.string().describe("Departure gate"),
            terminal: z.string().describe("Departure terminal"),
          }),
          arrival: z.object({
            cityName: z.string().describe("Name of the arrival city"),
            airportCode: z.string().describe("Code of the arrival airport"),
            timestamp: z.string().describe("ISO 8601 date of arrival"),
            gate: z.string().describe("Arrival gate"),
            terminal: z.string().describe("Arrival terminal"),
          }),
          passengerName: z.string().describe("Name of the passenger"),
          totalPriceInEuros: z
            .number()
            .describe("Total price in Euros including flight and seat"),
        }),
        execute: async (props) => {
          return { ...props };
        },
      },
      authorizePayment: {
        description:
          "User will enter credentials to authorize payment, wait for user to repond when they are done",
        parameters: z.object({
          offerId: z.string().describe("Unique identifier for the offer"),
        }),
        execute: async ({ offerId }) => {
          return { offerId };
        },
      },
      verifyPayment: {
        description: "Verify payment status and confirm booking",
        parameters: z.object({
          offerId: z.string().describe("Unique identifier for the offer"),
        }),
        execute: async ({ offerId }) => {
          return { hasCompletedPayment: true };
        },
      },
      displayBoardingPass: {
        description: "Display a boarding pass",
        parameters: z.object({
          reservationId: z
            .string()
            .describe("Unique identifier for the reservation"),
          passengerName: z
            .string()
            .describe("Name of the passenger, in title case"),
          flightNumber: z.string().describe("Flight number"),
          seat: z.string().describe("Seat number"),
          departure: z.object({
            cityName: z.string().describe("Name of the departure city"),
            airportCode: z.string().describe("Code of the departure airport"),
            airportName: z.string().describe("Name of the departure airport"),
            timestamp: z.string().describe("ISO 8601 date of departure"),
            terminal: z.string().describe("Departure terminal"),
            gate: z.string().describe("Departure gate"),
          }),
          arrival: z.object({
            cityName: z.string().describe("Name of the arrival city"),
            airportCode: z.string().describe("Code of the arrival airport"),
            airportName: z.string().describe("Name of the arrival airport"),
            timestamp: z.string().describe("ISO 8601 date of arrival"),
            terminal: z.string().describe("Arrival terminal"),
            gate: z.string().describe("Arrival gate"),
          }),
        }),
        execute: async (boardingPass) => {
          return boardingPass;
        },
      },
      createFlightBooking: {
        description: "Create a flight booking",
        parameters: z.object({
          bookingId: z
            .string()
            .describe("Unique identifier for the booking we initialized"),
          flightOfferId: z
            .string()
            .describe("Unique identifier for the flight offer"),
          cabinClass: z.string().describe("Cabin class"),
          priceAmount: z.string().describe("Price amount"),
          priceCurrency: z.string().describe("Price currency"),
          airline: z.string().describe("Airline"),
          flightNumber: z.string().describe("Flight number"),
          departureAirport: z.string().describe("Departure airport"),
          arrivalAirport: z.string().describe("Arrival airport"),
          departureTime: z.string().describe("Departure time"),
          arrivalTime: z.string().describe("Arrival time"),
        }),
        execute: async ({
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
        }) => {
          const bId = await createFlightBooking({
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
          });
          return bId;
        },
      },
      searchAccommodations: {
        description: "Search for accomodations based on the given parameters",
        parameters: z.object({
          destinationCountry: z.string().describe("Country of the destination"),
          destinationCity: z.string().describe("City of the destination"),
          checkInDate: z.string().describe("Check in date in ISO 8601 format"),
          checkOutDate: z
            .string()
            .describe("Check out date in ISO 8601 format"),
        }),
        execute: async ({
          destinationCountry,
          destinationCity,
          checkInDate,
          checkOutDate,
        }) => {
          const results = await generateAccommodationSearchResults({
            destinationCountry,
            destinationCity,
            checkInDate,
            checkOutDate,
          });

          return results;
        },
      },
      createAccommodationBooking: {
        description: "Create an accommodation booking",
        parameters: z.object({
          bookingId: z.string().describe("Unique identifier for the booking"),

          pricePerNight: z.string().describe("Price per night"),
          checkInDate: z.string().describe("Check in date in ISO 8601 format"),
          checkOutDate: z
            .string()
            .describe("Check out date in ISO 8601 format"),
          accommodationNameAddressCityCountry: z
            .string()
            .describe(
              "Accommodation name, address, city, country separated by commas"
            ),
          accommodationStarRating: z
            .number()
            .describe("Star rating of the accommodation"),
        }),
        execute: async ({
          bookingId,
          pricePerNight,
          checkInDate,
          checkOutDate,
          accommodationNameAddressCityCountry,
          accommodationStarRating,
        }) => {
          const booking = await createAccommodationBooking({
            bookingId,
            pricePerNight,
            checkInDate,
            checkOutDate,
            accommodationNameAddressCityCountry,
            accommodationStarRating,
          });
          return booking;
        },
      },
      // createBooking: {
      //   description: "Create the final trip booking",
      //   parameters: z.object({
      //     flightOfferId: z
      //       .string()
      //       .describe("Unique identifier for the flight offer"),
      //     accommodationOfferId: z
      //       .string()
      //       .describe("Unique identifier for the accommodation offer"),
      //     passengers: z.array(z.string()).describe("Passenger IDs"),
      //     bookingType: z
      //       .string()
      //       .describe("Type of booking, 'flight' or 'accommodation' or 'both'"),
      //     flightCost: z.number().describe("Cost of the flight in Euros"),

      //     accommodationName: z.string().describe("Name of the accommodation"),
      //     accommodationAddress: z
      //       .string()
      //       .describe("Address of the accommodation"),
      //     checkInDate: z.string().describe("Check in date in ISO 8601 format"),
      //     checkOutDate: z
      //       .string()
      //       .describe("Check out date in ISO 8601 format"),
      //     accommodationCity: z.string().describe("City of the accommodation"),
      //     accommodationCountry: z
      //       .string()
      //       .describe("Country of the accommodation"),
      //     accommodationPricePerNight: z
      //       .number()
      //       .describe("Price per night of the accommodation in Euros"),
      //     accommodationStarRating: z
      //       .number()
      //       .describe("Star rating of the accommodation"),
      //     totalAmount: z
      //       .number()
      //       .describe("Total amount of the booking in Euros"),
      //   }),
      //   execute: async ({
      //     flightOfferId,
      //     accommodationOfferId,
      //     passengers,
      //     bookingType,
      //     flightCost,
      //     accommodationName,
      //     accommodationAddress,
      //     checkInDate,
      //     checkOutDate,
      //     accommodationCity,
      //     accommodationCountry,
      //     accommodationPricePerNight,
      //     accommodationStarRating,
      //     totalAmount,
      //   }) => {
      //     const data = await createBooking({
      //       flightOfferId,
      //       accommodationOfferId,
      //       passengers,
      //       bookingType,
      //       flightCost,
      //       accommodationName,
      //       accommodationAddress,
      //       checkInDate,
      //       checkOutDate,
      //       accommodationCity,
      //       accommodationCountry,
      //       accommodationPricePerNight,
      //       accommodationStarRating,
      //       totalAmount,
      //     });

      //     return data;
      //   },
      // },
    },

    async onError(error) {
      console.error("Error", error);
    },
    async onFinish({ text, toolCalls, toolResults, usage, finishReason }) {
      console.log("text", text);
      console.log("finishReason", finishReason);
      console.log("toolCalls", toolCalls);
      console.log("toolResults", toolResults);
      console.log("usage", usage);
    },
  });

  // Respond with the stream
  return result.toDataStreamResponse();
}
