import { authClient } from "@/lib/auth-client";
import { headers } from "next/headers";

export default async function SettingsPage() {
  const { data: session } = await authClient.getSession({
    fetchOptions: {
      headers: await headers(),
    },
  });

  if (!session) {
    return <div>Not logged in</div>;
  }

  return <div>Settings to be added</div>;
  //   return <SettingsPage />;
}
