"use client";

import { useFormStatus } from "react-dom";
import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";

type Props = ComponentProps<typeof Button> & {
  pendingLabel?: string;
};

export function SubmitButton({
  children,
  pendingLabel,
  loading,
  ...props
}: Props) {
  const { pending } = useFormStatus();
  const isLoading = Boolean(loading || pending);

  return (
    <Button
      type="submit"
      {...props}
      loading={isLoading}
      onClick={(event) => {
        if (isLoading) {
          event.preventDefault();
          return;
        }
        props.onClick?.(event);
      }}
    >
      {isLoading && pendingLabel ? pendingLabel : children}
    </Button>
  );
}
