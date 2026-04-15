import { Elysia } from "elysia";

export const healthModule = new Elysia().get("/health", () => ({ status: "ok" }), {
  detail: {
    summary: "Health",
  },
});
