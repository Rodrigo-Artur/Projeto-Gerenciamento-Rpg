import * as React from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type TextFieldProps = Omit<React.ComponentProps<typeof Input>, "aria-invalid" | "aria-describedby"> & {
  label: string;
  hint?: string;
  error?: string;
  containerClassName?: string;
};

function TextField({ label, hint, error, containerClassName, id: customId, ...props }: TextFieldProps) {
  const generatedId = React.useId();
  const id = customId ?? generatedId;
  const describedBy = [
    hint ? `${id}-hint` : null,
    error ? `${id}-error` : null,
  ].filter(Boolean).join(" ") || undefined;

  return (
    <div data-slot="text-field" className={cn("grid gap-2", containerClassName)}>
      <label htmlFor={id} className="text-sm font-medium text-foreground">{label}</label>
      <Input id={id} aria-describedby={describedBy} aria-invalid={Boolean(error) || undefined} {...props} />
      {hint && <p id={`${id}-hint`} className="text-xs leading-relaxed text-muted-foreground">{hint}</p>}
      {error && <p id={`${id}-error`} role="alert" className="text-xs leading-relaxed text-destructive">{error}</p>}
    </div>
  );
}

export { TextField };
export type { TextFieldProps };
