import type { JobResponse } from "@ocrbase/sdk";

import {
  useDownloadJob,
  useJob,
  useJobFileUrl,
  useJobSubscription,
} from "@ocrbase/sdk/react";
import { createFileRoute } from "@tanstack/react-router";
import { AlertCircle, Loader2 } from "lucide-react";
import {
  type default as React,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";

import { DocumentViewer } from "@/components/document-viewer";
import { ExtractedDataPanel } from "@/components/extracted-data-panel";
import { ExtractionSchemaPanel } from "@/components/extraction-schema-panel";
import { type Mode, ModeToggle } from "@/components/mode-toggle";
import { ModelSelector } from "@/components/model-selector";
import { ParsedResults } from "@/components/parsed-results";
import { downloadFile, formatFileSize } from "@/lib/format";

type ExtractionState = "schema" | "processing" | "results";

interface ExtractedField {
  key: string;
  value: string | number | null;
}

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

const parseJsonResult = (
  jsonResult: unknown
): { fields: ExtractedField[]; lineItems: LineItem[] } => {
  if (!jsonResult || typeof jsonResult !== "object") {
    return { fields: [], lineItems: [] };
  }

  const result = jsonResult as Record<string, unknown>;
  const fields: ExtractedField[] = [];
  let lineItems: LineItem[] = [];

  for (const [key, value] of Object.entries(result)) {
    if (key === "lineItems" && Array.isArray(value)) {
      lineItems = value.map((item, index) => ({
        amount: (item as Record<string, unknown>).amount as number,
        description: (item as Record<string, unknown>).description as string,
        id: String(index + 1),
        quantity: (item as Record<string, unknown>).quantity as number,
        unitPrice: (item as Record<string, unknown>).unitPrice as number,
      }));
    } else if (
      typeof value === "string" ||
      typeof value === "number" ||
      value === null
    ) {
      fields.push({ key, value: value as string | number | null });
    }
  }

  return { fields, lineItems };
};

const LoadingState = (): React.ReactNode => (
  <div className="flex h-full items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="size-8 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">Loading job...</p>
    </div>
  </div>
);

const ErrorState = ({ message }: { message: string }): React.ReactNode => (
  <div className="flex h-full items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <AlertCircle className="size-8 text-destructive" />
      <p className="text-sm text-destructive">{message}</p>
    </div>
  </div>
);

const ProcessingState = ({ status }: { status: string }): React.ReactNode => (
  <div className="flex h-full flex-col items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="size-8 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">
        {status === "extracting" ? "Extracting data..." : "Processing..."}
      </p>
    </div>
  </div>
);

interface SidebarPanelProps {
  mode: Mode;
  extractionState: ExtractionState;
  job: JobResponse;
  isJobActive: boolean;
  fields: ExtractedField[];
  lineItems: LineItem[];
  onGenerateWithAI: () => void;
  onBuildManually: () => void;
  onExportCSV: () => void;
  onExportJSON: () => void;
}

const SidebarPanel = ({
  mode,
  extractionState,
  job,
  isJobActive,
  fields,
  lineItems,
  onGenerateWithAI,
  onBuildManually,
  onExportCSV,
  onExportJSON,
}: SidebarPanelProps): React.ReactNode => {
  const showProcessingState =
    isJobActive && (mode === "parsing" ? !job.markdownResult : !job.jsonResult);

  const text = job.markdownResult ?? "";
  const totalChars = text.length;
  const estimatedTokens = Math.ceil(totalChars / 4);

  if (mode === "parsing") {
    if (showProcessingState) {
      return <ProcessingState status={job.status} />;
    }
    return (
      <ParsedResults
        text={text}
        totalChars={totalChars}
        estimatedTokens={estimatedTokens}
      />
    );
  }

  if (extractionState === "schema") {
    return (
      <ExtractionSchemaPanel
        onGenerateWithAI={onGenerateWithAI}
        onBuildManually={onBuildManually}
      />
    );
  }

  if (showProcessingState) {
    return <ProcessingState status={job.status} />;
  }

  return (
    <ExtractedDataPanel
      fields={fields}
      lineItems={lineItems}
      onExportCSV={onExportCSV}
      onExportJSON={onExportJSON}
    />
  );
};

const RouteComponent = (): React.ReactNode => {
  const { jobId } = Route.useParams();

  const { data: job, isLoading, error } = useJob(jobId);
  const { data: fileUrl } = useJobFileUrl(jobId);
  const downloadJob = useDownloadJob();

  const isJobActive =
    job?.status === "pending" ||
    job?.status === "processing" ||
    job?.status === "extracting";

  useJobSubscription(jobId, {
    enabled: isJobActive,
    onError: (errorMsg) => toast.error(errorMsg),
  });

  const [mode, setMode] = useState<Mode>("parsing");
  const [model, setModel] = useState("paddleocr-vl-0.9b");
  const [extractionState, setExtractionState] =
    useState<ExtractionState>("schema");

  useEffect(() => {
    if (!job) {
      return;
    }
    setMode(job.type === "extract" ? "extraction" : "parsing");
    if (job.llmModel) {
      setModel(job.llmModel);
    }
    if (
      job.type === "extract" &&
      job.status === "completed" &&
      job.jsonResult
    ) {
      setExtractionState("results");
    }
  }, [job]);

  const { fields, lineItems } = useMemo(
    () => parseJsonResult(job?.jsonResult),
    [job?.jsonResult]
  );

  const fileSizeFormatted = job ? formatFileSize(job.fileSize) : "";

  const handleModeChange = useCallback((value: Mode | null) => {
    if (value === null) {
      return;
    }
    setMode(value);
    if (value === "extraction") {
      setExtractionState("schema");
    }
  }, []);

  const handleGenerateWithAI = useCallback(
    () => setExtractionState("results"),
    []
  );
  const handleBuildManually = useCallback(
    () => setExtractionState("results"),
    []
  );

  const handleExportCSV = useCallback(() => {
    if (!job?.jsonResult) {
      return;
    }
    const { fields: f, lineItems: l } = parseJsonResult(job.jsonResult);
    const rows = ["Field,Value"];
    for (const field of f) {
      rows.push(`"${field.key}","${field.value ?? ""}"`);
    }
    if (l.length > 0) {
      rows.push("", "Description,Quantity,UnitPrice,Amount");
      for (const item of l) {
        rows.push(
          `"${item.description}",${item.quantity},${item.unitPrice},${item.amount}`
        );
      }
    }
    downloadFile(
      rows.join("\n"),
      job.fileName.replace(/\.[^.]+$/, ".csv"),
      "text/csv"
    );
  }, [job]);

  const handleExportJSON = useCallback(async () => {
    if (!job) {
      return;
    }
    try {
      const content = await downloadJob.mutateAsync({
        format: "json",
        id: job.id,
      });
      downloadFile(
        content,
        job.fileName.replace(/\.[^.]+$/, ".json"),
        "application/json"
      );
    } catch {
      toast.error("Failed to export JSON");
    }
  }, [job, downloadJob]);

  if (isLoading) {
    return <LoadingState />;
  }
  if (error || !job) {
    return <ErrorState message={error?.message ?? "Job not found"} />;
  }
  if (job.status === "failed") {
    return <ErrorState message={job.errorMessage ?? "Job processing failed"} />;
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-4 border-b px-6 py-3">
        <ModeToggle value={mode} onValueChange={handleModeChange} />
        <ModelSelector value={model} onValueChange={setModel} />
      </header>

      <div className="flex flex-1 min-h-0">
        <div className="w-1/2 min-w-0 overflow-hidden">
          <DocumentViewer
            fileUrl={fileUrl ?? ""}
            fileName={job.fileName}
            fileSize={fileSizeFormatted}
          />
        </div>

        <div className="w-1/2 border-l overflow-hidden">
          <SidebarPanel
            mode={mode}
            extractionState={extractionState}
            job={job}
            isJobActive={isJobActive}
            fields={fields}
            lineItems={lineItems}
            onGenerateWithAI={handleGenerateWithAI}
            onBuildManually={handleBuildManually}
            onExportCSV={handleExportCSV}
            onExportJSON={handleExportJSON}
          />
        </div>
      </div>
    </div>
  );
};

export const Route = createFileRoute("/_app/job/$jobId")({
  component: RouteComponent,
});
