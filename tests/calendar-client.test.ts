import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderCalendarMonth, initCalendars, eventSegmentInfo } from '../src/scripts/calendar';

function setupDom(eventsJson: string) {
  document.body.innerHTML = `
    <div class="guide-calendar" data-events='${eventsJson}'></div>
  `;
}

describe('renderCalendarMonth', () => {
  it('renders a grid with the event title visible', () => {
    const container = document.createElement('div');
    renderCalendarMonth(container, 2026, 8, [{ date: '2026-08-15', title: '임용등록 마감' }]);
    expect(container.textContent).toContain('임용등록 마감');
    expect(container.querySelectorAll('[data-day]').length).toBeGreaterThan(27);
  });

  it('gives every segment of a multi-day event non-empty badge content so all segments render at the same height', () => {
    const container = document.createElement('div');
    renderCalendarMonth(container, 2026, 8, [
      { date: '2026-08-17', endDate: '2026-08-19', title: '하계휴가' },
    ]);
    const continuationCell = container.querySelector<HTMLElement>('[data-day="18"]')!;
    const badge = continuationCell.querySelector('.guide-calendar__event')!;
    expect(badge.textContent).not.toBe('');
  });
});

describe('today highlighting', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('marks the cell matching the real current date', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 15, 12, 0, 0));
    const container = document.createElement('div');
    renderCalendarMonth(container, 2026, 8, []);
    const todayCell = container.querySelector('[data-day="15"]')!;
    expect(todayCell.getAttribute('data-today')).toBe('true');
    const otherCell = container.querySelector('[data-day="14"]')!;
    expect(otherCell.hasAttribute('data-today')).toBe(false);
  });

  it('does not mark any cell as today when viewing a different month', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 15, 12, 0, 0));
    const container = document.createElement('div');
    renderCalendarMonth(container, 2026, 9, []);
    expect(container.querySelector('[data-today]')).toBeNull();
  });
});

describe('initCalendars', () => {
  beforeEach(() => {
    setupDom(JSON.stringify([{ date: '2026-08-15', title: '임용등록 마감' }]));
    initCalendars(document);
  });

  it('renders the current month grid on init', () => {
    const container = document.querySelector('.guide-calendar')!;
    expect(container.querySelector('.guide-calendar__grid')).not.toBeNull();
  });

  it('navigates to the next month when the next button is clicked', () => {
    const container = document.querySelector('.guide-calendar')!;
    const label = container.querySelector('.guide-calendar__label')!;
    const before = label.textContent;
    const nextButton = container.querySelector<HTMLButtonElement>('.guide-calendar__next')!;
    nextButton.click();
    expect(label.textContent).not.toBe(before);
  });
});

describe('clicking a day cell', () => {
  it('shows that day\'s events in the detail panel below the grid', () => {
    const container = document.createElement('div');
    renderCalendarMonth(container, 2026, 8, [{ date: '2026-08-15', title: '임용등록 마감' }]);
    const cell = container.querySelector<HTMLElement>('[data-day="15"]')!;
    cell.click();
    const detail = container.querySelector('.guide-calendar__detail')!;
    expect(detail.textContent).toContain('2026-08-15');
    expect(detail.textContent).toContain('임용등록 마감');
  });

  it('shows an empty-state message for a day with no events', () => {
    const container = document.createElement('div');
    renderCalendarMonth(container, 2026, 8, [{ date: '2026-08-15', title: '임용등록 마감' }]);
    const cell = container.querySelector<HTMLElement>('[data-day="10"]')!;
    cell.click();
    const detail = container.querySelector('.guide-calendar__detail')!;
    expect(detail.textContent).toContain('등록된 일정이 없습니다');
  });

  it('marks the clicked cell as selected and clears the previous selection', () => {
    const container = document.createElement('div');
    renderCalendarMonth(container, 2026, 8, [{ date: '2026-08-15', title: '임용등록 마감' }]);
    const cell15 = container.querySelector<HTMLElement>('[data-day="15"]')!;
    const cell10 = container.querySelector<HTMLElement>('[data-day="10"]')!;
    cell15.click();
    expect(cell15.dataset.selected).toBe('true');
    cell10.click();
    expect(cell10.dataset.selected).toBe('true');
    expect(cell15.dataset.selected).toBeUndefined();
  });
});

describe('eventSegmentInfo', () => {
  it('treats a single-day event as its own fully-capped segment', () => {
    const event = { date: '2026-08-15', title: '임용등록 마감' };
    expect(eventSegmentInfo(event, '2026-08-15', 3)).toEqual({
      isRange: false,
      capStart: true,
      capEnd: true,
      showLabel: true,
    });
  });

  it('caps only the true start/end of a range that stays within one week row', () => {
    // 2026-08-17/18/19 are Mon/Tue/Wed — columns 1/2/3, no week wrap.
    const event = { date: '2026-08-17', endDate: '2026-08-19', title: '하계휴가' };
    expect(eventSegmentInfo(event, '2026-08-17', 1)).toEqual({
      isRange: true, capStart: true, capEnd: false, showLabel: true,
    });
    expect(eventSegmentInfo(event, '2026-08-18', 2)).toEqual({
      isRange: true, capStart: false, capEnd: false, showLabel: false,
    });
    expect(eventSegmentInfo(event, '2026-08-19', 3)).toEqual({
      isRange: true, capStart: false, capEnd: true, showLabel: false,
    });
  });

  it('adds a week-boundary cap even mid-range so the bar does not bleed into the next/prev row', () => {
    // 2026-08-14 (Fri, col 5) ~ 2026-08-17 (Mon, col 1), crossing a week row.
    const event = { date: '2026-08-14', endDate: '2026-08-17', title: '연휴' };
    // Saturday (col 6) is the last column of its row -> gets a capEnd even
    // though the event doesn't actually end there.
    expect(eventSegmentInfo(event, '2026-08-15', 6)).toEqual({
      isRange: true, capStart: false, capEnd: true, showLabel: false,
    });
    // Sunday (col 0) is the first column of the next row -> gets a capStart
    // (and, since it's the start of a visual segment, shows the label again).
    expect(eventSegmentInfo(event, '2026-08-16', 0)).toEqual({
      isRange: true, capStart: true, capEnd: false, showLabel: true,
    });
  });
});
