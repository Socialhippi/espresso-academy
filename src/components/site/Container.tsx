import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ContainerElement = "div" | "section" | "header" | "footer" | "nav" | "article" | "aside";

interface ContainerProps {
  children: ReactNode;
  className?: string;
  as?: ContainerElement;
  id?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
}

/** The 1200px measure with 20px mobile and 32px desktop gutters, from design/tokens.css. */
export function Container({ children, className, as: Tag = "div", ...rest }: ContainerProps) {
  return (
    <Tag className={cn("container-site", className)} {...rest}>
      {children}
    </Tag>
  );
}
