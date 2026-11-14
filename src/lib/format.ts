export function formatDate(value: string | null | undefined): string {
  if (!value) return "Unknown";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Unknown";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function tenureLabel(hireDate: string | null | undefined): string {
  if (!hireDate) return "Tenure unknown";
  const start = new Date(hireDate);
  if (Number.isNaN(start.getTime())) return "Tenure unknown";
  const now = new Date();
  const months =
    (now.getUTCFullYear() - start.getUTCFullYear()) * 12 +
    (now.getUTCMonth() - start.getUTCMonth());
  if (months < 1) return "Less than a month";
  if (months < 12) return `${months} mo`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem ? `${years}y ${rem}mo` : `${years}y`;
}

export function dischargeLabel(
  type: string | null | undefined,
  provisional: boolean,
): string {
  const base =
    type === "honorable"
      ? "Honorable"
      : type === "dishonorable"
        ? "Dishonorable"
        : "Unclassified";
  return provisional ? `${base} (provisional)` : base;
}
