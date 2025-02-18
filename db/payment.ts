"use server";

import { db } from ".";
import { paymentInfo } from "./schema";
import crypto from "crypto";

type paymentInfoInsertType = typeof paymentInfo.$inferInsert;

//saves payment data for current user to the database when called
//is called at the corresponding payment info page
export async function savePaymentInfo(data: {
  userId: string;
  magicWord: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
}): Promise<void> {
  const cardType = GetCardType(data.cardNumber);
  const last4 = data.cardNumber.slice(-4);
  const token = crypto
    .createHash("sha256")
    .update(data.cardNumber + Date.now().toString())
    .digest("hex");
  const encryptedCardNumber = encrypt(data.cardNumber);

  try {
    const newPaymentInfo: paymentInfoInsertType = {
      userId: data.userId,
      token: token,
      encryptedCardNumber: encryptedCardNumber.encryptedData,
      iv: encryptedCardNumber.iv,
      cardType: cardType,
      last4: last4,
      magicWord: data.magicWord,
    };
    await db.insert(paymentInfo).values(newPaymentInfo);
    console.log("Successfully saved payment info: ", newPaymentInfo);
  } catch (error) {
    console.error("Error saving payment info:", error);
    throw error;
  }
}

function encrypt(text: string) {
  const algorithm = "aes-256-cbc";
  const encryptionKey = process.env.ENCRYPTION_KEY; // Must be exactly 32 bytes for AES-256
  if (!encryptionKey) {
    throw new Error("ENCRYPTION_KEY must be set and 32 characters long.");
  }
  // Generate a random Initialization Vector
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    algorithm,
    Buffer.from(encryptionKey),
    iv
  );
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return { iv: iv.toString("hex"), encryptedData: encrypted };
}

function GetCardType(number: string) {
  // visa
  var re = new RegExp("^4");
  if (number.match(re) != null) return "Visa";

  // Mastercard
  // Updated for Mastercard 2017 BINs expansion
  if (
    /^(5[1-5][0-9]{14}|2(22[1-9][0-9]{12}|2[3-9][0-9]{13}|[3-6][0-9]{14}|7[0-1][0-9]{13}|720[0-9]{12}))$/.test(
      number
    )
  )
    return "Mastercard";

  // AMEX
  re = new RegExp("^3[47]");
  if (number.match(re) != null) return "AMEX";

  // Discover
  re = new RegExp(
    "^(6011|622(12[6-9]|1[3-9][0-9]|[2-8][0-9]{2}|9[0-1][0-9]|92[0-5]|64[4-9])|65)"
  );
  if (number.match(re) != null) return "Discover";

  // Diners
  re = new RegExp("^36");
  if (number.match(re) != null) return "Diners";

  // Diners - Carte Blanche
  re = new RegExp("^30[0-5]");
  if (number.match(re) != null) return "Diners - Carte Blanche";

  // JCB
  re = new RegExp("^35(2[89]|[3-8][0-9])");
  if (number.match(re) != null) return "JCB";

  // Visa Electron
  re = new RegExp("^(4026|417500|4508|4844|491(3|7))");
  if (number.match(re) != null) return "Visa Electron";

  return "";
}
