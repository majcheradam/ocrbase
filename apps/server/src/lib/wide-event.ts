import type { EnvironmentContext } from "./env-context";

export interface UserContext {
  id: string;
  email?: string;
}

export interface OrganizationContext {
  id: string;
  name?: string;
}

export interface JobContext {
  id: string;
  type?: string;
  fileSize?: number;
  mimeType?: string;
  pageCount?: number;
  status?: string;
}

export interface ErrorContext {
  message: string;
  code?: string;
  stack?: string;
}

export interface WideEventData {
  requestId: string;
  method: string;
  path: string;
  userAgent?: string;
  statusCode?: number;
  durationMs?: number;
  outcome?: "success" | "error";
  user?: UserContext;
  organization?: OrganizationContext;
  job?: JobContext;
  error?: ErrorContext;
  env: EnvironmentContext;
}

interface InitialContext {
  requestId: string;
  method: string;
  path: string;
  userAgent?: string;
  env: EnvironmentContext;
}

export class WideEventContext {
  private data: WideEventData;
  private startTime: number;

  constructor(initial: InitialContext) {
    this.startTime = performance.now();
    this.data = {
      env: initial.env,
      method: initial.method,
      path: initial.path,
      requestId: initial.requestId,
      userAgent: initial.userAgent,
    };
  }

  setUser(user: UserContext): void {
    this.data.user = user;
  }

  setOrganization(org: OrganizationContext): void {
    this.data.organization = org;
  }

  setJob(job: JobContext): void {
    this.data.job = { ...this.data.job, ...job };
  }

  setError(error: unknown): void {
    const isError = error instanceof Error;
    this.data.error = {
      code: isError ? error.name : "UNKNOWN_ERROR",
      message: isError ? error.message : String(error),
      stack: isError ? error.stack : undefined,
    };
  }

  finalize(statusCode: number): WideEventData {
    const durationMs = Math.round(performance.now() - this.startTime);
    const isSuccess = statusCode >= 200 && statusCode < 400;

    return {
      ...this.data,
      durationMs,
      outcome: isSuccess ? "success" : "error",
      statusCode,
    };
  }
}
