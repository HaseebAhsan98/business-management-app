import { notFound } from "next/navigation";
import { getPartyDetails } from "../actions";
import { getProducts } from "@/app/(dashboard)/products/actions";
import { PartyDetailClient } from "./party-detail-client";

export default async function PartyDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [partyData, allProducts] = await Promise.all([
    getPartyDetails(params.id),
    getProducts({ activeOnly: true }),
  ]);

  if (!partyData) {
    notFound();
  }

  return (
    <PartyDetailClient
      customer={partyData.customer}
      priceRules={partyData.priceRules}
      orders={partyData.orders}
      payments={partyData.payments}
      allProducts={allProducts}
    />
  );
}
