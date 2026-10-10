import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  markClassName?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
};

export function Logo({ className, markClassName, showText = true, size = "md" }: LogoProps) {
  const dimensions = {
    sm: { icon: "h-7 w-7", text: "text-base" },
    md: { icon: "h-9 w-9", text: "text-lg" },
    lg: { icon: "h-12 w-12", text: "text-2xl" },
  }[size];

  return (
    <span className={cn("inline-flex items-center gap-2.5 group cursor-pointer select-none", className)}>
      {/* Official ClassBridge Logo Mark */}
      <span
        className={cn(
          "relative flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105",
          dimensions.icon,
          markClassName,
        )}
        aria-hidden="true"
      >
        <svg viewBox="0 0 500 200" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="capGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0066FF" />
              <stop offset="50%" stopColor="#0052CC" />
              <stop offset="100%" stopColor="#002B66" />
            </linearGradient>
          </defs>
          {/* Graduation Cap Top Diamond */}
          <polygon points="250,15 350,60 250,95 150,60" fill="url(#capGradient)" />
          {/* Cap Base */}
          <path d="M 190 73 L 190 92 Q 250 115 310 92 L 310 73 Q 250 95 190 73 Z" fill="#003399" />
          {/* Tassel */}
          <path d="M 338 58 L 343 95 L 348 95 L 345 110 L 339 110 L 336 95 L 338 58 Z" fill="#0066FF" />
          <circle cx="342" cy="110" r="5" fill="#0052CC" />
          {/* Arch Bridge Pillars */}
          <rect x="160" y="88" width="18" height="60" rx="3" fill="#0052CC" />
          <rect x="322" y="88" width="18" height="60" rx="3" fill="#0052CC" />
          {/* Arch */}
          <path d="M 130 148 C 165 92 335 92 370 148 C 335 108 165 108 130 148 Z" fill="url(#capGradient)" />
          {/* Open Book - Green Wings */}
          <path d="M 100 172 C 155 150 235 162 250 188 C 235 172 155 162 100 172 Z" fill="#28A745" />
          <path d="M 400 172 C 345 150 265 162 250 188 C 265 172 345 162 400 172 Z" fill="#28A745" />
          {/* Open Book - Blue Base Wings */}
          <path d="M 110 185 C 165 167 235 178 250 198 C 235 185 165 178 110 185 Z" fill="#0066FF" />
          <path d="M 390 185 C 335 167 265 178 250 198 C 265 185 335 178 390 185 Z" fill="#0066FF" />
        </svg>
      </span>

      {/* Official ClassBridge Typography */}
      {showText && (
        <span className={cn("font-black tracking-tight uppercase font-sans", dimensions.text)}>
          <span className="text-[#002B66]">CLASS</span>
          <span className="text-[#0066FF]">BRIDGE</span>
        </span>
      )}
    </span>
  );
}
