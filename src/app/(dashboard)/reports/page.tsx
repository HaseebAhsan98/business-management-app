import { getParties } from "@/app/(dashboard)/parties/actions";
import { getSuppliers } from "@/app/(dashboard)/suppliers/actions";
import { ReportsClient } from "./reports-client";

export default async function ReportsPage() {
  const [parties, suppliers] = await Promise.all([
    getParties(),
    getSuppliers(),
  ]);

  return <ReportsClient parties={parties} suppliers={suppliers} />;
}
