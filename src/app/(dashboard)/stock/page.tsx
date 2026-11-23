import { getProducts, getCategories, getCompanies } from "@/app/(dashboard)/products/actions";
import { StockClient } from "./stock-client";

export default async function StockPage() {
  const [products, categories, companies] = await Promise.all([
    getProducts({ activeOnly: true }),
    getCategories(),
    getCompanies(),
  ]);

  return (
    <StockClient
      initialProducts={products}
      categories={categories || []}
      companies={companies || []}
    />
  );
}
