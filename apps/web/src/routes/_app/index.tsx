import { useCreateJob } from "@ocrbase/sdk/react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { FileUpload } from "@/components/file-upload";
import { ModeToggle, type Mode } from "@/components/mode-toggle";
import { ModelSelector } from "@/components/model-selector";

const RouteComponent = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("parsing");
  const [model, setModel] = useState("paddleocr-vl-0.9b");
  const createJob = useCreateJob();

  const handleFileSelect = useCallback(
    async (file: File) => {
      try {
        const job = await createJob.mutateAsync({
          file,
          llmModel: model,
          type: mode === "parsing" ? "parse" : "extract",
        });
        navigate({ params: { jobId: job.id }, to: "/job/$jobId" });
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to create job"
        );
      }
    },
    [mode, model, createJob, navigate]
  );

  const handleModeChange = useCallback((value: Mode | null) => {
    if (value !== null) {
      setMode(value);
    }
  }, []);

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-4 px-6 py-3 shrink-0">
        <ModeToggle value={mode} onValueChange={handleModeChange} />
        <ModelSelector value={model} onValueChange={setModel} />
      </header>

      <div className="flex-1 min-h-0">
        <FileUpload
          mode={mode}
          isLoading={createJob.isPending}
          onFileSelect={handleFileSelect}
        />
      </div>
    </div>
  );
};

export const Route = createFileRoute("/_app/")({
  component: RouteComponent,
});
