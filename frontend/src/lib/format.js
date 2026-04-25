// Indian currency formatting: Lakh / Crore
export function inr(n, opts = {}) {
  const { compact = true, sign = false } = opts;
  if (n === null || n === undefined || isNaN(n)) return "₹0";
  const abs = Math.abs(n);
  let formatted;
  if (compact) {
    if (abs >= 1e7) formatted = `₹${(n / 1e7).toFixed(2)}Cr`;
    else if (abs >= 1e5) formatted = `₹${(n / 1e5).toFixed(2)}L`;
    else if (abs >= 1e3) formatted = `₹${(n / 1e3).toFixed(1)}K`;
    else formatted = `₹${Math.round(n)}`;
  } else {
    formatted = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
  }
  if (sign && n > 0) return `+${formatted}`;
  return formatted;
}

export function pct(n) {
  if (n === null || n === undefined || isNaN(n)) return "0%";
  return `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;
}

export function shortDate(d) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}
