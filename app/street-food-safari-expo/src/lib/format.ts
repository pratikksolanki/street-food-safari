// review count formatting
export function formatReviewCount(n: number): string {
  if (n < 10) return String(n);
  const magnitude = Math.pow(10, Math.floor(Math.log10(n)));
  return `${Math.floor(n / magnitude) * magnitude}+`;
}
