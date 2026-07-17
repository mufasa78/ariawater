import {
  pgTable,
  serial,
  integer,
  text,
  numeric,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { productsTable } from "./products";

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id")
    .notNull()
    .references(() => usersTable.id),
  status: varchar("status", { length: 30 }).notNull().default("received"), // received | processing | dispatched | delivered
  totalKes: numeric("total_kes", { precision: 12, scale: 2 }).notNull(),
  deliveryAddress: text("delivery_address").notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  notes: text("notes"),
  paymentStatus: varchar("payment_status", { length: 20 })
    .notNull()
    .default("pending"), // pending | completed | failed
  paymentMethod: varchar("payment_method", { length: 30 }), // mpesa | card | bank_transfer
  paystackRef: varchar("paystack_ref", { length: 100 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const orderItemsTable = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => ordersTable.id),
  productId: integer("product_id")
    .notNull()
    .references(() => productsTable.id),
  quantity: integer("quantity").notNull(),
  unitPriceKes: numeric("unit_price_kes", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderItemSchema = createInsertSchema(orderItemsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type Order = typeof ordersTable.$inferSelect;
export type OrderItem = typeof orderItemsTable.$inferSelect;
