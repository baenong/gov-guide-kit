export interface CalendarEvent {
  date: string;
  endDate?: string;
  title: string;
}

export interface CalendarDay {
  date: string;
  dayOfMonth: number;
  inCurrentMonth: boolean;
  events: CalendarEvent[];
}

function eachDateInRange(start: string, end: string): string[] {
  const dates: string[] = [];
  let current = new Date(`${start}T00:00:00Z`);
  const last = new Date(`${end}T00:00:00Z`);
  while (current.getTime() <= last.getTime()) {
    dates.push(current.toISOString().slice(0, 10));
    current = new Date(current.getTime() + 24 * 60 * 60 * 1000);
  }
  return dates;
}

export function buildMonthGrid(year: number, month: number, events: CalendarEvent[]): CalendarDay[] {
  const firstOfMonth = new Date(Date.UTC(year, month - 1, 1));
  const startWeekday = firstOfMonth.getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  const eventsByDate = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    for (const dateStr of eachDateInRange(event.date, event.endDate ?? event.date)) {
      const list = eventsByDate.get(dateStr) ?? [];
      list.push(event);
      eventsByDate.set(dateStr, list);
    }
  }

  const days: CalendarDay[] = [];
  for (let i = 0; i < startWeekday; i++) {
    days.push({ date: '', dayOfMonth: 0, inCurrentMonth: false, events: [] });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    days.push({ date, dayOfMonth: day, inCurrentMonth: true, events: eventsByDate.get(date) ?? [] });
  }
  return days;
}
