"use client";

import { bookingSelectWithFlightAndAccommodation } from "@/db/booking";
import { WarpBackground } from "../warp-background";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Ellipsis, Star, Trash2 } from "lucide-react";
import React, { useState } from "react";
import { DisplayBoardingPass } from "../Chat/flights/boarding-pass";

export default function TripsList({
  bookings,
}: {
  bookings: bookingSelectWithFlightAndAccommodation[];
}) {
  console.log(bookings);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };
  return (
    <WarpBackground
      gridColor="var(--warp-border)"
      className="h-full border-[1px] border-black/5 dark:border-white/5 rounded-2xl w-full overflow-hidden flex items-center justify-center"
    >
      <div className="mt-16 bg-white dark:bg-jjBlack rounded-2xl overflow-hidden border-[1px] border-jjBlack/10 dark:border-white/10">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-white/10">
              <th className="p-4 text-left font-medium">Trip</th>
              <th className="p-4 text-cetner font-medium">Date</th>
              <th className="p-4 text-right font-medium">Accommodation</th>
              <th className="p-4 text-right font-medium">More Info</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {bookings.map((booking) => (
                <React.Fragment key={booking.id}>
                  <motion.tr
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    onClick={() => toggleExpand(booking.id)}
                    className="group relative cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <span>
                            {booking.id}
                          </span>
                          <span className="text-gray-500 dark:text-white/40 text-xs">
                            {booking.bookingType}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-gray-900 dark:text-white">
                        {booking.booking_flights[0]?.departureTime || "N/A"}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <span className="text-gray-900 dark:text-white">
                        {booking.booking_accommodations[0]?.name || "N/A"}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => toggleExpand(booking.id)}
                        className="inline-flex items-center justify-center p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                      >
                        <motion.div
                          animate={{
                            rotate: expandedId === booking.id ? 180 : 0,
                          }}
                          transition={{ duration: 0.4 }}
                        >
                          <ChevronDown className="h-5 w-5" />
                        </motion.div>
                      </button>
                    </td>
                  </motion.tr>
                  {expandedId === booking.id && (
                    <motion.tr
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      style={{ overflow: "hidden" }}
                    >
                      <td
                        colSpan={4}
                        className="p-4 pt-0 bg-white dark:bg-jjBlack border-b-[1px] border-black/10 dark:border-white/10"
                      >
                        <div className="p-4">
                          <h3 className="text-lg font-medium mb-4">
                            Booking Details
                          </h3>

                          {booking.booking_flights.length > 0 && (
                            <div className="mb-4">
                              <h4 className="font-medium mb-2">Flights</h4>
                              {booking.booking_flights.map((flight) => (
                                <div
                                  key={flight.id}
                                  className="mb-2 text-gray-600 dark:text-white/70"
                                >
                                  From {flight.departureAirport} to{" "}
                                  {flight.arrivalAirport}, Flight Number:{" "}
                                  {flight.flightNumber},
                                  {/* <DisplayBoardingPass
                                    boardingPass={{
                                      flightNumber: flight.flightNumber,
                                      seat: "",
                                      departure: {
                                        cityName: "",
                                        airportCode: flight.departureAirport,
                                        airportName: "",
                                        timestamp: flight.departureTime,
                                        terminal: "",
                                        gate: "",
                                      },
                                      arrival: {
                                        cityName: "",
                                        airportCode: flight.arrivalAirport,
                                        airportName: "",
                                        timestamp: flight.arrivalTime,
                                        terminal: "",
                                        gate: "",
                                      },
                                      passengerName: "",
                                    }}
                                  /> */}
                                </div>
                              ))}
                            </div>
                          )}

                          {booking.booking_accommodations.length > 0 && (
                            <div>
                              <h4 className="font-medium mb-2">
                                Accommodations
                              </h4>
                              {booking.booking_accommodations.map(
                                (accommodation) => (
                                  <div
                                    key={accommodation.id}
                                    className="text-gray-600 dark:text-white/70 flex items-center gap-1"
                                  >
                                    {accommodation.name}
                                    <Star
                                      size={16}
                                      className="text-yellow-400"
                                    />
                                    {accommodation.starRating}
                                  </div>
                                )
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  )}
                </React.Fragment>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </WarpBackground>
  );
}
