import { Copy, FileText } from "lucide-react";
import { useCallback } from "react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

interface ExtractedDataPanelProps {
  fields: ExtractedField[];
  lineItems?: LineItem[];
  onExportCSV: () => void;
  onExportJSON: () => void;
}

export const ExtractedDataPanel = ({
  fields,
  lineItems,
  onExportCSV,
  onExportJSON,
}: ExtractedDataPanelProps) => {
  const handleCopy = useCallback(() => {
    const data = {
      ...Object.fromEntries(fields.map((f) => [f.key, f.value])),
      lineItems,
    };
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
  }, [fields, lineItems]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="font-medium">Extracted Data</h2>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={handleCopy}>
            <Copy className="size-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onExportCSV}>
            <FileText className="size-4 mr-1" />
            CSV
          </Button>
          <Button variant="ghost" size="sm" onClick={onExportJSON}>
            <FileText className="size-4 mr-1" />
            JSON
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          <div className="space-y-3">
            {fields.map((field) => (
              <div
                key={field.key}
                className="flex items-baseline justify-between gap-4"
              >
                <span className="text-sm text-muted-foreground shrink-0">
                  {field.key}
                </span>
                <span className="text-sm text-right">
                  {field.value ?? (
                    <span className="text-muted-foreground">null</span>
                  )}
                </span>
              </div>
            ))}
          </div>

          {lineItems && lineItems.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">LineItems</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">UnitPrice</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lineItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.description}</TableCell>
                      <TableCell className="text-right">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.unitPrice}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.amount}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
