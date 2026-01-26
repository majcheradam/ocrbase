import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { createId } from "../lib/ids";

export const apiKeys = pgTable(
  "api_keys",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId("apiKey")),
    name: text("name").notNull(),
    keyHash: text("key_hash").notNull().unique(),
    keyPrefix: text("key_prefix").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    requestCount: integer("request_count").notNull().default(0),
    lastUsedAt: timestamp("last_used_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("api_keys_key_hash_idx").on(table.keyHash),
    index("api_keys_is_active_idx").on(table.isActive),
  ]
);

export const apiKeyUsage = pgTable(
  "api_key_usage",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId("apiKeyUsage")),
    apiKeyId: text("api_key_id")
      .notNull()
      .references(() => apiKeys.id, { onDelete: "cascade" }),
    endpoint: text("endpoint").notNull(),
    method: text("method").notNull(),
    statusCode: integer("status_code").notNull(),
    processingMs: integer("processing_ms"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("api_key_usage_api_key_id_idx").on(table.apiKeyId),
    index("api_key_usage_created_at_idx").on(table.createdAt),
  ]
);

export const apiKeysRelations = relations(apiKeys, ({ many }) => ({
  usage: many(apiKeyUsage),
}));

export const apiKeyUsageRelations = relations(apiKeyUsage, ({ one }) => ({
  apiKey: one(apiKeys, {
    fields: [apiKeyUsage.apiKeyId],
    references: [apiKeys.id],
  }),
}));

export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;
export type ApiKeyUsage = typeof apiKeyUsage.$inferSelect;
export type NewApiKeyUsage = typeof apiKeyUsage.$inferInsert;
