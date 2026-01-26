import type { Session, User } from "better-auth/types";

import { auth } from "@ocrbase/auth";
import { db } from "@ocrbase/db";
import { member, organization, user } from "@ocrbase/db/schema/auth";
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
    apiKey?: {
      id: string;
      name: string;
      organizationId: string;
      userId: string;
    } | null;
    apiKeyAuth?: boolean;
    request: Request;
    wideEvent?: WideEventContext;
  }): Promise<{
    organization: Organization | null;
    session: Session | null;
    user: User | null;
  }> => {
    // If API key auth succeeded, fetch real user/org from DB
    if (apiKeyAuth && apiKey) {
      const [dbUser] = await db
        .select()
        .from(user)
        .where(eq(user.id, apiKey.userId));
      const [dbOrg] = await db
        .select()
        .from(organization)
        .where(eq(organization.id, apiKey.organizationId));

      if (!dbUser) {
        return { organization: null, session: null, user: null };
      }

      wideEvent?.setUser({ id: dbUser.id });
      if (dbOrg) {
        wideEvent?.setOrganization({ id: dbOrg.id, name: dbOrg.name });
      }

      return {
        organization: dbOrg
          ? {
              createdAt: dbOrg.createdAt,
              id: dbOrg.id,
              invitations: [],
              logo: dbOrg.logo,
              members: [],
              metadata: dbOrg.metadata,
              name: dbOrg.name,
              slug: dbOrg.slug ?? dbOrg.id,
            }
          : null,
        session: {
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 86_400_000),
          id: `apikey:${apiKey.id}`,
          ipAddress: null,
          token: "",
          updatedAt: new Date(),
          userAgent: request.headers.get("user-agent"),
          userId: dbUser.id,
        },
        user: dbUser,
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
