import { Check, Copy } from "lucide-react";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";

interface ParsedResultsProps {
  text: string;
  totalChars: number;
  estimatedTokens: number;
}

export const ParsedResults = ({
  text,
  totalChars,
  estimatedTokens,
}: ParsedResultsProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopyAll = useCallback(() => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  return (
    <div className="flex flex-col h-full relative">
      <div className="absolute top-2 right-2 z-10">
        <Button
          variant="ghost"
          size="icon"
          className="backdrop-blur-[2px] bg-white/[0.02] dark:bg-black/50 border border-white/5 dark:border-white/10 dark:text-white rounded-md shadow-lg"
          onClick={handleCopyAll}
          title="Copy all"
        >
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        </Button>
      </div>

      <div className="flex-1 min-h-0 overflow-auto">
        <div className="px-4 py-4 pr-12">
          <pre className="text-sm whitespace-pre-wrap font-sans">{text}</pre>
        </div>
      </div>

      <div className="absolute bottom-4 right-4 z-10">
        <span className="text-sm text-muted-foreground backdrop-blur-[2px] bg-white/[0.02] dark:bg-black/50 border border-white/5 dark:border-white/10 dark:text-white px-3 py-1.5 rounded-md shadow-lg">
          {totalChars.toLocaleString()} chars · ~
          {estimatedTokens.toLocaleString()} tokens
        </span>
      </div>
    </div>
  );
};
