import {
  generateAccommodationSearchResults,
  generateFlightSearchResults,
  generateSampleSeatSelection,
} from "@/ai/actions";
import { authClient } from "@/lib/auth-client";
import { generateUUID } from "@/lib/utils";
import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { headers } from "next/headers";
import { z } from "zod";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  // Extract the `messages` from the body of the request
  const { messages, id } = await req.json();

  console.log("chat id", id); // can be used for persisting the chat

  // Call the language model
  const result = streamText({
    model: openai("gpt-4o-mini", {}),
    // system: `\n
    //   - you help users book flights and accomodations!
    //   - be concise. keep your responses limited to a sentence.
    //   - DO NOT UNDER ANY CIRCUMSTANCES output lists.
    //   - after every tool call, pretend you're showing the result to the user and you MUST keep your response limited to a sentence.
    //   - today's date is ${new Date().toLocaleDateString()}.
    //   - ask follow up questions to nudge user into the optimal flow
    //   - ask for any details you don't know, like name of passenger, etc.'
    //   - C and D are aisle seats, A and F are window seats, B and E are middle seats
    //   - assume the most popular airports for the origin and destination
    //   - let the user only book accommodations and not flights if they ask for it
    //   - here's the optimal flow:
    //         - ask when will the user be travelling
    //         - ask if it is a round trip or not
    //         - search for outbound and/or inbound flights depending on user input
    //         - do booking flow for the chronologically first flight:
    //           - (step 1) choose flight
    //           - (step 2) select seats
    //           - (step 3) display reservation (ask user whether to proceed with payment or change reservation)
    //           - (step 4) authorize payment (requires user consent)
    //           - (step 5) wait for user to finish authorizing payment
    //           - (step 6) display boarding pass only when payment is authorized (DO NOT UNDER ANY CIRCUMSTANCES display boarding pass if payment is not authorized)
    //         - if the user wants a round trip repeat prompt the user the steps 1 to 6 for the second flight
    //         - ask user if they'd like to book accommodations at their destination
    //         - search for accommodations
    //         - choose accommodation
    //         - display accommodation details
    //         - authorize payment for accommodation
    //         - display booking confirmation
    // `,
    system: `\n
        You are a highly capable AI Travel Agent. Your job is to book flights and accommodations quickly and accurately. Always use very short and concise sentences.

        **Key Points:**
        - Use minimal, brief responses.
        - After any tool call, do not show detailed data. Only respond with a short phrase.
        - Today's date is ${new Date().toLocaleDateString()}.

        **Tools Available:**
        - 'searchFlights'
        - 'selectSeats'
        - 'displayReservation'
        - 'authorizePayment'
        - 'displayBoardingPass'
        - 'searchAccommodations'

        **Workflow:**

        1. **Trip Type:**
          - Ask: "Round trip or one-way?"
          - Get necessary details for outbound and inbound flights if needed.

        2. **Flight Booking Flow:**
          - **Outbound Flight:**
            - Use 'searchFlights' with departure details.
            - Ask user to choose.
          - **Inbound Flight (if round trip):**
            - Use 'searchFlights' for return.
            - Ask user to choose.
          - **For each flight leg:**
            - Use 'selectSeats' for seat choice.
            - Use 'displayReservation' to show current booking.
              - Ask: "Proceed or change?"
            - Use 'authorizePayment' after confirmation.
              - Wait for user consent.
            - After payment, use 'displayBoardingPass' only if payment was approved.

        3. **Accommodations Flow (if applicable):**
          - Ask: "Book accommodations?"
          - If yes, use 'searchAccommodations' with destination and dates.
          - Ask user to choose an option.
          - Display accommodation details briefly.
          - Use 'authorizePayment' for accommodation payment.
          - Confirm booking with a short phrase.

        **Final Reminders:**
        - Use very concise, short sentences at all times.
        - After each tool call, reply with a simple phrase only. Do not display tool data.
        - Always ask for missing information.
        - Confirm details before proceeding.

        Proceed with brevity and clarity.
    `,
    messages,
    tools: {
      searchFlights: {
        description: "Search for flights based on the given parameters",
        parameters: z.object({
          origin: z.string().describe("Origin airport iata code"),
          destination: z.string().describe("Destination airport iata code"),
          departureDate: z
            .string()
            .describe("Departure date in ISO 8601 format"),
        }),
        execute: async ({ origin, destination, departureDate }) => {
          const results = await generateFlightSearchResults({
            origin,
            destination,
            departureDate,
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
          const { data: session } = await authClient.getSession({
            fetchOptions: {
              headers: await headers(),
            },
          });

          const id = generateUUID();

          if (session && session.user && session.user.id) {
            return { ...props };
          } else {
            return {
              error: "User is not signed in to perform this action!",
            };
          }
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
      // createBooking: {
      //   description: "Create a booking",
      //   parameters: z.object({
      //     offerId: z.string().describe("Offer ID"),
      //     seats: z.string().array().describe("Array of selected seat numbers"),
      //     flightNumber: z.string().describe("Flight number"),
      //     departure: z.object({
      //       cityName: z.string().describe("Name of the departure city"),
      //       airportCode: z.string().describe("Code of the departure airport"),
      //       timestamp: z.string().describe("ISO 8601 date of departure"),
      //       gate: z.string().describe("Departure gate"),
      //       terminal: z.string().describe("Departure terminal"),
      //     }),
      //     arrival: z.object({
      //       cityName: z.string().describe("Name of the arrival city"),
      //       airportCode: z.string().describe("Code of the arrival airport"),
      //       timestamp: z.string().describe("ISO 8601 date of arrival"),
      //       gate: z.string().describe("Arrival gate"),
      //       terminal: z.string().describe("Arrival terminal"),
      //     }),
      //     passengerName: z.string().describe("Name of the passenger"),
      //     totalPriceInEuros: z
      //       .number()
      //       .describe("Total price in Euros including flight and seat"),
      //   }),
      //   execute: async (props) => {
      //     const { data: session } = await authClient.getSession({
      //       fetchOptions: {
      //         headers: await headers(),
      //       },
      //     });

      //     const id = generateUUID();

      //     if (session && session.user && session.user.id) {
      //       return { ...props };
      //     } else {
      //       return {
      //         error: "User is not signed in to perform this action!",
      //       };
      //     }
      //   },
      // },
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
