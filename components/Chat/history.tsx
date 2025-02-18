"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { User } from "better-auth";

import { Chat } from "@/db/schema";
import { getTitleFromChat } from "@/lib/utils";
import { SidebarGroup, SidebarGroupLabel, SidebarMenu } from "../ui/sidebar";

import {
  InfoIcon,
  MenuIcon,
  MoreHorizontalIcon,
  Pencil,
  TrashIcon,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export const History = ({ user }: { user: User | undefined }) => {
  const { id } = useParams();
  const pathname = usePathname();

  const [isHistoryVisible, setIsHistoryVisible] = useState(false);
  const { data: history, isLoading } = useQuery({
    queryKey: ["history"],
    queryFn: async () => {
      if (!user) return [];
      const response = await fetch("/api/history");
      if (!response.ok) throw new Error("Failed to fetch history");
      return response.json();
    },
    enabled: !!user,
  });

  const queryClient = useQueryClient();

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDelete = async () => {
    const deletePromise = fetch(`/api/chat?id=${deleteId}`, {
      method: "DELETE",
    });

    toast.promise(deletePromise, {
      loading: "Deleting chat...",
      success: () => {
        queryClient.setQueryData(["history"], (oldData: Chat[]) => {
          return oldData.filter((h: Chat) => h.id !== id);
        });
        return "Chat deleted successfully";
      },
      error: "Failed to delete chat",
    });

    setShowDeleteDialog(false);
  };

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel className="text-left flex flex-col items-start text-base font-normal text-white">
          History
          <span className="text-left">
            {history === undefined ? "loading" : history.length} chats
          </span>
        </SidebarGroupLabel>

        <SidebarMenu className="mt-10 flex flex-col px-0">
          <div className="flex flex-col p-0">
            {!user ? (
              <div className="text-zinc-500 h-dvh w-full flex flex-row justify-center items-center text-sm gap-2">
                <InfoIcon />
                <div>Login to save and revisit previous chats!</div>
              </div>
            ) : null}

            {!isLoading && history?.length === 0 && user ? (
              <div className="text-zinc-500 h-dvh w-full flex flex-row justify-center items-center text-sm gap-2">
                <InfoIcon />
                <div>No chats found</div>
              </div>
            ) : null}

            {isLoading && user ? (
              <div className="flex flex-col">
                {[44, 32, 28, 52].map((item) => (
                  <div key={item} className="p-2 my-[2px]">
                    <div
                      className={`w-${item} h-[20px] rounded-md bg-zinc-200 dark:bg-zinc-600 animate-pulse`}
                    />
                  </div>
                ))}
              </div>
            ) : null}

            {history &&
              history.map((chat: Chat) => (
                <div
                  key={chat.id}
                  className={cn(
                    "flex flex-row items-center gap-6 hover:bg-jjBlack/5 dark:hover:bg-white/5 rounded-md pr-1",
                    { "bg-zinc-200 dark:bg-zinc-700": chat.id === id }
                  )}
                >
                  <Button
                    variant="ghost"
                    className={cn(
                      "justify-between p-0 text-sm font-normal flex flex-row items-center gap-2 pr-2 w-full transition-none"
                    )}
                    asChild
                  >
                    <Link
                      href={`/chat/${chat.id}`}
                      className="text-ellipsis overflow-hidden text-left py-2 pl-2 rounded-lg outline-zinc-900"
                    >
                      {getTitleFromChat(chat)}
                    </Link>
                  </Button>

                  <DropdownMenu modal={true}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        className="p-1 h-fit font-normal text-zinc-500 transition-none hover:bg-zinc-200 dark:hover:bg-zinc-700"
                        variant="ghost"
                      >
                        <MoreHorizontalIcon />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="left" className="z-[60]">
                      <DropdownMenuItem asChild>
                        <Button
                          className="flex flex-row gap-2 items-center justify-start w-full h-fit font-normal p-1.5 rounded-sm"
                          variant="ghost"
                          onClick={() => {
                            setDeleteId(chat.id);
                            setShowDeleteDialog(true);
                          }}
                        >
                          <TrashIcon />
                          <div>Delete</div>
                        </Button>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
          </div>
        </SidebarMenu>
      </SidebarGroup>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              chat and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
