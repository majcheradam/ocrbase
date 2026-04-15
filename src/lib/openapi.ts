import { fromTypes, openapi as openapiPlugin } from "@elysiajs/openapi";

export const openapi = openapiPlugin({
  path: "/v1/openapi",
  references: fromTypes(),
  scalar: {
    url: "/v1/openapi/json",
  },
});
