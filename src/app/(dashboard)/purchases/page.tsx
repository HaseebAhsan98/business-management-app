import { getPurchases } from "./actions";
import { getSuppliers } from "@/app/(dashboard)/suppliers/actions";
import { getProducts, getCategories } from "@/app/(dashboard)/products/actions";
import { PurchasesClient } from "./purchases-client";

export default async function PurchasesPage() {
  const [purchases, suppliers, products, categories] = await Promise.all([
    getPurchases(),
    getSuppliers(),
    getProducts({ activeOnly: true }),
    getCategories(),
  ]);

  return (
    <PurchasesClient
      initialPurchases={purchases}
      suppliers={suppliers}
      products={products}
      categories={categories || []}
    />
  );
}
