import { auth } from "@ocrbase/auth";
import { Elysia } from "elysia";

/**
 * Auth routes for OpenAPI documentation.
 * Actual requests are handled by Better Auth via .mount(auth.handler).
 * No body validation here to avoid conflicts with Better Auth's body parsing.
 */
export const authRoutes = new Elysia({ prefix: "/v1/auth" })
  // ============== Authentication ==============
  .post("/sign-up/email", ({ request }) => auth.handler(request), {
    detail: {
      description: "Create a new account with email and password",
      requestBody: {
        content: {
          "application/json": {
            schema: {
              properties: {
                email: { example: "user@example.com", type: "string" },
                name: { example: "John Doe", type: "string" },
                password: { example: "securepassword123", type: "string" },
              },
              required: ["email", "password", "name"],
              type: "object",
            },
          },
        },
      },
      tags: ["Auth"],
    },
  })
  .post("/sign-in/email", ({ request }) => auth.handler(request), {
    detail: {
      description: "Sign in with email and password",
      requestBody: {
        content: {
          "application/json": {
            schema: {
              properties: {
                email: { example: "user@example.com", type: "string" },
                password: { type: "string" },
              },
              required: ["email", "password"],
              type: "object",
            },
          },
        },
      },
      tags: ["Auth"],
    },
  })
  .post("/sign-in/social", ({ request }) => auth.handler(request), {
    detail: {
      description: "Initiate social login (e.g., GitHub)",
      requestBody: {
        content: {
          "application/json": {
            schema: {
              properties: {
                callbackURL: { type: "string" },
                provider: { example: "github", type: "string" },
              },
              required: ["provider"],
              type: "object",
            },
          },
        },
      },
      tags: ["Auth"],
    },
  })
  .post("/sign-out", ({ request }) => auth.handler(request), {
    detail: {
      description: "Sign out and invalidate the current session",
      tags: ["Auth"],
    },
  })
  .get("/session", ({ request }) => auth.handler(request), {
    detail: {
      description: "Get the current user session",
      tags: ["Auth"],
    },
  })
  .post("/forget-password", ({ request }) => auth.handler(request), {
    detail: {
      description: "Request a password reset email",
      requestBody: {
        content: {
          "application/json": {
            schema: {
              properties: {
                email: { example: "user@example.com", type: "string" },
              },
              required: ["email"],
              type: "object",
            },
          },
        },
      },
      tags: ["Auth"],
    },
  })
  .post("/reset-password", ({ request }) => auth.handler(request), {
    detail: {
      description: "Reset password using a token from the reset email",
      requestBody: {
        content: {
          "application/json": {
            schema: {
              properties: {
                newPassword: { type: "string" },
                token: { type: "string" },
              },
              required: ["token", "newPassword"],
              type: "object",
            },
          },
        },
      },
      tags: ["Auth"],
    },
  })
  .get("/verify-email", ({ request }) => auth.handler(request), {
    detail: {
      description: "Verify email address using a token",
      tags: ["Auth"],
    },
  })

  // ============== Organization Management ==============
  .post("/organization/create", ({ request }) => auth.handler(request), {
    detail: {
      description: "Create a new organization",
      requestBody: {
        content: {
          "application/json": {
            schema: {
              properties: {
                name: { example: "My Organization", type: "string" },
                slug: { example: "my-org", type: "string" },
              },
              required: ["name", "slug"],
              type: "object",
            },
          },
        },
      },
      tags: ["Organization"],
    },
  })
  .get(
    "/organization/get-full-organization",
    ({ request }) => auth.handler(request),
    {
      detail: {
        description: "Get full organization details including members",
        tags: ["Organization"],
      },
    }
  )
  .post("/organization/update", ({ request }) => auth.handler(request), {
    detail: {
      description: "Update organization details",
      requestBody: {
        content: {
          "application/json": {
            schema: {
              properties: {
                data: {
                  properties: {
                    name: { type: "string" },
                    slug: { type: "string" },
                  },
                  type: "object",
                },
                organizationId: { type: "string" },
              },
              required: ["organizationId", "data"],
              type: "object",
            },
          },
        },
      },
      tags: ["Organization"],
    },
  })
  .post("/organization/delete", ({ request }) => auth.handler(request), {
    detail: {
      description: "Delete an organization (owner only)",
      requestBody: {
        content: {
          "application/json": {
            schema: {
              properties: {
                organizationId: { type: "string" },
              },
              required: ["organizationId"],
              type: "object",
            },
          },
        },
      },
      tags: ["Organization"],
    },
  })
  .post("/organization/set-active", ({ request }) => auth.handler(request), {
    detail: {
      description: "Set the active organization for the current session",
      requestBody: {
        content: {
          "application/json": {
            schema: {
              properties: {
                organizationId: { type: "string" },
              },
              required: ["organizationId"],
              type: "object",
            },
          },
        },
      },
      tags: ["Organization"],
    },
  })
  .get(
    "/organization/list-organizations",
    ({ request }) => auth.handler(request),
    {
      detail: {
        description: "List all organizations the user is a member of",
        tags: ["Organization"],
      },
    }
  )
  .get("/organization/check-slug", ({ request }) => auth.handler(request), {
    detail: {
      description: "Check if an organization slug is available",
      tags: ["Organization"],
    },
  })

  // ============== Member Management ==============
  .get("/organization/list-members", ({ request }) => auth.handler(request), {
    detail: {
      description: "List all members of an organization",
      tags: ["Organization"],
    },
  })
  .post("/organization/add-member", ({ request }) => auth.handler(request), {
    detail: {
      description: "Add a user directly to an organization",
      requestBody: {
        content: {
          "application/json": {
            schema: {
              properties: {
                organizationId: { type: "string" },
                role: { example: "member", type: "string" },
                userId: { type: "string" },
              },
              required: ["organizationId", "userId", "role"],
              type: "object",
            },
          },
        },
      },
      tags: ["Organization"],
    },
  })
  .post("/organization/remove-member", ({ request }) => auth.handler(request), {
    detail: {
      description: "Remove a member from an organization",
      requestBody: {
        content: {
          "application/json": {
            schema: {
              properties: {
                memberId: { type: "string" },
                organizationId: { type: "string" },
              },
              required: ["organizationId", "memberId"],
              type: "object",
            },
          },
        },
      },
      tags: ["Organization"],
    },
  })
  .post(
    "/organization/update-member-role",
    ({ request }) => auth.handler(request),
    {
      detail: {
        description: "Update a member's role in the organization",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                properties: {
                  memberId: { type: "string" },
                  organizationId: { type: "string" },
                  role: { example: "admin", type: "string" },
                },
                required: ["organizationId", "memberId", "role"],
                type: "object",
              },
            },
          },
        },
        tags: ["Organization"],
      },
    }
  )
  .get(
    "/organization/get-active-member",
    ({ request }) => auth.handler(request),
    {
      detail: {
        description: "Get current user's member details in active organization",
        tags: ["Organization"],
      },
    }
  )
  .post("/organization/leave", ({ request }) => auth.handler(request), {
    detail: {
      description: "Leave an organization",
      requestBody: {
        content: {
          "application/json": {
            schema: {
              properties: {
                organizationId: { type: "string" },
              },
              required: ["organizationId"],
              type: "object",
            },
          },
        },
      },
      tags: ["Organization"],
    },
  })

  // ============== Invitations ==============
  .post("/organization/invite-member", ({ request }) => auth.handler(request), {
    detail: {
      description: "Send an invitation to join an organization",
      requestBody: {
        content: {
          "application/json": {
            schema: {
              properties: {
                email: { example: "user@example.com", type: "string" },
                organizationId: { type: "string" },
                role: { example: "member", type: "string" },
              },
              required: ["organizationId", "email", "role"],
              type: "object",
            },
          },
        },
      },
      tags: ["Organization"],
    },
  })
  .post(
    "/organization/accept-invitation",
    ({ request }) => auth.handler(request),
    {
      detail: {
        description: "Accept an organization invitation",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                properties: {
                  invitationId: { type: "string" },
                },
                required: ["invitationId"],
                type: "object",
              },
            },
          },
        },
        tags: ["Organization"],
      },
    }
  )
  .post(
    "/organization/reject-invitation",
    ({ request }) => auth.handler(request),
    {
      detail: {
        description: "Reject an organization invitation",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                properties: {
                  invitationId: { type: "string" },
                },
                required: ["invitationId"],
                type: "object",
              },
            },
          },
        },
        tags: ["Organization"],
      },
    }
  )
  .post(
    "/organization/cancel-invitation",
    ({ request }) => auth.handler(request),
    {
      detail: {
        description: "Cancel a pending invitation",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                properties: {
                  invitationId: { type: "string" },
                },
                required: ["invitationId"],
                type: "object",
              },
            },
          },
        },
        tags: ["Organization"],
      },
    }
  )
  .get("/organization/get-invitation", ({ request }) => auth.handler(request), {
    detail: {
      description: "Get details of a specific invitation",
      tags: ["Organization"],
    },
  })
  .get(
    "/organization/list-invitations",
    ({ request }) => auth.handler(request),
    {
      detail: {
        description: "List all invitations for an organization",
        tags: ["Organization"],
      },
    }
  )

  // ============== Access Control ==============
  .post(
    "/organization/has-permission",
    ({ request }) => auth.handler(request),
    {
      detail: {
        description:
          "Check if user has specific permissions in the organization",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                properties: {
                  organizationId: { type: "string" },
                  permission: { type: "string" },
                },
                required: ["organizationId", "permission"],
                type: "object",
              },
            },
          },
        },
        tags: ["Organization"],
      },
    }
  );
