import { cn } from "@/lib/utils";

interface BentoGridProps {
  children: React.ReactNode;
  className?: string;
}

export function BentoGrid({ children, className }: BentoGridProps) {
  return <div className={cn("bento-grid", className)}>{children}</div>;
}

type BentoSpan = "1x1" | "2x1" | "1x2" | "2x2" | "3x1" | "3x2" | "full";

interface BentoItemProps {
  span?: BentoSpan;
  children: React.ReactNode;
  className?: string;
}

const spanClass: Record<BentoSpan, string> = {
  "1x1": "bento-1x1",
  "2x1": "bento-2x1",
  "1x2": "bento-1x2",
  "2x2": "bento-2x2",
  "3x1": "bento-3x1",
  "3x2": "bento-3x2",
  full: "bento-full",
};

export function BentoItem({ span = "1x1", children, className }: BentoItemProps) {
  return <div className={cn(spanClass[span], className)}>{children}</div>;
}
