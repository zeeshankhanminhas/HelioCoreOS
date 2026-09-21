import * as React from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function HCButton({ className, size = "sm", ...props }: ButtonProps) {
  return <Button size={size} className={cn("rounded-[3px] text-[10px]", className)} {...props} />;
}
