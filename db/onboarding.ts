"use server";

import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function updateUserOnboardingComplete(userId: string) {
  await db
    .update(user)
    .set({ onboarding_complete: true })
    .where(eq(user.id, userId));
}
