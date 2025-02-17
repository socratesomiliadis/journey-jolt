import { eq } from "drizzle-orm";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { passenger } from "./schema";
import { uuid } from "drizzle-orm/pg-core";

async function savePaymentInfo(
  db: PostgresJsDatabase,
  data: any
): Promise<void> {
  try {
    type passengerInfoInsert = typeof passenger.$inferInsert;

    const newPassengerInfo: passengerInfoInsert = {
      userId: data.userId,
      firstName: data.first_name,
      lastName: data.lastName,
      dateOfBirth: data.dateOfBirth,
      nationality: data.nationality,
      passportNumber: data.passportNumber,
      passportExpiry: data.passportExpiry,
    };
    console.log("Successfully saved passenger info: ", newPassengerInfo);
  } catch (error) {
    console.error("Error saving passenger info:", error);
    throw error;
  }
}
