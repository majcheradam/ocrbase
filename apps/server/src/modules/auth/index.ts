import { auth } from "@ocrbase/auth";
import { Elysia, t } from "elysia";

/**
 * Auth routes documentation for OpenAPI.
 * These routes are handled by Better Auth via the catch-all handler,
 * but we document them here for API discoverability.
 */
export const authRoutes = new Elysia({ prefix: "/api/auth" })
  // ============== Authentication ==============
  .post("/sign-up/email", ({ request }) => auth.handler(request), {
    body: t.Object({
      email: t.String({ format: "email" }),
      name: t.String(),
      password: t.String({ minLength: 8 }),
    }),
    detail: {
      description: "Create a new account with email and password",
      tags: ["Auth"],
    },
  })
  .post("/sign-in/email", ({ request }) => auth.handler(request), {
    body: t.Object({
      email: t.String({ format: "email" }),
      password: t.String(),
    }),
    detail: {
      description: "Sign in with email and password",
      tags: ["Auth"],
    },
  })
  .post("/sign-in/social", ({ request }) => auth.handler(request), {
    body: t.Object({
      callbackURL: t.Optional(t.String()),
      provider: t.String({ examples: ["github"] }),
    }),
    detail: {
      description: "Initiate social login (e.g., GitHub)",
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
    body: t.Object({
      email: t.String({ format: "email" }),
      redirectTo: t.Optional(t.String()),
    }),
    detail: {
      description: "Request a password reset email",
      tags: ["Auth"],
    },
  })
  .post("/reset-password", ({ request }) => auth.handler(request), {
    body: t.Object({
      newPassword: t.String({ minLength: 8 }),
      token: t.String(),
    }),
    detail: {
      description: "Reset password using a token from the reset email",
      tags: ["Auth"],
    },
  })
  .get("/verify-email", ({ request }) => auth.handler(request), {
    detail: {
      description: "Verify email address using a token",
      tags: ["Auth"],
    },
    query: t.Object({
      token: t.String(),
    }),
  })

  // ============== Organization Management ==============
  .post("/organization/create", ({ request }) => auth.handler(request), {
    body: t.Object({
      logo: t.Optional(t.String()),
      metadata: t.Optional(t.Record(t.String(), t.Unknown())),
      name: t.String(),
      slug: t.String(),
    }),
    detail: {
      description: "Create a new organization",
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
      query: t.Object({
        organizationId: t.Optional(t.String()),
      }),
    }
  )
  .post("/organization/update", ({ request }) => auth.handler(request), {
    body: t.Object({
      data: t.Object({
        logo: t.Optional(t.String()),
        metadata: t.Optional(t.Record(t.String(), t.Unknown())),
        name: t.Optional(t.String()),
        slug: t.Optional(t.String()),
      }),
      organizationId: t.String(),
    }),
    detail: {
      description: "Update organization details",
      tags: ["Organization"],
    },
  })
  .post("/organization/delete", ({ request }) => auth.handler(request), {
    body: t.Object({
      organizationId: t.String(),
    }),
    detail: {
      description: "Delete an organization (owner only)",
      tags: ["Organization"],
    },
  })
  .post("/organization/set-active", ({ request }) => auth.handler(request), {
    body: t.Object({
      organizationId: t.String(),
    }),
    detail: {
      description: "Set the active organization for the current session",
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
    query: t.Object({
      slug: t.String(),
    }),
  })

  // ============== Member Management ==============
  .get("/organization/list-members", ({ request }) => auth.handler(request), {
    detail: {
      description: "List all members of an organization",
      tags: ["Organization"],
    },
    query: t.Object({
      organizationId: t.String(),
    }),
  })
  .post("/organization/add-member", ({ request }) => auth.handler(request), {
    body: t.Object({
      organizationId: t.String(),
      role: t.String(),
      userId: t.String(),
    }),
    detail: {
      description: "Add a user directly to an organization",
      tags: ["Organization"],
    },
  })
  .post("/organization/remove-member", ({ request }) => auth.handler(request), {
    body: t.Object({
      memberIdOrEmail: t.String(),
      organizationId: t.String(),
    }),
    detail: {
      description: "Remove a member from an organization",
      tags: ["Organization"],
    },
  })
  .post(
    "/organization/update-member-role",
    ({ request }) => auth.handler(request),
    {
      body: t.Object({
        memberId: t.String(),
        organizationId: t.String(),
        role: t.String(),
      }),
      detail: {
        description: "Update a member's role in the organization",
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
    body: t.Object({
      organizationId: t.String(),
    }),
    detail: {
      description: "Leave an organization",
      tags: ["Organization"],
    },
  })

  // ============== Invitations ==============
  .post("/organization/invite-member", ({ request }) => auth.handler(request), {
    body: t.Object({
      email: t.String({ format: "email" }),
      organizationId: t.String(),
      role: t.String(),
    }),
    detail: {
      description: "Send an invitation to join an organization",
      tags: ["Organization"],
    },
  })
  .post(
    "/organization/accept-invitation",
    ({ request }) => auth.handler(request),
    {
      body: t.Object({
        invitationId: t.String(),
      }),
      detail: {
        description: "Accept an organization invitation",
        tags: ["Organization"],
      },
    }
  )
  .post(
    "/organization/reject-invitation",
    ({ request }) => auth.handler(request),
    {
      body: t.Object({
        invitationId: t.String(),
      }),
      detail: {
        description: "Reject an organization invitation",
        tags: ["Organization"],
      },
    }
  )
  .post(
    "/organization/cancel-invitation",
    ({ request }) => auth.handler(request),
    {
      body: t.Object({
        invitationId: t.String(),
      }),
      detail: {
        description: "Cancel a pending invitation",
        tags: ["Organization"],
      },
    }
  )
  .get("/organization/get-invitation", ({ request }) => auth.handler(request), {
    detail: {
      description: "Get details of a specific invitation",
      tags: ["Organization"],
    },
    query: t.Object({
      invitationId: t.String(),
    }),
  })
  .get(
    "/organization/list-invitations",
    ({ request }) => auth.handler(request),
    {
      detail: {
        description: "List all invitations for an organization",
        tags: ["Organization"],
      },
      query: t.Object({
        organizationId: t.String(),
      }),
    }
  )

  // ============== Access Control ==============
  .post(
    "/organization/has-permission",
    ({ request }) => auth.handler(request),
    {
      body: t.Object({
        organizationId: t.Optional(t.String()),
        permission: t.Record(t.String(), t.Array(t.String())),
      }),
      detail: {
        description:
          "Check if user has specific permissions in the organization",
        tags: ["Organization"],
      },
    }
  );
