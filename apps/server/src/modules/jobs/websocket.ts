import { auth } from "@ocrbase/auth";
import { db } from "@ocrbase/db";
import { member, organization } from "@ocrbase/db/schema/auth";
import { jobs } from "@ocrbase/db/schema/jobs";
import { and, eq } from "drizzle-orm";
import { Elysia } from "elysia";

import {
  subscribeToJob,
  unsubscribeFromJob,
  type JobUpdateMessage,
} from "../../services/websocket";

interface WebSocketData {
  jobId: string;
  userId: string;
  organizationId: string;
  callback: (message: JobUpdateMessage) => void;
}

export const jobsWebSocket = new Elysia().ws("/ws/jobs/:jobId", {
  close(ws) {
    const { wsData } = ws.data as unknown as { wsData?: WebSocketData };

    if (wsData) {
      unsubscribeFromJob(wsData.jobId, wsData.callback);
    }
  },

  message(ws, message) {
    if (typeof message === "string") {
      try {
        const parsed = JSON.parse(message) as { type?: string };
        if (parsed.type === "ping") {
          ws.send(JSON.stringify({ type: "pong" }));
        }
      } catch {
        // Ignore invalid messages
      }
    }
  },

  async open(ws) {
    const { jobId } = ws.data.params;

    const headers = new Headers();
    const cookie = ws.data.headers?.cookie;

    if (cookie) {
      headers.set("cookie", cookie);
    }

    const session = await auth.api.getSession({
      headers,
    });

    if (!session?.user) {
      ws.send(JSON.stringify({ error: "Unauthorized", type: "error" }));
      ws.close();
      return;
    }

    const userId = session.user.id;
    let activeOrg = session.session.activeOrganizationId;

    // If no active org in session, find user's first organization
    if (!activeOrg) {
      const userMembership = await db
        .select({ organization: organization })
        .from(member)
        .innerJoin(organization, eq(member.organizationId, organization.id))
        .where(eq(member.userId, userId))
        .limit(1);

      const [firstMembership] = userMembership;
      if (firstMembership) {
        activeOrg = firstMembership.organization.id;
      }
    }

    if (!activeOrg) {
      ws.send(
        JSON.stringify({ error: "No active organization", type: "error" })
      );
      ws.close();
      return;
    }

    const job = await db.query.jobs.findFirst({
      where: and(eq(jobs.id, jobId), eq(jobs.organizationId, activeOrg)),
    });

    if (!job) {
      ws.send(JSON.stringify({ error: "Job not found", type: "error" }));
      ws.close();
      return;
    }

    const callback = (message: JobUpdateMessage): void => {
      ws.send(JSON.stringify(message));
    };

    (ws.data as unknown as { wsData: WebSocketData }).wsData = {
      callback,
      jobId,
      organizationId: activeOrg,
      userId,
    };

    subscribeToJob(jobId, callback);

    ws.send(
      JSON.stringify({
        data: { status: job.status },
        jobId,
        type: "status",
      })
    );
  },
});
