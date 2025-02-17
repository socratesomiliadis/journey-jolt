import { eq } from "drizzle-orm";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { paymentInfo } from "./schema";
import { uuid } from "drizzle-orm/pg-core";

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
