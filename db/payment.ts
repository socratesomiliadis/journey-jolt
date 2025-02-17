import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { paymentInfo } from "./schema";

//saves payment data for current user to the database when called
//is called at the corresponding payment info page
async function savePaymentInfo(
  db: PostgresJsDatabase,
  data: any
): Promise<void> {
  try {
    type paymentInfoInsertType = typeof paymentInfo.$inferInsert;

    const newPaymentInfo: paymentInfoInsertType = {
      userId: data.userId,
      token: data.token,
      encryptedCardNumber: data.encryptedCardNumber,
      iv: data.iv,
      cardType: data.cardType,
      last4: data.last4,
    };
    console.log("Successfully saved payment info: ", newPaymentInfo);
  } catch (error) {
    console.error("Error saving payment info:", error);
    throw error;
  }
}
