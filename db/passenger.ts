import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { passenger } from "./schema";

//saves passenger data to the database when called
//is called at the passenger registration page
async function savePassengerInfo(
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
      //alias: data.alias, 
    };
    console.log("Successfully saved passenger info: ", newPassengerInfo);
  } catch (error) {
    console.error("Error saving passenger info:", error);
    throw error;
  }
}
