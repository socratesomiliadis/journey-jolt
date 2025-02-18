import { eq } from "drizzle-orm";
import { db } from "@/db";
import { chat } from "@/db/schema";

type chatSelect = typeof chat.$inferSelect;

export async function getChatsByUserId({ id }: { id: string }) {
  const chats = await db.query.chat.findMany({ where: eq(chat.userId, id) });
  return chats;
}

export async function getChatById({ id }: { id: string }) {
  const chatData = await db.query.chat.findFirst({ where: eq(chat.id, id) });
  return chatData;
}

export async function saveChat({
  id,
  messages,
  userId,
}: {
  id: string;
  messages: any;
  userId: string;
}) {
  try {
    const selectedChats = await db.select().from(chat).where(eq(chat.id, id));

    if (selectedChats.length > 0) {
      return await db
        .update(chat)
        .set({
          messages: JSON.stringify(messages),
        })
        .where(eq(chat.id, id));
    }

    return await db.insert(chat).values({
      id,
      createdAt: new Date(),
      messages: JSON.stringify(messages),
      userId,
    });
  } catch (error) {
    console.error("Failed to save chat in database");
    throw error;
  }
}
