import { auth } from "@ocrbase/auth";
import { db } from "@ocrbase/db";
import { jobs } from "@ocrbase/db/schema/jobs";
import { and, eq } from "drizzle-orm";
import { Elysia } from "elysia";

import { validateApiKey } from "@/lib/api-key";
import {
  subscribeToJob,
  unsubscribeFromJob,
  type JobUpdateMessage,
} from "@/services/websocket";

interface WebSocketData {
  jobId: string;
  userId: string;
  organizationId: string;
  callback: (message: JobUpdateMessage) => void;
}

export const jobsWebSocket = new Elysia().ws("/v1/realtime", {
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
    const queryJobId = (
      ws.data as unknown as { query?: Record<string, unknown> }
    ).query?.job_id;
    const jobId = Array.isArray(queryJobId) ? queryJobId[0] : queryJobId;

    if (!jobId || typeof jobId !== "string") {
      ws.send(
        JSON.stringify({
          data: { error: "Missing job_id query parameter" },
          jobId: "unknown",
          type: "error",
        })
      );
      ws.close();
      return;
    }

    let userId: string;
    let organizationId: string;

    // Try API key auth first (skip usage tracking for websocket)
    const apiKeyAuth = await validateApiKey(ws.data.headers?.authorization, {
      updateUsage: false,
    });
    if (apiKeyAuth) {
      ({ userId } = apiKeyAuth);
      ({ organizationId } = apiKeyAuth);
    } else {
      // Fall back to session auth
      const headers = new Headers();
      const cookie = ws.data.headers?.cookie;
      if (cookie) {
        headers.set("cookie", cookie);
      }

      const session = await auth.api.getSession({ headers });
      if (!session?.user || !session.session.activeOrganizationId) {
        ws.send(
          JSON.stringify({
            data: { error: "Unauthorized" },
            jobId,
            type: "error",
          })
        );
        ws.close();
        return;
      }

      userId = session.user.id;
      organizationId = session.session.activeOrganizationId;
    }

    const job = await db.query.jobs.findFirst({
      where: and(eq(jobs.id, jobId), eq(jobs.organizationId, organizationId)),
    });

    if (!job) {
      ws.send(
        JSON.stringify({
          data: { error: "Job not found" },
          jobId,
          type: "error",
        })
      );
      ws.close();
      return;
    }

    const callback = (message: JobUpdateMessage): void => {
      ws.send(JSON.stringify(message));
    };

    (ws.data as unknown as { wsData: WebSocketData }).wsData = {
      callback,
      jobId,
      organizationId,
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
