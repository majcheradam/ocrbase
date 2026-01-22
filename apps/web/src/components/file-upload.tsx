import { FileUp, Loader2 } from "lucide-react";
import { type default as React, useCallback, useState } from "react";

import { cn } from "@/lib/utils";

interface FileUploadProps {
  mode: "parsing" | "extraction";
  isLoading?: boolean;
  onFileSelect: (file: File) => void;
}

export const FileUpload = ({
  mode,
  isLoading = false,
  onFileSelect,
}: FileUploadProps): React.ReactNode => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (isLoading) {
        return;
      }
      const [file] = e.dataTransfer.files;
      if (file) {
        onFileSelect(file);
      }
    },
    [onFileSelect, isLoading]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <h1 className="text-2xl text-foreground mb-8">
        {mode === "parsing"
          ? "Upload a document or image to parse"
          : "Upload a document or image to extract data"}
      </h1>

      <label
        aria-label="Upload file"
        className={cn(
          "w-full max-w-lg border-2 border-dashed rounded-2xl p-12 transition-colors cursor-pointer",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/20",
          isLoading && "pointer-events-none opacity-60"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.webp,.tiff"
          onChange={handleFileChange}
          disabled={isLoading}
          className="sr-only"
        />

        <div className="flex flex-col items-center gap-4">
          <div className="size-13 rounded-xl bg-card border flex items-center justify-center">
            {isLoading ? (
              <Loader2 className="size-6 animate-spin" />
            ) : (
              <FileUp className="size-6" />
            )}
          </div>

          <div className="text-center">
            <p className="text-foreground font-medium">
              {isLoading ? "Uploading..." : "Click to upload, or drag and drop"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {isLoading
                ? "Processing your file..."
                : "PDF or image files up to 50MB"}
            </p>
          </div>
        </div>
      </label>
    </div>
  );
};
