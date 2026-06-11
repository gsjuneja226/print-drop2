/**
 * Merges conditional CSS class names
 */
export function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

/**
 * Formats a number as Indian Rupee (INR) currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formats ISO date strings to reader-friendly representations
 */
export function formatDate(dateString: string | null): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Parses page range string (e.g. "1-3, 5, 8-10") against total pages in document
 */
export function parsePageRange(range: string | null, totalPages: number): number {
  if (!range || range.trim().toLowerCase() === 'all') {
    return totalPages;
  }
  
  const cleanRange = range.replace(/\s+/g, '');
  const parts = cleanRange.split(',');
  const selected = new Set<number>();

  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      
      if (!isNaN(start) && !isNaN(end) && start <= end) {
        // Clamp to physical page range limits
        const from = Math.max(1, start);
        const to = Math.min(totalPages, end);
        for (let i = from; i <= to; i++) {
          selected.add(i);
        }
      }
    } else {
      const val = parseInt(part, 10);
      if (!isNaN(val) && val >= 1 && val <= totalPages) {
        selected.add(val);
      }
    }
  }

  return selected.size > 0 ? selected.size : totalPages;
}
