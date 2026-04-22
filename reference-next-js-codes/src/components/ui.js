import { cloneElement, isValidElement } from "react";
import { cn } from "@/lib/utils";

export function Button({
  children,
  className,
  variant = "default",
  size = "md",
  type = "button",
  asChild = false,
  ...props
}) {
  const variants = {
    default: "bg-black-forest-700 text-white hover:bg-black-forest-800 shadow-soft",
    secondary: "bg-dark-emerald-50 text-black-forest-900 hover:bg-dark-emerald-100 dark:bg-black-forest-950/60 dark:text-dark-emerald-100 dark:hover:bg-black-forest-950",
    outline: "border border-dark-emerald-200 bg-transparent text-black-forest-900 hover:bg-dark-emerald-50 dark:border-black-forest-900 dark:text-dark-emerald-100 dark:hover:bg-black-forest-950",
    ghost: "bg-transparent text-slate-700 hover:bg-dark-emerald-50 dark:text-slate-200 dark:hover:bg-black-forest-950/60",
    danger: "bg-rose-600 text-white hover:bg-rose-700",
  };

  const sizes = {
    sm: "h-9 px-3 text-sm",
    md: "h-10 px-4 text-sm",
    lg: "h-11 px-4.5 text-base",
  };

  const classes = cn(
    "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all focus:outline-none focus:ring-2 focus:ring-dark-emerald-400 disabled:cursor-not-allowed disabled:opacity-60",
    variants[variant],
    sizes[size],
    className
  );

  if (asChild && isValidElement(children)) {
    return cloneElement(children, {
      ...props,
      className: cn(children.props.className, classes),
    });
  }

  return (
    <button
      type={type}
      className={classes}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-xl border border-dark-emerald-100 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-black-forest-500 focus:ring-2 focus:ring-dark-emerald-100 dark:border-black-forest-900/60 dark:bg-slate-900 dark:text-slate-50 dark:focus:ring-black-forest-950",
        className
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }) {
  return (
    <textarea
      className={cn(
        "min-h-24 w-full rounded-xl border border-dark-emerald-100 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-black-forest-500 focus:ring-2 focus:ring-dark-emerald-100 dark:border-black-forest-900/60 dark:bg-slate-900 dark:text-slate-50 dark:focus:ring-black-forest-950",
        className
      )}
      {...props}
    />
  );
}

export function Select({ className, children, value, ...props }) {
  const selectValueProps = value === null ? { value: "" } : value === undefined ? {} : { value };

  return (
    <select
      className={cn(
        "h-11 w-full rounded-xl border border-dark-emerald-100 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-black-forest-500 focus:ring-2 focus:ring-dark-emerald-100 dark:border-black-forest-900/60 dark:bg-slate-900 dark:text-slate-50 dark:focus:ring-black-forest-950",
        className
      )}
      {...selectValueProps}
      {...props}
    >
      {children}
    </select>
  );
}

export function Card({ className, ...props }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-dark-emerald-100 bg-white/90 p-3 shadow-soft backdrop-blur dark:border-black-forest-900/40 dark:bg-slate-900/88",
        className
      )}
      {...props}
    />
  );
}

export function SectionTitle({ title, subtitle, action }) {
  return (
    <div className="mb-3 flex items-start justify-between gap-3">
      <div>
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50 sm:text-lg">{title}</h2>
        {subtitle ? (
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">{subtitle}</p>
        ) : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}

export function StatCard({ label, value, hint, accent = "black-forest" }) {
  const accents = {
    "black-forest": "from-black-forest-500/15 to-black-forest-500/0 text-black-forest-700 dark:text-dark-emerald-300",
    "dark-emerald": "from-dark-emerald-500/15 to-dark-emerald-500/0 text-dark-emerald-700 dark:text-dark-emerald-300",
    "turf-green": "from-turf-green-500/15 to-turf-green-500/0 text-turf-green-700 dark:text-turf-green-300",
    "forest-green": "from-forest-green-500/15 to-forest-green-500/0 text-forest-green-700 dark:text-forest-green-300",
    "medium-jungle": "from-medium-jungle-500/15 to-medium-jungle-500/0 text-medium-jungle-700 dark:text-medium-jungle-300",
    "jade-green": "from-jade-green-500/15 to-jade-green-500/0 text-jade-green-700 dark:text-jade-green-300",
    malachite: "from-malachite-500/15 to-malachite-500/0 text-malachite-700 dark:text-malachite-300",
    "light-green": "from-light-green-500/15 to-light-green-500/0 text-light-green-700 dark:text-light-green-300",
    celadon: "from-celadon-500/15 to-celadon-500/0 text-celadon-700 dark:text-celadon-300",
    rose: "from-rose-500/15 to-rose-500/0 text-rose-700 dark:text-rose-300",
  };

  return (
    <Card className={cn("bg-gradient-to-br", accents[accent])}>
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 sm:text-sm">{label}</p>
      <p className="mt-1.5 text-xl font-semibold text-slate-900 dark:text-slate-50 sm:text-2xl">{value}</p>
      {hint ? <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400 sm:text-xs">{hint}</p> : null}
    </Card>
  );
}

export function Badge({ children, variant = "default", className }) {
  const variants = {
    default: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
    success: "bg-dark-emerald-100 text-black-forest-700 dark:bg-black-forest-950 dark:text-dark-emerald-300",
    warning: "bg-turf-green-100 text-black-forest-700 dark:bg-black-forest-950 dark:text-turf-green-300",
    danger: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  };

  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium", variants[variant], className)}>
      {children}
    </span>
  );
}

export function EmptyState({ title, description, action }) {
  return (
    <Card className="py-10 text-center">
      <p className="text-base font-semibold text-slate-900 dark:text-slate-50">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </Card>
  );
}

export function TableShell({ children, className }) {
  return (
    <div className={cn("overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900", className)}>
      <div className="overflow-x-auto overscroll-x-contain">{children}</div>
    </div>
  );
}
