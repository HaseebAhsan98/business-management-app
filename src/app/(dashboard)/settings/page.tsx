import { getAreas } from "@/app/(dashboard)/parties/actions";
import { getCategories, getCompanies } from "@/app/(dashboard)/products/actions";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
  const [areas, categories, companies] = await Promise.all([
    getAreas(),
    getCategories(),
    getCompanies(),
  ]);

  return (
    <SettingsClient
      areas={areas}
      categories={categories || []}
      companies={companies || []}
    />
  );
}
