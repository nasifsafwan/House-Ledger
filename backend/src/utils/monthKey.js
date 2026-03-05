export function toMonthKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function monthKeyFromDateStr(yyyy_mm_dd) {
  const [y, m] = yyyy_mm_dd.split("-"); // YYYY-MM-DD
  return `${y}-${m}`;
}

export function nextMonthKey(monthKey) {
  const [yStr, mStr] = monthKey.split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  if (m === 12) return `${y + 1}-01`;
  return `${y}-${String(m + 1).padStart(2, "0")}`;
}