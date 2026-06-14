export function formatDateTime(dateString: string) {
  const date = new Date(dateString);
  
  // Time: 12-hour AM/PM (e.g. 3:45 PM)
  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  // Date: DD MMM YYYY (e.g. 14 Jun 2026)
  const dateStr = date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  return { timeStr, dateStr };
}

export function getRelativeDateLabel(dateString: string) {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  ) {
    return 'Today';
  }

  if (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  ) {
    return 'Yesterday';
  }

  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

// Group an array of items with a timestamp property by the relative date label
export function groupByDate<T extends { timestamp: string }>(items: T[]): Record<string, T[]> {
  const grouped: Record<string, T[]> = {};

  items.forEach(item => {
    const label = getRelativeDateLabel(item.timestamp);
    if (!grouped[label]) {
      grouped[label] = [];
    }
    grouped[label].push(item);
  });

  return grouped;
}
