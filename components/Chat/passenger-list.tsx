"use client";

import { passengerInfoSelect } from "@/db/passenger";
import { Button } from "../ui/button";
import { authClient } from "@/lib/auth-client";
import { useQuery } from "@tanstack/react-query";
import { differenceInHours } from "date-fns";
import { cn } from "@/lib/utils";
import { IdCard, LocateIcon, MapPinHouse } from "lucide-react";

const sample: passengerInfoSelect[] = [
  {
    id: "1",
    firstName: "John",
    lastName: "Doe",
    passportNumber: "1234567890",
    dateOfBirth: "1990-01-01",
    nationality: "American",
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: "1",
    passportExpiry: "2025-01-01",
  },
  {
    id: "2",
    firstName: "Jane",
    lastName: "Doe",
    passportNumber: "1234567890",
    dateOfBirth: "1990-01-01",
    nationality: "American",
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: "1",
    passportExpiry: "2025-01-01",
  },
  {
    id: "Tfse7lwANgcs-XgKS3nZE",
    firstName: "Jim",
    lastName: "Beam",
    passportNumber: "1234567890",
    dateOfBirth: "1990-01-01",
    nationality: "American",
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: "1",
    passportExpiry: "2025-01-01",
  },
];

export function PassengerList({
  passengers = sample,
}: {
  passengers?: passengerInfoSelect[];
}) {
  return (
    <div className="flex flex-col gap-0 bg-jjBlack/[0.04] dark:bg-white/[0.04] rounded-xl w-fit">
      {passengers.map((passenger, index) => (
        <div
          key={passenger.id}
          className={cn(
            "flex flex-col gap-0 border-b border-jjBlack/[0.08] dark:border-white/[0.08] px-6 py-4",
            index === passengers.length - 1 && "border-b-0"
          )}
        >
          <div className={cn("flex flex-row items-center gap-24")}>
            <div className="flex flex-col gap-1">
              <h3 className="font-medium text-xl">
                {passenger.firstName} {passenger.lastName}
              </h3>
              <div className="flex items-center gap-3 text-sm text-black/60 dark:text-white/60">
                <span className="flex items-center gap-1">
                  <MapPinHouse size={16} /> {passenger.nationality}
                </span>
                <span className="flex items-center gap-1">
                  <IdCard size={16} /> {passenger.passportNumber}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-base">Date of Birth</p>
                <p className="text-black/60 dark:text-white/60">
                  {passenger.dateOfBirth}
                </p>
              </div>
            </div>
          </div>
          <span className="text-xs mt-3 text-black/60 dark:text-white/60">
            {passenger.id}
          </span>
        </div>
      ))}
    </div>
  );
}
