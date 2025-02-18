export function VerifyPayment({
  result: { hasCompletedPayment },
}: {
  result: {
    hasCompletedPayment: boolean;
  };
}) {
  return (
    <div>
      {!hasCompletedPayment &&
        "Unable to verify your payment, please try again!"}
    </div>
  );
}
