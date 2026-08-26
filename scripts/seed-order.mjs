import "dotenv/config";
import { createClient } from "redis";

const url = process.env.REDIS_URL;
if (!url) throw new Error("REDIS_URL missing");

const client = createClient({ url });
await client.connect();

const order = {
  id: "ORD-TEST-NAVIN-001",
  createdAt: "2026-08-07T10:00:00Z",
  updatedAt: "2026-08-07T10:00:00Z",
  status: "paid",
  market: "US",
  currency: "USD",
  customer: { name: "Test Navin", email: "test@navin.dev", phone: "+52 1 55 1234 5678" },
  shippingAddress: { line1: "Test St 1", city: "Austin", state: "TX", zip: "78701", country: "US" },
  items: [
    {
      productId: "cj-1505824030824345600",
      name: "60W Fast Charging Multi-function Charging Cable Storage Box",
      qty: 1,
      unitPrice: 26.99,
      cjSku: "SKU-TEST",
      costUsd: 8,
    },
  ],
  subtotal: 26.99,
  shipping: 9.99,
  tax: 5.92,
  total: 42.9,
  cogsUsd: 8,
  shippingCostUsd: 4,
  paymentFeeUsd: 1.2,
  estimatedProfitUsd: 24,
  autoFulfilled: false,
  accessToken: "navin-test-key-2026",
};

await client.set("orders:ORD-TEST-NAVIN-001", JSON.stringify(order));
console.log("saved", order.id);
await client.quit();
