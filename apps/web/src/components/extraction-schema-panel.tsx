import { PenLine, Sparkles, type LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";

interface SchemaOption {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  onClick: () => void;
}

interface ExtractionSchemaPanelProps {
  onGenerateWithAI: () => void;
  onBuildManually: () => void;
}

const SchemaOptionCard = ({
  icon: Icon,
  title,
  description,
  onClick,
}: Omit<SchemaOption, "id">) => (
  <Card
    className="flex flex-col items-center p-6 bg-card cursor-pointer hover:bg-accent transition-colors"
    onClick={onClick}
  >
    <div className="size-12 rounded-lg bg-muted flex items-center justify-center">
      <Icon className="size-5 text-muted-foreground" />
    </div>
    <span className="font-medium text-card-foreground">{title}</span>
    <span className="text-sm text-muted-foreground text-center mt-1">
      {description}
    </span>
  </Card>
);

export const ExtractionSchemaPanel = ({
  onGenerateWithAI,
  onBuildManually,
}: ExtractionSchemaPanelProps) => {
  const options: SchemaOption[] = [
    {
      description: "AI analyzes document and extracts data automatically",
      icon: Sparkles,
      id: "generate-ai",
      onClick: onGenerateWithAI,
      title: "Generate with AI",
    },
    {
      description: "Define fields and types yourself",
      icon: PenLine,
      id: "build-manually",
      onClick: onBuildManually,
      title: "Build manually",
    },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <h2 className="text-xl font-semibold mb-2">Define extraction schema</h2>
        <p className="text-sm text-muted-foreground text-center mb-8">
          Choose how you want to define what data to extract
        </p>

        <div className="flex flex-col gap-6 w-full max-w-sm">
          {options.map(({ id, ...option }) => (
            <SchemaOptionCard key={id} {...option} />
          ))}
        </div>
      </div>
    </div>
  );
};
