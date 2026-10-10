import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer active:scale-[0.99]",
  {
    variants: {
      variant: {
        primary:
          "bg-blue-600 text-white hover:bg-blue-700 shadow-sm border border-blue-600",
        secondary:
          "border border-slate-200 bg-white text-slate-900 hover:bg-slate-50 shadow-sm",
        outline:
          "border border-blue-600/30 bg-blue-50/50 text-blue-700 hover:bg-blue-100/50",
        ghost:
          "text-slate-700 hover:bg-slate-100 hover:text-slate-900",
        danger:
          "bg-red-600 text-white hover:bg-red-700 shadow-sm",
      },
      size: {
        sm: "h-9 px-3.5 text-xs rounded-md",
        md: "h-11 px-4 text-sm rounded-lg",
        lg: "h-12 px-6 text-base rounded-xl",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

type ButtonProps = ComponentProps<"button"> &
  VariantProps<typeof buttonVariants>;

export function Button({
  className,
  variant,
  size,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { buttonVariants };
