import type * as React from "react";

import { cn } from "@/lib/utils";

const Skeleton = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div
    data-slot="skeleton"
    className={cn("bg-muted rounded-md animate-pulse", className)}
    {...props}
  />
);

export { Skeleton };
