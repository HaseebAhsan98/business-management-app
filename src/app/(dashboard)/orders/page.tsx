import { getOrders } from "./actions";
import { getParties } from "@/app/(dashboard)/parties/actions";
import { OrdersClient } from "./orders-client";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams?: {
    status?: string;
    payment?: string;
    party?: string;
    search?: string;
  };
}) {
  const [orders, parties] = await Promise.all([
    getOrders({
      deliveryStatus: searchParams?.status,
      paymentStatus: searchParams?.payment,
      customerId: searchParams?.party,
      search: searchParams?.search,
    }),
    getParties(),
  ]);

  return <OrdersClient initialOrders={orders} parties={parties} />;
}
