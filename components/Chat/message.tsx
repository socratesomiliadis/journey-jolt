"use client";

import { Attachment, ToolInvocation } from "ai";
import { motion } from "framer-motion";
import { ReactNode } from "react";

import { Markdown } from "./markdown";
import { PreviewAttachment } from "./preview-attachment";
import { Weather } from "./weather";
import { AuthorizePayment } from "@/components/Chat/flights/authorize-payment";
import { DisplayBoardingPass } from "@/components/Chat/flights/boarding-pass";
import { DisplayReservation } from "@/components/Chat/flights/display-reservation";
import { FlightStatus } from "@/components/Chat/flights/flight-status";
import { ListFlights } from "@/components/Chat/flights/list-flights";
import { SelectSeats } from "@/components/Chat/flights/select-seats";
import { VerifyPayment } from "@/components/Chat/flights/verify-payment";
import { cn } from "@/lib/utils";
import { ListAccommodations } from "./accommodations/list-accommodations";
import { PassengerList } from "./passenger-list";

export const Message = ({
  chatId,
  role,
  content,
  toolInvocations,
  attachments,
}: {
  chatId: string;
  role: string;
  content: string | ReactNode;
  toolInvocations: Array<ToolInvocation> | undefined;
  attachments?: Array<Attachment>;
}) => {
  return (
    <motion.div
      className={cn(
        "flex flex-row gap-4 px-4 w-full md:w-[40%] md:px-0 first-of-type:pt-20",
        role === "user" && "justify-end"
      )}
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
    >
      {/* <div className="size-[24px] border rounded-sm p-1 flex flex-col justify-center items-center shrink-0 text-zinc-500">
        {role === "assistant" ? <Bot /> : <User />}
      </div> */}

      <div
        className={cn(
          "flex flex-col gap-2 w-full",
          role === "user" &&
            "w-fit text-right bg-jjBlack/[0.04] dark:bg-white/[0.04] rounded-3xl px-6 py-4"
        )}
      >
        {toolInvocations && (
          <div className="flex flex-col gap-4">
            {toolInvocations.map((toolInvocation) => {
              const { toolName, toolCallId, state } = toolInvocation;

              if (state === "result") {
                const { result } = toolInvocation;

                return (
                  <div key={toolCallId}>
                    {toolName === "getWeather" ? (
                      <Weather weatherAtLocation={result} />
                    ) : toolName === "displayFlightStatus" ? (
                      <FlightStatus flightStatus={result} />
                    ) : toolName === "searchFlights" ? (
                      <ListFlights chatId={chatId} results={result} />
                    ) : toolName === "getPassengers" ? (
                      <PassengerList passengers={result} />
                    ) : toolName === "selectSeats" ? (
                      <SelectSeats chatId={chatId} availability={result} />
                    ) : toolName === "displayReservation" ? (
                      Object.keys(result).includes("error") ? null : (
                        <DisplayReservation reservation={result} />
                      )
                    ) : toolName === "authorizePayment" ? (
                      <AuthorizePayment chatId={chatId} intent={result} />
                    ) : toolName === "displayBoardingPass" ? (
                      <DisplayBoardingPass boardingPass={result} />
                    ) : toolName === "verifyPayment" ? (
                      <VerifyPayment result={result} />
                    ) : toolName === "searchAccommodations" ? (
                      <ListAccommodations chatId={chatId} results={result} />
                    ) : (
                      <div>{JSON.stringify(result, null, 2)}</div>
                    )}
                  </div>
                );
              } else {
                return (
                  <div key={toolCallId} className="skeleton">
                    {toolName === "getWeather" ? (
                      <Weather />
                    ) : toolName === "displayFlightStatus" ? (
                      <FlightStatus />
                    ) : toolName === "searchFlights" ? (
                      <ListFlights chatId={chatId} />
                    ) : toolName === "getPassengers" ? (
                      <PassengerList />
                    ) : toolName === "selectSeats" ? (
                      <SelectSeats chatId={chatId} />
                    ) : toolName === "displayReservation" ? (
                      <DisplayReservation />
                    ) : toolName === "authorizePayment" ? (
                      <AuthorizePayment chatId={chatId} />
                    ) : toolName === "displayBoardingPass" ? (
                      <DisplayBoardingPass />
                    ) : toolName === "searchAccommodations" ? (
                      <ListAccommodations chatId={chatId} />
                    ) : null}
                  </div>
                );
              }
            })}
          </div>
        )}
        {content && typeof content === "string" && (
          <div className="text-zinc-800 dark:text-zinc-300 flex flex-col gap-1">
            <Markdown>{content}</Markdown>
          </div>
        )}
      </div>
    </motion.div>
  );
};
