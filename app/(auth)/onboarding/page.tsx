"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { OnboardingData, onboardingSchema } from "./schema";
import { PassengersForm } from "./components/passengers-form";
import { PaymentForm } from "./components/payment-form";
import { MagicWordForm } from "./components/magic-word-form";
import { cn } from "@/lib/utils";
import { WarpBackground } from "@/components/warp-background";
import { motion } from "framer-motion";
import OnboardingSuccess from "./components/onboarding-success";
import { savePassengerInfo } from "@/db/passenger";
import { savePaymentInfo } from "@/db/payment";
import { useSession } from "@/lib/auth-client";
import { updateUserOnboardingComplete } from "@/db/onboarding";

export default function OnboardingPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [step, setStep] = useState(1);

  const form = useForm<OnboardingData>({
    resolver: zodResolver(onboardingSchema),
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
      paymentInfo: {
        cardNumber: "",
        expiryDate: "",
        cvv: "",
      },
      magicWord: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "passengers",
  });

  const handleNext = async () => {
    if (step === 1) {
      const isValid = await form.trigger("passengers");
      if (isValid) setStep(2);
      return;
    }

    if (step === 2) {
      const isValid = await form.trigger("paymentInfo");
      if (isValid) setStep(3);
      return;
    }

    // Final submission
    const isValid = await form.trigger();
    if (isValid && !isPending && !!session) {
      try {
        const data = form.getValues();
        const passengers = data.passengers.map((passenger) => ({
          ...passenger,
          userId: session.user.id,
          passportExpiry: passenger.passportExpiry.toISOString(),
          dateOfBirth: passenger.dateOfBirth.toISOString(),
        }));
        passengers.forEach(async (passenger) => {
          await savePassengerInfo(passenger);
        });
        const paymentInfo = {
          ...data.paymentInfo,
          userId: session.user.id,
          magicWord: data.magicWord,
        };
        await savePaymentInfo(paymentInfo);
        await updateUserOnboardingComplete(session.user.id);
        console.log("Form submitted:", data);
        setStep(4);
        // router.push("/dashboard");
      } catch (error) {
        console.error("Submission error:", error);
      }
    }
  };

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-24 px-4 sm:px-6 lg:px-8 relative">
      <WarpBackground
        gridColor="var(--warp-border)"
        className="px-44 py-20 border-[1px] border-black/5 dark:border-white/5 rounded-2xl w-full max-w-4xl"
      >
        <motion.div
          transition={{
            duration: 0.8,
            ease: [0.175, 0.885, 0.32, 1],
          }}
          layout="preserve-aspect"
          className="max-w-xl mx-auto w-full"
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-medium tracking-tight">
              Complete Your Profile
            </h2>
            <div className="mt-4 flex justify-center space-x-4">
              {[1, 2, 3].map((num) => (
                <div
                  key={num}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center",
                    step === num
                      ? "bg-jjBlack text-white dark:bg-white dark:text-jjBlack"
                      : "text-black/60 dark:text-white/60"
                  )}
                >
                  {num}
                </div>
              ))}
            </div>
          </div>

          <Form {...form}>
            <Card className="w-full">
              <CardContent className="w-full p-6">
                {step === 1 && (
                  <PassengersForm
                    form={form}
                    fields={fields}
                    append={() =>
                      append({
                        firstName: "",
                        lastName: "",
                        dateOfBirth: new Date(),
                        nationality: "",
                        passportNumber: "",
                        passportExpiry: new Date(),
                      })
                    }
                    remove={remove}
                  />
                )}

                {step === 2 && <PaymentForm form={form} />}

                {step === 3 && <MagicWordForm form={form} />}
                {step === 4 && <OnboardingSuccess />}

                <div className="mt-8 flex justify-between">
                  {step === 1 && <div />}
                  {step > 1 && step < 4 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePrevious}
                    >
                      Previous
                    </Button>
                  )}
                  {step < 4 && (
                    <Button
                      type="button"
                      onClick={handleNext}
                      className={step > 1 ? "ml-auto" : ""}
                    >
                      {step === 3 ? "Complete" : "Next"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </Form>
        </motion.div>
      </WarpBackground>
    </div>
  );
}
