import { t, type Static } from "elysia";

export const KeyModel = {
  createBody: t.Object({
    name: t.String({ maxLength: 100, minLength: 1 }),
  }),

  createResponse: t.Object({
    createdAt: t.String(),
    id: t.String(),
    isActive: t.Boolean(),
    key: t.String(),
    keyPrefix: t.String(),
    name: t.String(),
  }),

  listResponse: t.Array(
    t.Object({
      createdAt: t.String(),
      id: t.String(),
      isActive: t.Boolean(),
      keyPrefix: t.String(),
      lastUsedAt: t.Union([t.String(), t.Null()]),
      name: t.String(),
      requestCount: t.Number(),
      updatedAt: t.String(),
    })
  ),

  response: t.Object({
    createdAt: t.String(),
    id: t.String(),
    isActive: t.Boolean(),
    keyPrefix: t.String(),
    lastUsedAt: t.Union([t.String(), t.Null()]),
    name: t.String(),
    requestCount: t.Number(),
    updatedAt: t.String(),
  }),

  usageResponse: t.Object({
    key: t.Object({
      createdAt: t.String(),
      id: t.String(),
      isActive: t.Boolean(),
      keyPrefix: t.String(),
      lastUsedAt: t.Union([t.String(), t.Null()]),
      name: t.String(),
      requestCount: t.Number(),
    }),
    recentUsage: t.Array(
      t.Object({
        createdAt: t.String(),
        endpoint: t.String(),
        method: t.String(),
        processingMs: t.Union([t.Number(), t.Null()]),
        statusCode: t.Number(),
      })
    ),
    stats: t.Object({
      last24h: t.Number(),
      last30d: t.Number(),
      last7d: t.Number(),
    }),
  }),
};

export type CreateKeyBody = Static<typeof KeyModel.createBody>;
export type KeyResponse = Static<typeof KeyModel.response>;
export type CreateKeyResponse = Static<typeof KeyModel.createResponse>;
export type KeyUsageResponse = Static<typeof KeyModel.usageResponse>;
