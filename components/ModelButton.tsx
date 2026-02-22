"use client";

import { CheckIcon } from "lucide-react";
import * as React from "react";

export type Option<T extends string> = {
  value: T;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  badge?: string;
};

type ModelButtonProps<T extends string> = {
  value: T;
  onChange: (value: T) => void;
  options: Option<T>[];
  /** Unique name for this radio group — REQUIRED to keep model and channel selections independent */
  name: string;
  ariaLabel?: string;
  className?: string;
};

export function ModelButton<T extends string>({
  value,
  onChange,
  options,
  name,
  className = "",
}: ModelButtonProps<T>) {
  return (
    <fieldset className={className}>
      <div className="flex flex-wrap gap-3">
        {options.map((opt) => {
          const selected = opt.value === value;
          const disabled = opt.disabled;

          return (
            <label
              key={opt.value}
              className={[
                "group relative inline-flex items-center gap-2.5",
                "rounded-lg border px-4 py-2.5",
                "transition-all duration-150",
                disabled
                  ? "cursor-not-allowed border-white/5 bg-zinc-950/40 text-zinc-500"
                  : [
                      "cursor-pointer",
                      "bg-zinc-950/60 text-zinc-200",
                      "border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]",
                      "hover:bg-zinc-950/80 hover:border-cyan-700 hover:text-cyan-400",
                      "focus-within:ring-2 focus-within:ring-cyan-400",
                    ].join(" "),
                // "Pressed" / always-selected state
                selected
                  ? "border-cyan-400 bg-cyan-950/40 text-cyan-300 shadow-[inset_0_2px_6px_rgba(34,211,238,0.15),0_0_0_1px_rgba(34,211,238,0.3)]"
                  : "",
              ].join(" ")}
            >
              <input
                type="radio"
                name={name}
                value={opt.value}
                checked={selected}
                onChange={() => !disabled && onChange(opt.value)}
                disabled={disabled}
                className="sr-only"
              />

              {/* Left icon */}
              {opt.icon ? (
                <span
                  className={[
                    "inline-flex h-5 w-5 items-center justify-center [&>svg]:h-full [&>svg]:w-full [&>svg]:shrink-0",
                    disabled ? "text-zinc-600" : selected ? "text-cyan-300" : "text-zinc-200/90",
                  ].join(" ")}
                >
                  {opt.icon}
                </span>
              ) : null}

              <span className="text-sm font-medium">{opt.label}</span>

              {/* Badge */}
              {opt.badge && (
                <span className="ml-2 rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
                  {opt.badge}
                </span>
              )}

              {/* Check icon (visible when selected) */}
              <span
                className={[
                  "ml-1 inline-flex h-5 w-5 items-center justify-center",
                  selected ? "opacity-100" : "opacity-0",
                  "transition-opacity",
                ].join(" ")}
                aria-hidden="true"
              >
                <CheckIcon className="h-4 w-4 text-cyan-400" />
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
