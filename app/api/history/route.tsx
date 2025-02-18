import { getChatsByUserId } from "@/db/chats";
import { authClient } from "@/lib/auth-client";
import { headers } from "next/headers";

export async function GET() {
  const { data: session } = await authClient.getSession({
    fetchOptions: {
      headers: await headers(),
    },
  });

  if (!session || !session.user) {
    return Response.json("Unauthorized!", { status: 401 });
  }

  const chats = await getChatsByUserId({ id: session.user.id! });
  return Response.json(chats);
}
