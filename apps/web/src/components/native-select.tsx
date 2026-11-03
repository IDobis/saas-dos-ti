"use client";

import * as React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Option = {
  value: string;
  label: string;
  disabled: boolean;
};

function textOf(node: React.ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (React.isValidElement<{ children?: React.ReactNode }>(node)) return textOf(node.props.children);
  return "";
}

function collectOptions(children: React.ReactNode, out: Option[] = []): Option[] {
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    if (child.type === React.Fragment) {
      collectOptions((child.props as { children?: React.ReactNode }).children, out);
      return;
    }
    if (child.type !== "option") return;
    const props = child.props as React.ComponentProps<"option">;
    const label = textOf(props.children).trim();
    const value = props.value == null ? label : String(props.value);
    out.push({ value, label: label || value, disabled: Boolean(props.disabled) });
  });
  return out;
}

function toExternal(value: unknown): string {
  if (value == null || Array.isArray(value)) return "";
  return String(value);
}

/** Select com a lista do tema. O `<select>` nativo abre o menu do sistema (faixa azul). */
export function NativeSelect({
  className,
  children,
  value,
  defaultValue,
  onChange,
  name,
  required,
  disabled,
  id,
  "aria-label": ariaLabel,
}: React.ComponentProps<"select">) {
  const options = collectOptions(children);
  const blank = options.find((option) => option.value === "");
  const blankIsPlaceholder = Boolean(blank?.disabled);
  const choices = options.filter((option) => !(option.value === "" && option.disabled));
  const controlled = value !== undefined;
  const [uncontrolled, setUncontrolled] = React.useState(() => toExternal(defaultValue));
  const selected = controlled ? toExternal(value) : uncontrolled;
  const rootRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const form = rootRef.current?.closest("form");
    if (!form || controlled) return;
    const onReset = () => setUncontrolled(toExternal(defaultValue));
    form.addEventListener("reset", onReset);
    return () => form.removeEventListener("reset", onReset);
  }, [controlled, defaultValue]);

  const items = choices.map((option) => ({
    value: option.value === "" ? null : option.value,
    label: option.label,
  }));

  function commit(next: string | null) {
    const external = next ?? "";
    if (!controlled) setUncontrolled(external);
    onChange?.({
      target: { value: external },
      currentTarget: { value: external },
    } as React.ChangeEvent<HTMLSelectElement>);
  }

  return (
    <div ref={rootRef} className={cn("w-full", className)}>
      <Select
        items={items}
        name={name}
        required={required}
        disabled={disabled}
        modal={false}
        value={selected === "" ? null : selected}
        onValueChange={commit}
      >
        <SelectTrigger
          id={id}
          aria-label={ariaLabel}
          className={cn(
            "w-full bg-card px-3 data-[size=default]:h-9 dark:bg-input/30",
            blankIsPlaceholder ? "data-placeholder:text-muted-foreground" : "data-placeholder:text-foreground",
          )}
        >
          <SelectValue placeholder={blankIsPlaceholder ? blank?.label : undefined} />
        </SelectTrigger>
        <SelectContent align="start" alignItemWithTrigger={false} className="p-1">
          {choices.map((option) => (
            <SelectItem
              key={option.value || option.label}
              value={option.value === "" ? null : option.value}
              disabled={option.disabled}
              className="data-highlighted:bg-accent data-highlighted:text-accent-foreground data-selected:bg-accent data-selected:text-accent-foreground"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
