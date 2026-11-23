import { getPayments } from "./actions";
import { PaymentsClient } from "./payments-client";

export default async function PaymentsPage() {
  const payments = await getPayments();
  return <PaymentsClient initialPayments={payments} />;
}
