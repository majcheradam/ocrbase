import type { Session, User } from "better-auth/types";

import { auth } from "@ocrbase/auth";
import { db } from "@ocrbase/db";
import { member, organization } from "@ocrbase/db/schema/auth";
import { eq } from "drizzle-orm";
import { Elysia } from "elysia";

import type { WideEventContext } from "../lib/wide-event";

import { apiKeyPlugin } from "./api-key";

type Organization = Awaited<ReturnType<typeof auth.api.getFullOrganization>>;

export const authPlugin = new Elysia({ name: "auth" }).use(apiKeyPlugin).derive(
  { as: "global" },
  async ({
    apiKey,
    apiKeyAuth,
    request,
    wideEvent,
  }: {
    apiKey?: { id: string; name: string } | null;
    apiKeyAuth?: boolean;
    request: Request;
    wideEvent?: WideEventContext;
  }): Promise<{
    organization: Organization | null;
    session: Session | null;
    user: User | null;
  }> => {
    // If API key auth succeeded, create a virtual user/session
    if (apiKeyAuth && apiKey) {
      wideEvent?.setUser({ id: `apikey:${apiKey.id}` });
      return {
        organization: null,
        session: {
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 86_400_000),
          id: `apikey:${apiKey.id}`,
          ipAddress: null,
          token: "",
          updatedAt: new Date(),
          userAgent: request.headers.get("user-agent"),
          userId: `apikey:${apiKey.id}`,
        },
        user: {
          createdAt: new Date(),
          email: `${apiKey.name}@apikey.local`,
          emailVerified: true,
          id: `apikey:${apiKey.id}`,
          image: null,
          name: apiKey.name,
          updatedAt: new Date(),
        },
      };
    }

    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return {
        organization: null,
        session: null,
        user: null,
      };
    }

    wideEvent?.setUser({ id: session.user.id });

    // Try to get the active organization first
    let activeOrg = await auth.api.getFullOrganization({
      headers: request.headers,
    });

    // If no active org, check header
    if (!activeOrg) {
      const orgId = request.headers.get("x-organization-id");
      if (orgId) {
        activeOrg = await auth.api.getFullOrganization({
          headers: request.headers,
          query: { organizationId: orgId },
        });
      }
    }

    // If still no org, find the first organization the user is a member of
    if (!activeOrg) {
      const userMembership = await db
        .select({
          organization: organization,
        })
        .from(member)
        .innerJoin(organization, eq(member.organizationId, organization.id))
        .where(eq(member.userId, session.user.id))
        .limit(1);

      const [firstMembership] = userMembership;
      if (firstMembership) {
        // Get full organization details using the API
        activeOrg = await auth.api.getFullOrganization({
          headers: request.headers,
          query: { organizationId: firstMembership.organization.id },
        });
      }
    }

    if (activeOrg) {
      wideEvent?.setOrganization({ id: activeOrg.id, name: activeOrg.name });
    }

    return {
      organization: activeOrg,
      session: session.session,
      user: session.user,
    };
  }
);

export const requireAuth = new Elysia({ name: "requireAuth" })
  .use(authPlugin)
  .onBeforeHandle({ as: "scoped" }, ({ set, user }) => {
    if (!user) {
      set.status = 401;
      return { message: "Unauthorized" };
    }
  });
