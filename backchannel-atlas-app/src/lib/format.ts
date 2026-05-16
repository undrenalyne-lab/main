export const basePath = "/france-money-map";

export function appPath(path = "/") {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${basePath}${normalized}`;
}

export function currency(amount: number, code = "EUR") {
  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
    style: "currency",
    currency: code,
  }).format(amount || 0);
}

export function percent(value: number) {
  return `${Math.round(value)}%`;
}

export function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}
