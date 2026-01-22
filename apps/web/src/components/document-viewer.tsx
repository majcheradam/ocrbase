import { Image } from "@unpic/react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useCallback, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

import { Button } from "@/components/ui/button";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface DocumentViewerProps {
  fileUrl: string;
  fileName: string;
  fileSize: string;
}

export const DocumentViewer = ({
  fileUrl,
  fileName,
  fileSize,
}: DocumentViewerProps) => {
  const isPdf = fileName.toLowerCase().endsWith(".pdf");
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);

  const onDocumentLoadSuccess = useCallback(
    ({ numPages: pages }: { numPages: number }) => {
      setNumPages(pages);
    },
    []
  );

  const goToPrevPage = useCallback(() => {
    setPageNumber((prev) => Math.max(prev - 1, 1));
  }, []);

  const goToNextPage = useCallback(() => {
    setPageNumber((prev) => Math.min(prev + 1, numPages ?? 1));
  }, [numPages]);

  if (!isPdf) {
    return (
      <div className="flex flex-col h-full relative">
        <div className="flex-1 min-h-0 overflow-auto p-4">
          <div className="flex items-center justify-center min-h-full">
            <Image
              src={fileUrl}
              alt={fileName}
              layout="constrained"
              width={800}
              height={600}
              className="max-w-full max-h-full object-contain rounded-lg bg-white"
            />
          </div>
        </div>
        <div className="absolute bottom-4 right-4 z-10">
          <span className="text-sm text-muted-foreground backdrop-blur-[2px] bg-white/[0.02] dark:bg-black/50 border border-white/5 dark:border-white/10 dark:text-white px-3 py-1.5 rounded-md shadow-lg">
            {fileSize}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex-1 min-h-0 overflow-auto">
        <div className="flex justify-center p-4">
          <Document
            file={fileUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <div className="flex items-center justify-center h-[600px]">
                <Loader2 className="size-8 animate-spin text-muted-foreground" />
              </div>
            }
            error={
              <div className="flex items-center justify-center h-[600px] text-muted-foreground">
                Failed to load PDF
              </div>
            }
          >
            <Page
              pageNumber={pageNumber}
              renderTextLayer={true}
              renderAnnotationLayer={true}
            />
          </Document>
        </div>
      </div>

      <div className="absolute bottom-4 right-4 z-10">
        <span className="text-sm text-muted-foreground backdrop-blur-[2px] bg-white/[0.02] dark:bg-black/50 border border-white/5 dark:border-white/10 dark:text-white px-3 py-1.5 rounded-md shadow-lg">
          {fileSize}
        </span>
      </div>

      {numPages && numPages > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 backdrop-blur-[2px] bg-white/[0.02] dark:bg-black/50 border border-white/5 dark:border-white/10 dark:text-white px-2 py-1 rounded-md shadow-lg">
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="text-sm text-muted-foreground min-w-[60px] text-center">
            {pageNumber} / {numPages}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={goToNextPage}
            disabled={pageNumber >= numPages}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
};
