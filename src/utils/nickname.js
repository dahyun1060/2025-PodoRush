export function isNicknameTaken(storageKey, name) {
  try {
    const n = (name || "").trim().toLowerCase();
    const list = JSON.parse(localStorage.getItem(storageKey) || "[]");
    return list.some((r) => {
      const v = (r.nickname ?? r.name ?? "").trim().toLowerCase();
      return v === n;
    });
  } catch {
    return false;
  }
}
