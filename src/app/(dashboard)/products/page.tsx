import { getProducts, getCategories, getCompanies } from "./actions";
import { ProductsClient } from "./products-client";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams?: { category?: string; company?: string; search?: string };
}) {
  const [products, categories, companies] = await Promise.all([
    getProducts({
      categoryId: searchParams?.category,
      companyId: searchParams?.company,
      search: searchParams?.search,
    }),
    getCategories(),
    getCompanies(),
  ]);

  return (
    <ProductsClient
      initialProducts={products}
      categories={categories || []}
      companies={companies || []}
    />
  );
}
