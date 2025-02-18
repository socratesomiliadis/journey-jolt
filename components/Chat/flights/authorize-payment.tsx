"use client";

import { differenceInMinutes } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";
// import useSWR from "swr";

// import { fetcher } from "@/lib/utils";

// import { CheckCircle, InfoIcon } from "../custom/icons";
import { Input } from "@/components/ui/input";
import { CheckCircle, Info } from "lucide-react";
import { useChat } from "@ai-sdk/react";

const SAMPLE = {
  hasCompletedPayment: false,
  createdAt: new Date(),
};

export function AuthorizePayment({
  chatId,
  intent = { offerId: "sample-id" },
}: {
  chatId: string;
  intent?: { offerId: string };
}) {
  const { append } = useChat({
    id: chatId,
    body: { id: chatId },
    maxSteps: 5,
  });
  const [reservation, setReservation] = useState(SAMPLE);

  const [input, setInput] = useState("");

  const handleAuthorize = async (magicWord: string) => {
    new Promise((resolve) => setTimeout(resolve, 1000));
    if (magicWord === "vercel") {
      setReservation({
        hasCompletedPayment: true,
        createdAt: new Date(),
      });
      localStorage.setItem(
        intent.offerId,
        JSON.stringify({
          hasCompletedPayment: true,
          createdAt: new Date(),
        })
      );

      append({
        role: "user",
        content: "Finished payment authorization",
      });
    } else {
      toast.error("Invalid magic word");
    }
  };

  return reservation?.hasCompletedPayment ? (
    <div className="bg-emerald-500 p-4 rounded-lg gap-4 flex flex-row justify-between items-center">
      <div className="dark:text-emerald-950 text-emerald-50 font-medium">
        Payment Verified
      </div>
      <div className="dark:text-emerald-950 text-emerald-50">
        <CheckCircle size={20} />
      </div>
    </div>
  ) : differenceInMinutes(new Date(), new Date(reservation?.createdAt)) >
    150 ? (
    <div className="bg-red-500 p-4 rounded-lg gap-4 flex flex-row justify-between items-center">
      <div className="text-background">Payment Gateway Timed Out</div>
      <div className="text-background">
        <Info size={20} />
      </div>
    </div>
  ) : (
    <div className="bg-jjBlack/[0.04] dark:bg-white/[0.04] p-4 rounded-lg flex flex-col gap-2 w-fit">
      <div className="text font-medium">
        Use your saved information for this transaction
      </div>
      <div className="text-black/70 dark:text-white/70 text-sm sm:text-base">
        Enter the magic word to authorize payment. Hint: It rhymes with bercel.
      </div>

      <Input
        type="text"
        placeholder="Enter magic word..."
        className="rounded-xl"
        onChange={(event) => setInput(event.currentTarget.value)}
        onKeyDown={async (event) => {
          if (event.key === "Enter") {
            await handleAuthorize(input);
            setInput("");
          }
        }}
      />
    </div>
  );
}
