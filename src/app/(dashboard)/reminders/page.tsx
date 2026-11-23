import { getParties } from "@/app/(dashboard)/parties/actions";
import { RemindersClient } from "./reminders-client";

export default async function RemindersPage() {
  const parties = await getParties({ hasBalance: true });
  return <RemindersClient initialParties={parties} />;
}
