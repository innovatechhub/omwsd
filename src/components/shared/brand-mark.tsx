import logo from "@/logo.jpg";

interface BrandMarkProps {
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
  sm: "h-12 w-12 rounded-2xl",
  md: "h-14 w-14 rounded-3xl",
  lg: "h-20 w-20 rounded-[1.75rem]",
  xl: "h-28 w-28 rounded-[2rem]",
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
