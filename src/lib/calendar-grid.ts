export interface CalendarEvent {
  date: string;
  title: string;
}

export interface CalendarDay {
  date: string;
  dayOfMonth: number;
  inCurrentMonth: boolean;
  events: CalendarEvent[];
}

export function buildMonthGrid(year: number, month: number, events: CalendarEvent[]): CalendarDay[] {
  const firstOfMonth = new Date(Date.UTC(year, month - 1, 1));
  const startWeekday = firstOfMonth.getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  const eventsByDate = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    const list = eventsByDate.get(event.date) ?? [];
    list.push(event);
    eventsByDate.set(event.date, list);
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
