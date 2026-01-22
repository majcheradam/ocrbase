import { Loader2, Upload } from "lucide-react";
import { type default as React, useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  mode: "parsing" | "extraction";
  isLoading?: boolean;
  onFileSelect: (file: File) => void;
  onUrlSubmit?: (url: string) => void;
}

export const FileUpload = ({
  mode,
  isLoading = false,
  onFileSelect,
  onUrlSubmit,
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

  const modeText = mode === "parsing" ? "parse" : "extract data from";

  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <h2 className="text-2xl text-foreground mb-8">
        Upload PDF or image to {modeText}.
      </h2>

      <div
        className={cn(
          "w-full max-w-md border-2 border-dashed rounded-lg p-8 transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center gap-4">
          {isLoading ? (
            <Loader2 className="size-8 text-muted-foreground animate-spin" />
          ) : (
            <Upload className="size-8 text-muted-foreground" />
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="relative"
              disabled={isLoading}
            >
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp,.tiff"
                onChange={handleFileChange}
                disabled={isLoading}
                className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
              {isLoading ? "Uploading..." : "Upload new"}
            </Button>
            {onUrlSubmit && (
              <Button variant="ghost" size="sm" disabled={isLoading}>
                Add from URL
              </Button>
            )}
          </div>

          <p className="text-sm text-muted-foreground">
            {isLoading
              ? "Processing your file..."
              : "Drop a file here, or use the options above"}
          </p>
        </div>
      </div>
    </div>
  );
};
