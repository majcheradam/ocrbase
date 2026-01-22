import { FileText, Table2 } from "lucide-react";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type Mode = "parsing" | "extraction";

interface ModeToggleProps {
  value: Mode;
  onValueChange: (value: Mode | null) => void;
}

export const ModeToggle = ({ value, onValueChange }: ModeToggleProps) => (
  <Tabs value={value} onValueChange={onValueChange}>
    <TabsList>
      <TabsTrigger value="parsing">
        <FileText />
        Parsing
      </TabsTrigger>
      <TabsTrigger value="extraction">
        <Table2 />
        Extraction
      </TabsTrigger>
    </TabsList>
  </Tabs>
);
