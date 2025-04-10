
import { cn } from "@/lib/utils";

export function Heading({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h1
      className={cn(
        "text-3xl font-bold tracking-tight text-foreground",
        className
      )}
      {...props}
    >
      {children}
    </h1>
  );
}

export function HeadingDescription({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-muted-foreground text-lg", className)}
      {...props}
    >
      {children}
    </p>
  );
}
