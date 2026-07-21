import { describe, it, expect } from 'vitest';
import { buildMonthGrid } from '../src/lib/calendar-grid';

describe('buildMonthGrid', () => {
  it('produces 31 in-month days for August 2026 with correct leading blanks', () => {
    const days = buildMonthGrid(2026, 8, []);
    const inMonth = days.filter((d) => d.inCurrentMonth);
    expect(inMonth).toHaveLength(31);
    // 2026-08-01 is a Saturday (weekday index 6)
    expect(days[0].inCurrentMonth).toBe(false);
    expect(days[6].date).toBe('2026-08-01');
  });

  it('attaches events to the matching day', () => {
    const days = buildMonthGrid(2026, 8, [{ date: '2026-08-15', title: '임용등록 마감' }]);
    const day15 = days.find((d) => d.date === '2026-08-15')!;
    expect(day15.events).toEqual([{ date: '2026-08-15', title: '임용등록 마감' }]);
  });

  it('leaves days without events with an empty array', () => {
    const days = buildMonthGrid(2026, 8, [{ date: '2026-08-15', title: '임용등록 마감' }]);
    const day10 = days.find((d) => d.date === '2026-08-10')!;
    expect(day10.events).toEqual([]);
  });
});
