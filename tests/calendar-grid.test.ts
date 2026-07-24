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

  it('attaches a ranged event to every day between date and endDate, inclusive', () => {
    const event = { date: '2026-08-17', endDate: '2026-08-19', title: '하계휴가' };
    const days = buildMonthGrid(2026, 8, [event]);
    expect(days.find((d) => d.date === '2026-08-16')!.events).toEqual([]);
    expect(days.find((d) => d.date === '2026-08-17')!.events).toEqual([event]);
    expect(days.find((d) => d.date === '2026-08-18')!.events).toEqual([event]);
    expect(days.find((d) => d.date === '2026-08-19')!.events).toEqual([event]);
    expect(days.find((d) => d.date === '2026-08-20')!.events).toEqual([]);
  });

  it('attaches a ranged event spanning into the next month only to in-month days', () => {
    const event = { date: '2026-07-30', endDate: '2026-08-02', title: '연휴' };
    const augustDays = buildMonthGrid(2026, 8, [event]);
    expect(augustDays.find((d) => d.date === '2026-08-01')!.events).toEqual([event]);
    expect(augustDays.find((d) => d.date === '2026-08-02')!.events).toEqual([event]);
    expect(augustDays.find((d) => d.date === '2026-08-03')!.events).toEqual([]);

    const julyDays = buildMonthGrid(2026, 7, [event]);
    expect(julyDays.find((d) => d.date === '2026-07-30')!.events).toEqual([event]);
    expect(julyDays.find((d) => d.date === '2026-07-31')!.events).toEqual([event]);
  });
});
