import logo from "@/logo.jpg";

interface BrandMarkProps {
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
  sm: "h-11 w-11 rounded-lg",
  md: "h-14 w-14 rounded-xl",
  lg: "h-20 w-20 rounded-xl",
  xl: "h-28 w-28 rounded-2xl",
} as const;

export function BrandMark({ size = "md" }: BrandMarkProps) {
  return (
    <div
      className={[
        "overflow-hidden bg-white/95 p-1 shadow-sm ring-1 ring-black/5",
        sizeClasses[size],
      ].join(" ")}
    >
      <img
        src={logo}
        alt="Office of the Municipal Social Welfare and Development logo"
        className="h-full w-full rounded-[inherit] object-contain"
      />
    </div>
  );
}
