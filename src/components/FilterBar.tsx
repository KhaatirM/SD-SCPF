import type { ReactNode } from "react";

export function FilterBar({
  action,
  children,
}: {
  action: string;
  children: ReactNode;
}) {
  return (
    <form className="filter-bar" action={action} method="get">
      {children}
    </form>
  );
}

export function SearchField({
  name = "q",
  defaultValue,
  placeholder,
}: {
  name?: string;
  defaultValue?: string;
  placeholder: string;
}) {
  return (
    <input
      className="filter-input"
      type="search"
      name={name}
      defaultValue={defaultValue}
      placeholder={placeholder}
    />
  );
}

export function SelectField({
  name,
  defaultValue,
  options,
}: {
  name: string;
  defaultValue?: string;
  options: { value: string; label: string }[];
}) {
  return (
    <select className="filter-select" name={name} defaultValue={defaultValue || ""}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function FilterSubmit() {
  return (
    <button className="filter-submit" type="submit">
      Apply
    </button>
  );
}
