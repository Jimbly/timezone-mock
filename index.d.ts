interface Options {
  fallbackFn: (date: any) => Date;
}

interface DateHoldingGlobal {
  Date: typeof Date;
}

export type TimeZone = typeof timeZones[number];

// Be sure to keep this in sync with the time zone definitions in tzdata.js
export const timeZones: readonly [
  'UTC',
  'Europe/London',
  'US/Pacific',
  'US/Eastern',
  'Brazil/East',
  'Australia/Adelaide',
  'Etc/GMT+12',
  'Etc/GMT+11',
  'Etc/GMT+10',
  'Etc/GMT+9',
  'Etc/GMT+8',
  'Etc/GMT+7',
  'Etc/GMT+6',
  'Etc/GMT+5',
  'Etc/GMT+4',
  'Etc/GMT+3',
  'Etc/GMT+2',
  'Etc/GMT+1',
  'Etc/GMT+0',
  'Etc/GMT',
  'Etc/GMT-0',
  'Etc/GMT-1',
  'Etc/GMT-2',
  'Etc/GMT-3',
  'Etc/GMT-4',
  'Etc/GMT-5',
  'Etc/GMT-6',
  'Etc/GMT-7',
  'Etc/GMT-8',
  'Etc/GMT-9',
  'Etc/GMT-10',
  'Etc/GMT-11',
  'Etc/GMT-12',
  'Etc/GMT-13',
  'Etc/GMT-14',
];

export function options(options: Options): void;
export function register(zone: TimeZone, glob?: DateHoldingGlobal): void;
export function unregister(glob?: DateHoldingGlobal): void;
export const _Date: typeof Date;
