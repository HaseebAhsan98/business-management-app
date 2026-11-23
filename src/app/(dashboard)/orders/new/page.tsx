import { getAreas, getParties } from "@/app/(dashboard)/parties/actions";
import { getCategories, getProducts } from "@/app/(dashboard)/products/actions";
import { CreateOrderClient } from "./create-order-client";

export default async function NewOrderPage({
  searchParams,
}: {
  searchParams?: { customerId?: string };
}) {
  const [areas, parties, categories, products] = await Promise.all([
    getAreas(),
    getParties(),
    getCategories(),
    getProducts({ activeOnly: true }),
  ]);

  return (
    <CreateOrderClient
      areas={areas}
      parties={parties}
      categories={categories || []}
      products={products}
      preselectedCustomerId={searchParams?.customerId}
    />
  );
}
