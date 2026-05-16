import { Link } from "react-router-dom";
import { brand } from "../config/brand";

export default function BrandLogo({
  to = "/",
  inverted = false,
  compact = false,
  iconOnly = false,
  className = "",
}) {
  const textColor = inverted
    ? "text-white"
    : "text-gray-950 dark:text-white";
  const subTextColor = inverted
    ? "text-gray-300"
    : "text-gray-500 dark:text-gray-300";
  const markSurface = inverted
    ? "border-gold-300/40 bg-gray-900"
    : "border-gray-200 bg-white shadow-sm dark:border-gold-300/30 dark:bg-gray-900";

  return (
    <Link
      to={to}
      className={`group inline-flex min-w-0 items-center gap-3 rounded-lg outline-none transition focus-visible:ring-2 focus-visible:ring-gold-400/70 ${className}`}
      aria-label={`${brand.name} home`}
    >
      <span
        className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-lg border ${markSurface} ${
          compact ? "h-11 w-11" : "h-14 w-14"
        }`}
      >
        <span className="absolute inset-1 rounded-md border border-gold-400" />
        <span className="absolute -right-3 -top-3 h-9 w-9 rounded-full bg-gold-400/30 blur-sm" />
        <span className="absolute -bottom-4 -left-3 h-10 w-10 rounded-full bg-gray-950/10 blur-md dark:bg-white/10" />
        <span className="relative grid text-center leading-none">
          <span className={`${compact ? "text-[10px]" : "text-xs"} font-black tracking-wide text-gold-600 dark:text-gold-300`}>
            DB
          </span>
          <span className={`-mt-0.5 ${compact ? "text-[9px]" : "text-[11px]"} font-black tracking-wide text-gray-950 dark:text-white`}>
            BH
          </span>
        </span>
      </span>

      <span className={`${iconOnly ? "hidden" : "block"} min-w-0`}>
        {!iconOnly && (
          <>
            <span
              className={`block whitespace-nowrap font-black uppercase leading-none tracking-wide ${textColor} ${
                compact ? "text-[12px] sm:text-[15px]" : "text-lg sm:text-xl"
              }`}
            >
              {brand.wordmarkPrimary}
            </span>
            <span
              className={`mt-0.5 block whitespace-nowrap font-black uppercase leading-none tracking-wide ${
                inverted ? "text-gold-200" : "text-gold-700 dark:text-gold-300"
              } ${compact ? "text-[12px] sm:text-[15px]" : "text-lg sm:text-xl"}`}
            >
              {brand.wordmarkSecondary}
            </span>
            <span
              className={`mt-1 hidden whitespace-nowrap text-[9px] font-bold uppercase tracking-[0.16em] sm:block ${subTextColor}`}
            >
              {brand.tagline}
            </span>
          </>
        )}
      </span>
    </Link>
  );
}
