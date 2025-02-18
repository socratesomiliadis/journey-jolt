import { db } from "@/db";
import { authClient } from "@/lib/auth-client";
import { NextResponse } from "next/server";
import { passenger } from "@/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

export async function GET(request: Request) {
  try {
    const { data: session } = await authClient.getSession({
      fetchOptions: {
        headers: await headers(),
      },
    });

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    const passengers = await db
      .select()
      .from(passenger)
      .where(eq(passenger.userId, userId as string));

    return NextResponse.json(passengers);
  } catch (error) {
    console.error("[PASSENGERS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
