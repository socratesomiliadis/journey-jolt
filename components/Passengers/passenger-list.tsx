"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Trash2, Ellipsis } from "lucide-react";
import { passengerInfoSelect } from "@/db/passenger";
import { savePassengerInfo, deletePassengerInfo } from "@/db/passenger";
import { WarpBackground } from "../warp-background";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Form } from "../ui/form";
import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PassengerData, passengerSchema } from "@/app/(auth)/onboarding/schema";
import { useFieldArray } from "react-hook-form";
import { z } from "zod";
import { CardDescription, CardHeader, CardTitle } from "../ui/card";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { X } from "lucide-react";
import { DateTimePicker } from "../datetime-picker";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
type PassengersFormData = {
  passengers: PassengerData[];
};

interface PassengersFormProps {
  form: UseFormReturn<PassengersFormData>;
  fields: Record<"id", string>[];
  append: (value: PassengerData) => void;
  remove: (index: number) => void;
  onSubmitSuccess?: () => void;
}

const passengersFormSchema = z.object({
  passengers: z.array(passengerSchema),
});

export default function PassengerList({
  passengers,
}: {
  passengers: passengerInfoSelect[];
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const form = useForm<{ passengers: PassengerData[] }>({
    resolver: zodResolver(passengersFormSchema),
    defaultValues: {
      passengers: [
        {
          firstName: "",
          lastName: "",
          nationality: "",
          passportNumber: "",
          passportExpiry: new Date(),
          dateOfBirth: new Date(),
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "passengers",
  });

  async function onSubmit(data: { passengers: PassengerData[] }) {
    if (isPending) return;
    if (!session?.user.id) return;
    for (const passenger of data.passengers) {
      try {
        await savePassengerInfo({
          ...passenger,
          userId: session?.user.id,
          passportExpiry: passenger.passportExpiry.toISOString(),
          dateOfBirth: passenger.dateOfBirth.toISOString(),
        });
      } catch (error) {
        console.error(error);
      }
    }
    setIsDialogOpen(false);
    router.refresh();
  }

  function formatDate(date: string) {
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }
  return (
    <WarpBackground
      gridColor="var(--warp-border)"
      className="h-full border-[1px] border-black/5 dark:border-white/5 rounded-2xl w-full overflow-hidden flex items-center justify-center"
    >
      <div className="w-screen max-w-[70rem] rounded-lg z-10">
        <div className="mt-16 bg-white dark:bg-jjBlack rounded-2xl overflow-hidden border-[1px] border-jjBlack/10 dark:border-white/10">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-white/10">
                <th className=" p-4 text-left font-medium">Passenger</th>
                <th className=" p-4 text-right font-medium">Passport Number</th>
                <th className=" p-4 text-right font-medium">Date of Birth</th>
                <th className=" p-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {passengers.map((passenger) => (
                  <motion.tr
                    key={passenger.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="group relative cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-white/10 overflow-hidden inline-flex items-center justify-center">
                          <span className="text-gray-700 dark:text-white text-center font-medium">
                            {`${passenger.firstName.charAt(
                              0
                            )}${passenger.lastName.charAt(0)}`}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-900 dark:text-white">
                            {passenger.firstName} {passenger.lastName}
                          </span>
                          <span className="text-gray-500 dark:text-white/40 text-xs">
                            {passenger.nationality} Citizen
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <span className="text-gray-900 dark:text-white">
                        {passenger.passportNumber}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <span className="text-gray-900 dark:text-white">
                        {formatDate(passenger.dateOfBirth)}
                      </span>
                    </td>
                    <td className="text-right p-4">
                      {/* <div className="inline-flex items-center justify-center group/menu rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <Ellipsis className="ml-auto text-gray-400 group-hover/menu:text-gray-600 dark:text-gray-600/[1] dark:group-hover/menu:text-gray-300 transition-colors h-5 w-5" />
                      </div> */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="inline-flex items-center justify-center hover:bg-gray-100 dark:hover:bg-jjBlue/5 transition-colors"
                      >
                        <Ellipsis className="h-5 w-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          deletePassengerInfo(passenger.id);
                          router.refresh();
                        }}
                        className="inline-flex items-center justify-center hover:bg-red-500 dark:hover:bg-red-500 hover:text-white"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        <div className="flex justify-center w-full py-6">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>Add Passenger</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] bg-white dark:bg-jjBlack">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                  <PassengersForm
                    form={form}
                    fields={fields}
                    append={append}
                    remove={remove}
                    onSubmitSuccess={() => {
                      setIsDialogOpen(false);
                    }}
                  />
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </WarpBackground>
  );
}

export function PassengersForm({
  form,
  fields,
  append,
  remove,
  onSubmitSuccess,
}: PassengersFormProps) {
  const handleSubmit = async (data: any) => {
    // ... existing submission logic ...

    if (onSubmitSuccess) {
      onSubmitSuccess();
    }
  };

  return (
    <div className="space-y-6">
      <CardHeader className="pl-2 pb-0 pt-0">
        <CardTitle className="font-medium tracking-tight text-2xl p-0">
          Add Passengers
        </CardTitle>
        <CardDescription className="text-base text-black/60 dark:text-white/60 tracking-tight">
          Add the passengers you want to be <br /> able to book trips for (eg.
          children, parents, etc.)
        </CardDescription>
      </CardHeader>

      <motion.div
        transition={{
          duration: 0.8,
          ease: [0.175, 0.885, 0.32, 1],
        }}
        className="h-full max-h-[40vh] overflow-y-auto flex flex-col gap-6 px-2"
      >
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="p-5 border-[1px] border-black/10 dark:border-white/10 rounded-xl space-y-4"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-base tracking-tight text-muted-foreground">
                Passenger {index + 1}
              </span>
              {index > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => remove(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name={`passengers.${index}.firstName`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`passengers.${index}.lastName`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name={`passengers.${index}.nationality`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nationality</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`passengers.${index}.passportNumber`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Passport Number</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name={`passengers.${index}.passportExpiry`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Passport Expiry</FormLabel>
                    <FormControl>
                      <DateTimePicker
                        value={field.value}
                        onChange={field.onChange}
                        hideTime
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`passengers.${index}.dateOfBirth`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth</FormLabel>
                    <FormControl>
                      <DateTimePicker
                        value={field.value}
                        onChange={field.onChange}
                        hideTime
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        ))}
      </motion.div>
      <div className="flex justify-between gap-4 px-2">
        <Button
          type="button"
          onClick={() =>
            append({
              firstName: "",
              lastName: "",
              nationality: "",
              passportNumber: "",
              passportExpiry: new Date(),
              dateOfBirth: new Date(),
            })
          }
        >
          Add another passenger
        </Button>
        <Button type="submit">Save</Button>
      </div>
    </div>
  );
}
