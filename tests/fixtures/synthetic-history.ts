/** Deterministic synthetic history for pipeline tests (T-002). */

import { apexOf } from '@/core/domain';
import { shouldDropURL } from '@/core/filters';
import type { Visit } from '@/core/types';

export interface RawVisit {
  url: string;
  title: string;
  visitedAt: number;
}

function ts(y: number, m: number, d: number, h: number): number {
  return new Date(y, m - 1, d, h, 0, 0, 0).getTime();
}

function googleVisits(): RawVisit[] {
  const days: [number, number, number][] = [
    [2026, 4, 30],
    [2026, 5, 1],
    [2026, 5, 5],
    [2026, 5, 10],
    [2026, 5, 15],
    [2026, 5, 20],
  ];
  const urls = [
    'https://mail.google.com/mail/u/0/',
    'https://docs.google.com/document/d/abc',
    'https://www.google.com/',
  ];
  const rows: RawVisit[] = [];
  for (const [y, m, d] of days) {
    for (let i = 0; i < 5; i += 1) {
      rows.push({
        url: urls[i % urls.length]!,
        title: i % 2 === 0 ? 'Gmail' : 'Google Docs',
        visitedAt: ts(y, m, d, 9 + i),
      });
    }
  }
  return rows;
}

function githubVisits(): RawVisit[] {
  const days: [number, number, number][] = [
    [2026, 5, 13],
    [2026, 5, 18],
    [2026, 5, 22],
  ];
  const rows: RawVisit[] = [];
  const perDay = [6, 5, 5];
  for (let dayIdx = 0; dayIdx < days.length; dayIdx += 1) {
    const [y, m, d] = days[dayIdx]!;
    for (let i = 0; i < perDay[dayIdx]!; i += 1) {
      rows.push({
        url: `https://github.com/abhi-j0407/historia/pull/${dayIdx}-${i}`,
        title: 'historia PR',
        visitedAt: ts(y, m, d, 10 + i),
      });
    }
  }
  return rows;
}

function youtubeVisits(): RawVisit[] {
  const slots: [number, number, number, number][] = [
    [2026, 5, 3, 11],
    [2026, 5, 7, 12],
    [2026, 5, 12, 13],
    [2026, 5, 19, 14],
  ];
  const rows: RawVisit[] = [];
  slots.slice(0, 3).forEach(([y, m, d, h], idx) => {
    for (let offset = 0; offset < 2; offset += 1) {
      rows.push({
        url: `https://www.youtube.com/watch?v=vid${idx}${offset}`,
        title: 'Watch later',
        visitedAt: ts(y, m, d, h + offset),
      });
    }
  });
  const [y, m, d, h] = slots[3]!;
  rows.push({
    url: 'https://www.youtube.com/watch?v=vid-last',
    title: 'Watch later',
    visitedAt: ts(y, m, d, h),
  });
  return rows;
}

function stackOverflowVisits(): RawVisit[] {
  return [
    {
      url: 'https://stackoverflow.com/questions/1',
      title: 'How to aggregate',
      visitedAt: ts(2026, 5, 8, 15),
    },
    {
      url: 'https://stackoverflow.com/questions/2',
      title: 'Quantile bucketing',
      visitedAt: ts(2026, 5, 8, 16),
    },
    {
      url: 'https://meta.stackoverflow.com/questions/3',
      title: 'Meta',
      visitedAt: ts(2026, 5, 14, 15),
    },
    {
      url: 'https://stackoverflow.com/a/4',
      title: '',
      visitedAt: ts(2026, 5, 14, 16),
    },
  ];
}

function hnVisits(): RawVisit[] {
  return [
    {
      url: 'https://news.ycombinator.com/item?id=1',
      title: '',
      visitedAt: ts(2026, 5, 2, 18),
    },
    {
      url: 'https://news.ycombinator.com/',
      title: '',
      visitedAt: ts(2026, 5, 21, 19),
    },
  ];
}

function filteredNoise(): RawVisit[] {
  const rows: RawVisit[] = [];
  for (let i = 0; i < 50; i += 1) {
    rows.push({
      url: 'chrome://newtab/',
      title: 'New Tab',
      visitedAt: ts(2026, 5, 1, i % 24),
    });
  }
  for (let i = 0; i < 30; i += 1) {
    rows.push({
      url: 'https://www.google.com/search?q=help',
      title: 'Google Search',
      visitedAt: ts(2026, 5, 11, i % 24),
    });
  }
  for (let i = 0; i < 20; i += 1) {
    rows.push({
      url: 'http://localhost:3000/',
      title: 'Dev server',
      visitedAt: ts(2026, 5, 16, i % 24),
    });
  }
  return rows;
}

export const SYNTHETIC_RAW: readonly RawVisit[] = [
  ...googleVisits(),
  ...githubVisits(),
  ...youtubeVisits(),
  ...stackOverflowVisits(),
  ...hnVisits(),
  ...filteredNoise(),
] as const;

/** Applies B-001..B-004 filtering and apex normalization to raw fixture rows. */
export function syntheticVisits(): Visit[] {
  const visits: Visit[] = [];
  for (const raw of SYNTHETIC_RAW) {
    if (shouldDropURL(raw.url)) {
      continue;
    }
    const apexDomain = apexOf(raw.url);
    if (apexDomain === null) {
      continue;
    }
    visits.push({
      url: raw.url,
      apexDomain,
      title: raw.title,
      visitedAt: raw.visitedAt,
    });
  }
  return visits;
}
