import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse skeleton-shimmer rounded-md bg-muted transition-opacity duration-300",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
