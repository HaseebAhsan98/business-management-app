import { getParties, getAreas } from "./actions";
import { PartiesClient } from "./parties-client";

export default async function PartiesPage({
  searchParams,
}: {
  searchParams?: { area?: string; search?: string; hasBalance?: string };
}) {
  const [parties, areas] = await Promise.all([
    getParties({
      areaId: searchParams?.area,
      search: searchParams?.search,
      hasBalance: searchParams?.hasBalance === "true",
    }),
    getAreas(),
  ]);

  return <PartiesClient initialParties={parties} areas={areas} />;
}
