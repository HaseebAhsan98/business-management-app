import { getParties } from "@/app/(dashboard)/parties/actions";
import { RecordPaymentClient } from "./record-payment-client";

export default async function RecordPaymentPage({
  searchParams,
}: {
  searchParams?: { customerId?: string };
}) {
  const parties = await getParties();

  return (
    <RecordPaymentClient
      parties={parties}
      preselectedCustomerId={searchParams?.customerId}
    />
  );
}
