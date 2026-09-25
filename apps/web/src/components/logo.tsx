import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 128 128" className={className} aria-hidden="true">
      <rect width="128" height="128" rx="32" fill="var(--logo-mark)" />
      <path
        d="M72 10C88.5685 10 102 23.4315 102 40V66C102 70.7382 100.899 75.2188 98.9434 79.2031L112.497 95.3555C116.402 100.009 115.795 106.947 111.142 110.853C106.488 114.758 99.5496 114.151 95.6445 109.497L82.6758 94.042C79.3587 95.3055 75.7607 96 72 96H46C29.4315 96 16 82.5685 16 66V40C16 23.4315 29.4315 10 46 10H72ZM50 28C42.268 28 36 34.268 36 42V60C36 67.732 42.268 74 50 74H68C75.732 74 82 67.732 82 60V42C82 34.268 75.732 28 68 28H50Z"
        fill="white"
      />
      <rect
        x="93.7885"
        y="108.176"
        width="22"
        height="18"
        rx="9"
        transform="rotate(-40 93.7885 108.176)"
        fill="var(--logo-accent)"
      />
    </svg>
  );
}

export function Logo({
  className,
  markClassName = "size-8",
}: {
  className?: string;
  markClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className={cn("shrink-0", markClassName)} />
      <span className="font-bold tracking-tight text-(--logo-word)">
        OSQ<span className="font-semibold text-(--logo-word-accent)">-Resolve</span>
      </span>
    </span>
  );
}
