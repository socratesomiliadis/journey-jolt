import { generateUUID } from "@/lib/utils";
import { Chat } from "@/components/Chat";

const UIFlag = false;

export default async function ChatPage() {
  const id = generateUUID();
  const initialMessagesTest = [
    {
      id: generateUUID(),
      role: "assistant",
      content: "Here are some available flights:",
      toolInvocations: [
        {
          toolName: "searchFlights",
          toolCallId: generateUUID(),
          state: "result",
        },
      ],
    },
    {
      id: generateUUID(),
      role: "assistant",
      content: "Here are some available seats:",
      toolInvocations: [
        {
          toolName: "selectSeats",
          toolCallId: generateUUID(),
          state: "result",
        },
      ],
    },
    {
      id: generateUUID(),
      role: "assistant",
      content: "Here is the reservation:",
      toolInvocations: [
        {
          toolName: "displayReservation",
          toolCallId: generateUUID(),
          state: "result",
          result: {
            offerId: "offer_123",
            seats: ["4C"],
            flightNumber: "EK413",
            departure: {
              cityName: "Sydney",
              airportCode: "SYD",
              timestamp: "2023-11-01T06:00:00",
              gate: "A12",
              terminal: "1",
            },
            arrival: {
              cityName: "Chennai",
              airportCode: "MAA",
              timestamp: "2023-11-01T18:45:00",
              gate: "B5",
              terminal: "3",
            },
            passengerName: "John Doe",
            totalPriceInEuros: 1200,
          },
        },
      ],
    },
    {
      id: generateUUID(),
      role: "assistant",
      content: "Here is the payment:",
      toolInvocations: [
        {
          toolName: "authorizePayment",
          toolCallId: generateUUID(),
          state: "result",
          result: {
            reservationId: "reservation_test1",
          },
        },
      ],
    },
    {
      id: generateUUID(),
      role: "assistant",
      content: "Here is the boarding pass:",
      toolInvocations: [
        {
          toolName: "displayBoardingPass",
          toolCallId: generateUUID(),
          state: "result",
        },
      ],
    },
    {
      id: generateUUID(),
      role: "assistant",
      content: "Here are some available accommodations:",
      toolInvocations: [
        {
          toolName: "searchAccommodations",
          toolCallId: generateUUID(),
          state: "result",
        },
      ],
    },
    {
      id: generateUUID(),
      role: "assistant",
      content: "Here are the passengers:",
      toolInvocations: [
        {
          toolName: "getPassengers",
          toolCallId: generateUUID(),
          state: "result",
        },
      ],
    },
  ];
  return (
    <Chat
      key={id}
      id={id}
      //@ts-expect-error
      initialMessages={UIFlag ? initialMessagesTest : []}
    />
  );
}
