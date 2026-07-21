import { describe, it, expect, beforeEach } from 'vitest';
import { renderCalendarMonth, initCalendars } from '../src/scripts/calendar';

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
