import * as z from "zod";

const passengerSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  nationality: z.string().min(1, "Nationality is required"),
  passportNumber: z
    .string()
    .min(1, "Passport number is required")
    .refine((value) => /^(?!(0))[a-zA-Z0-9]{6,9}$/.test(value), {
      message:
        "Passport number must be 6-9 characters long and not start with 0",
    }),
  passportExpiry: z.date().refine((date) => date > new Date(), {
    message: "Passport expiry must be in the future",
  }),
  dateOfBirth: z.date().refine((date) => date < new Date(), {
    message: "Date of birth must be in the past",
  }),
});

export const onboardingSchema = z.object({
  passengers: z
    .array(passengerSchema)
    .min(1, "At least one passenger is required"),
  paymentInfo: z.object({
    cardNumber: z.string().min(16, "Invalid card number").max(16),
    expiryDate: z
      .string()
      .regex(/^(0[1-9]|1[0-2])\/([0-9]{2})$/, "Invalid expiry date (MM/YY)"),
    cvv: z.string().min(3, "Invalid CVV").max(3),
  }),
  magicWord: z.string().min(1, "Magic word is required"),
});

export type OnboardingData = z.infer<typeof onboardingSchema>;
