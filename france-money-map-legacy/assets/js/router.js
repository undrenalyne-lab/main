export function readSearchParams(search = window.location.search) {
  return new URLSearchParams(search);
}

export function replaceUrlParams(values) {
  if (typeof window === "undefined") {
    return;
  }

  const url = new URL(window.location.href);

  Object.entries(values).forEach(([key, value]) => {
    if (
      value === undefined ||
      value === null ||
      value === "" ||
      (Array.isArray(value) && value.length === 0)
    ) {
      url.searchParams.delete(key);
      return;
    }

    if (Array.isArray(value)) {
      url.searchParams.set(key, value.join(","));
      return;
    }

    url.searchParams.set(key, String(value));
  });

  const search = url.searchParams.toString();
  const nextUrl = search ? `${url.pathname}?${search}` : url.pathname;
  window.history.replaceState({}, "", nextUrl);
}
