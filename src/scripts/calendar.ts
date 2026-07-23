import { buildMonthGrid, type CalendarEvent } from '../lib/calendar-grid';

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

export function renderDayDetail(detailEl: HTMLElement, date: string, events: CalendarEvent[]): void {
  detailEl.innerHTML = '';

  const heading = document.createElement('p');
  heading.className = 'guide-calendar__detail-heading';
  heading.textContent = date;
  detailEl.appendChild(heading);

  if (events.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'guide-calendar__detail-empty';
    empty.textContent = '등록된 일정이 없습니다.';
    detailEl.appendChild(empty);
    return;
  }

  const list = document.createElement('ul');
  list.className = 'guide-calendar__detail-list';
  for (const event of events) {
    const item = document.createElement('li');
    item.textContent = event.title;
    list.appendChild(item);
  }
  detailEl.appendChild(list);
}

export function renderCalendarMonth(
  container: HTMLElement,
  year: number,
  month: number,
  events: CalendarEvent[],
): void {
  const days = buildMonthGrid(year, month, events);

  let header = container.querySelector<HTMLElement>('.guide-calendar__header');
  let label: HTMLElement;
  let prevButton: HTMLButtonElement;
  let nextButton: HTMLButtonElement;

  if (!header) {
    header = document.createElement('div');
    header.className = 'guide-calendar__header';

    prevButton = document.createElement('button');
    prevButton.type = 'button';
    prevButton.className = 'guide-calendar__prev';
    prevButton.textContent = '◀';
    prevButton.setAttribute('aria-label', '이전 달');

    label = document.createElement('span');
    label.className = 'guide-calendar__label';

    nextButton = document.createElement('button');
    nextButton.type = 'button';
    nextButton.className = 'guide-calendar__next';
    nextButton.textContent = '▶';
    nextButton.setAttribute('aria-label', '다음 달');

    header.append(prevButton, label, nextButton);
    container.appendChild(header);
  } else {
    label = header.querySelector<HTMLElement>('.guide-calendar__label')!;
    prevButton = header.querySelector<HTMLButtonElement>('.guide-calendar__prev')!;
    nextButton = header.querySelector<HTMLButtonElement>('.guide-calendar__next')!;
  }

  label.textContent = `${year}년 ${month}월`;

  const oldGrid = container.querySelector('.guide-calendar__grid');
  oldGrid?.remove();

  let detail = container.querySelector<HTMLElement>('.guide-calendar__detail');
  if (!detail) {
    detail = document.createElement('div');
    detail.className = 'guide-calendar__detail';
  } else {
    detail.remove();
    detail.innerHTML = '';
  }

  const grid = document.createElement('div');
  grid.className = 'guide-calendar__grid';

  for (const weekday of WEEKDAY_LABELS) {
    const cell = document.createElement('div');
    cell.className = 'guide-calendar__weekday';
    cell.textContent = weekday;
    grid.appendChild(cell);
  }

  for (const day of days) {
    const cell = document.createElement('div');
    cell.className = 'guide-calendar__day';
    if (day.inCurrentMonth) {
      cell.dataset.day = String(day.dayOfMonth);
      const dayNumber = document.createElement('span');
      dayNumber.className = 'guide-calendar__day-number';
      dayNumber.textContent = String(day.dayOfMonth);
      cell.appendChild(dayNumber);
      for (const event of day.events) {
        const badge = document.createElement('span');
        badge.className = 'guide-calendar__event';
        badge.textContent = event.title;
        cell.appendChild(badge);
      }
      cell.addEventListener('click', () => {
        grid.querySelectorAll('.guide-calendar__day').forEach((el) => {
          delete (el as HTMLElement).dataset.selected;
        });
        cell.dataset.selected = 'true';
        renderDayDetail(detail!, day.date, day.events);
      });
    }
    grid.appendChild(cell);
  }

  container.append(grid, detail);

  prevButton.onclick = () => {
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    renderCalendarMonth(container, prevYear, prevMonth, events);
  };

  nextButton.onclick = () => {
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    renderCalendarMonth(container, nextYear, nextMonth, events);
  };
}

export function initCalendars(root: Document | HTMLElement = document): void {
  const containers = root.querySelectorAll<HTMLElement>('.guide-calendar');
  const today = new Date();

  containers.forEach((container) => {
    const raw = container.dataset.events ?? '[]';
    let events: CalendarEvent[] = [];
    try {
      events = JSON.parse(raw);
    } catch {
      events = [];
    }
    renderCalendarMonth(container, today.getFullYear(), today.getMonth() + 1, events);
  });
}
