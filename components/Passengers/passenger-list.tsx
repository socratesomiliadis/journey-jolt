"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Trash2, Ellipsis } from "lucide-react";
import Particles from "../particles";

interface Passenger {
  id: String;
  userId: String;
  firstName: string;
  lastName: string;
  dateOfBirth: String;
  nationality: String;
  passportNumber: String;
  passportExpiry: String;
  createdAt: Date;
  updatedAt: Date;
}

const passengers: Passenger[] = [
  {
    id: "P001",
    userId: "U7391",
    firstName: "John",
    lastName: "Smith",
    dateOfBirth: "1985-03-15",
    nationality: "United States",
    passportNumber: "123456789",
    passportExpiry: "2028-05-20",
    createdAt: new Date("2024-01-15T08:30:00Z"),
    updatedAt: new Date("2024-01-15T08:30:00Z"),
  },
  {
    id: "P002",
    userId: "U4526",
    firstName: "Maria",
    lastName: "Garcia",
    dateOfBirth: "1992-08-23",
    nationality: "Spain",
    passportNumber: "ESP283947",
    passportExpiry: "2026-11-15",
    createdAt: new Date("2024-01-16T14:20:00Z"),
    updatedAt: new Date("2024-02-01T09:15:00Z"),
  },
  {
    id: "P003",
    userId: "U8872",
    firstName: "Yuki",
    lastName: "Tanaka",
    dateOfBirth: "1990-12-05",
    nationality: "Japan",
    passportNumber: "JP5674321",
    passportExpiry: "2027-08-30",
    createdAt: new Date("2024-01-18T11:45:00Z"),
    updatedAt: new Date("2024-01-18T11:45:00Z"),
  },
  {
    id: "P004",
    userId: "U2245",
    firstName: "Emma",
    lastName: "Wilson",
    dateOfBirth: "1988-06-28",
    nationality: "United Kingdom",
    passportNumber: "GBR789012",
    passportExpiry: "2029-03-12",
    createdAt: new Date("2024-01-20T16:10:00Z"),
    updatedAt: new Date("2024-02-05T13:20:00Z"),
  },
  {
    id: "P005",
    userId: "U9134",
    firstName: "Hans",
    lastName: "Mueller",
    dateOfBirth: "1975-11-30",
    nationality: "Germany",
    passportNumber: "DEU456789",
    passportExpiry: "2025-09-25",
    createdAt: new Date("2024-01-22T09:00:00Z"),
    updatedAt: new Date("2024-01-22T09:00:00Z"),
  },
  {
    id: "P006",
    userId: "U3367",
    firstName: "Sophie",
    lastName: "Martin",
    dateOfBirth: "1995-04-17",
    nationality: "France",
    passportNumber: "FRA234567",
    passportExpiry: "2026-07-08",
    createdAt: new Date("2024-01-25T13:30:00Z"),
    updatedAt: new Date("2024-02-10T15:45:00Z"),
  },
  {
    id: "P007",
    userId: "U5589",
    firstName: "Alessandro",
    lastName: "Rossi",
    dateOfBirth: "1982-09-03",
    nationality: "Italy",
    passportNumber: "ITA891234",
    passportExpiry: "2027-12-01",
    createdAt: new Date("2024-01-28T10:20:00Z"),
    updatedAt: new Date("2024-01-28T10:20:00Z"),
  },
  {
    id: "P008",
    userId: "U7712",
    firstName: "Anna",
    lastName: "Kowalski",
    dateOfBirth: "1993-07-22",
    nationality: "Poland",
    passportNumber: "POL567890",
    passportExpiry: "2028-02-14",
    createdAt: new Date("2024-02-01T15:50:00Z"),
    updatedAt: new Date("2024-02-01T15:50:00Z"),
  },
  {
    id: "P009",
    userId: "U4491",
    firstName: "Lars",
    lastName: "Andersen",
    dateOfBirth: "1987-01-09",
    nationality: "Denmark",
    passportNumber: "DNK345678",
    passportExpiry: "2026-04-30",
    createdAt: new Date("2024-02-05T08:40:00Z"),
    updatedAt: new Date("2024-02-05T08:40:00Z"),
  },
  {
    id: "P010",
    userId: "U6623",
    firstName: "Ming",
    lastName: "Zhang",
    dateOfBirth: "1991-05-14",
    nationality: "China",
    passportNumber: "CHN678901",
    passportExpiry: "2025-10-18",
    createdAt: new Date("2024-02-10T12:15:00Z"),
    updatedAt: new Date("2024-02-10T12:15:00Z"),
  },
];

export default function PassengerList() {
  return (
    <div className="w-full relative">
      <div className="absolute inset-0">
        <Particles
          particleColors={["#ffffff", "#ffffff"]}
          particleCount={200}
          particleSpread={10}
          speed={0.02}
          particleBaseSize={100}
          moveParticlesOnHover={false}
          alphaParticles={false}
          disableRotation={false}
          className="h-full w-full"
        />
      </div>
      <div className="w-full max-w-5xl mx-auto rounded-lg z-10 ">
        <div className="mt-16 bg-jjBlack/[0.04] dark:bg-white/[0.04] backdrop-blur-lg rounded-lg overflow-hidden border-gray-200 dark:border-white/10 shadow-2xl">
          {" "}
          <table className="w-full max-w-5xl">
            <thead>
              <tr className="border-b border-gray-200 dark:border-white/10">
                <th className="text-gray-600 dark:text-white/70 p-4 text-left">
                  Passenger
                </th>
                <th className="text-gray-600 dark:text-white/70 p-4 text-right">
                  Date of Birth
                </th>
                <th className="text-gray-600 dark:text-white/70 p-4 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {passengers.map((passenger) => (
                  <motion.tr
                    key={passenger.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="group relative cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-white/10 overflow-hidden inline-flex items-center justify-center">
                          <span className="text-gray-700 dark:text-white text-center font-medium">
                            {`${passenger.firstName.charAt(
                              0
                            )}${passenger.lastName.charAt(0)}`}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-900 dark:text-white">
                            {passenger.firstName} {passenger.lastName}
                          </span>
                          <span className="text-gray-500 dark:text-white/40 text-xs">
                            Citizen of {passenger.nationality}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <span className="text-gray-900 dark:text-white">
                        {passenger.dateOfBirth}
                      </span>
                    </td>
                    <td className="text-right p-4">
                      <div className="inline-flex items-center justify-center group/menu rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <Ellipsis className="ml-auto text-gray-400 group-hover/menu:text-gray-600 dark:text-gray-600/[1] dark:group-hover/menu:text-gray-300 transition-colors h-5 w-5" />
                      </div>{" "}
                      <div className="inline-flex items-center justify-center group/delete rounded-lg p-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                        <Trash2 className="ml-auto text-red-400 group-hover/delete:text-red-600 dark:text-red-600/[0.5] dark:group-hover/delete:text-red-700 transition-colors h-5 w-5" />
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
