import { CoreMessage } from "ai";
import { notFound } from "next/navigation";

import { Chat as PreviewChat } from "@/components/Chat";
import { getChatById } from "@/db/chats";
import { Chat } from "@/db/schema";
import { convertToUIMessages } from "@/lib/utils";
import { headers } from "next/headers";
import { authClient } from "@/lib/auth-client";

export default async function Page({ params }: { params: any }) {
  const { id } = params;
  const chatFromDb = await getChatById({ id });

  if (!chatFromDb) {
    notFound();
  }

  // type casting and converting messages to UI messages
  const chatData: Chat = {
    ...chatFromDb,
    messages: convertToUIMessages(chatFromDb.messages as Array<CoreMessage>),
  };

  const { data: session } = await authClient.getSession({
    fetchOptions: {
      headers: await headers(),
    },
  });

  if (!session || !session.user) {
    return notFound();
  }

  if (session.user.id !== chatData.userId) {
    return notFound();
  }

  return <PreviewChat id={chatData.id} initialMessages={chatData.messages} />;
}
