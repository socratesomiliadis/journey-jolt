"use server";

import { db } from ".";
import { passenger } from "./schema";
import { eq } from "drizzle-orm";

type passengerInfoInsert = typeof passenger.$inferInsert;
export type passengerInfoSelect = typeof passenger.$inferSelect;
//saves passenger data to the database when called
//is called at the passenger registration page
export async function savePassengerInfo(
  data: passengerInfoInsert
): Promise<void> {
  try {
    const newPassengerInfo: passengerInfoInsert = {
      userId: data.userId,
      firstName: data.firstName,
      lastName: data.lastName,
      dateOfBirth: data.dateOfBirth,
      nationality: data.nationality,
      passportNumber: data.passportNumber,
      passportExpiry: data.passportExpiry,
      //alias: data.alias,
    };
    await db.insert(passenger).values(newPassengerInfo);
    console.log("Successfully saved passenger info: ", newPassengerInfo);
  } catch (error) {
    console.error("Error saving passenger info:", error);
    throw error;
  }
}

export async function getPassengerInfo(
  userId: string
): Promise<passengerInfoSelect[]> {
  console.log("userId", userId);
  try {
    const passengerInfo = await db
      .select()
      .from(passenger)
      .where(eq(passenger.userId, userId));
    console.log("passengerInfo", passengerInfo);
    return passengerInfo;
  } catch (error) {
    console.error("Error getting passenger info:", error);
    throw error;
  }
}
