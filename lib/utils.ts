/**
 * Format currency in Belizean Dollars (BZ$)
 */
export function formatCurrency(amount: number): string {
  return `BZ$${amount.toLocaleString()}`;
}
