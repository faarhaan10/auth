import { cn } from "@/lib/utils";
import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xs";
  variant?: "primary" | "secondary" | "outline";
}

export default function Button({
  children,
  className,
  type = "button",
  size="md",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "bg-rose-600 text-white rounded-md hover:bg-rose-700 transition pointer-events-auto focus:outline-none disabled:opacity-50 disabled:pointer-events-none cursor-pointer",
        size === "sm" && "text-sm px-2 py-1",
        size === "md" && "text-base px-4 py-2",
        size === "lg" && "text-lg px-6 py-3 font-bold",
        size === "xs" && "text-xs px-1 py-0.5",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
