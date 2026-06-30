import * as React from "react";
import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-20 w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 px-3.5 py-2.5 text-sm font-medium text-neutral-900 dark:text-neutral-50 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 transition-all duration-200 outline-none focus-visible:border-neutral-950 dark:focus-visible:border-neutral-50 focus-visible:ring-1 focus-visible:ring-neutral-950 dark:focus-visible:ring-neutral-50 disabled:pointer-events-none disabled:opacity-50 resize-none",
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
