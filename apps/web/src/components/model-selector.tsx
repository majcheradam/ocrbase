import { useCallback, useMemo } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MODELS = [
  { id: "paddleocr-vl-0.9b", name: "PaddleOCR-VL 0.9B" },
] as const;

interface ModelSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
}

export const ModelSelector = ({ value, onValueChange }: ModelSelectorProps) => {
  const handleChange = useCallback(
    (newValue: string | null) => {
      if (newValue !== null) {
        onValueChange(newValue);
      }
    },
    [onValueChange]
  );

  const selectedModel = useMemo(
    () => MODELS.find((m) => m.id === value),
    [value]
  );

  return (
    <Select value={value} onValueChange={handleChange}>
      <SelectTrigger className="w-auto border-none bg-transparent shadow-none hover:bg-transparent focus:ring-0 gap-1 px-0">
        <SelectValue placeholder="Select model">
          <span className="text-lg text-foreground">{selectedModel?.name}</span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {MODELS.map((model) => (
          <SelectItem key={model.id} value={model.id}>
            {model.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
