interface Options {
  fallbackFn: (date: any) => Date;
}

interface DateHoldingGlobal {
  Date: typeof Date;
}

export type TimeZone =
  'Australia/Adelaide' |
  'Brazil/East' |
  'Europe/London' |
  'US/Eastern' |
  'US/Pacific' |
  'UTC' |
  'Etc/GMT+12' |
  'Etc/GMT+11' |
  'Etc/GMT+10' |
  'Etc/GMT+9' |
  'Etc/GMT+8' |
  'Etc/GMT+7' |
  'Etc/GMT+6' |
  'Etc/GMT+5' |
  'Etc/GMT+4' |
  'Etc/GMT+3' |
  'Etc/GMT+2' |
  'Etc/GMT+1' |
  'Etc/GMT+0' |
  'Etc/GMT' |
  'Etc/GMT-0' |
  'Etc/GMT-1' |
  'Etc/GMT-2' |
  'Etc/GMT-3' |
  'Etc/GMT-4' |
  'Etc/GMT-5' |
  'Etc/GMT-6' |
  'Etc/GMT-7' |
  'Etc/GMT-8' |
  'Etc/GMT-9' |
  'Etc/GMT-10' |
  'Etc/GMT-11' |
  'Etc/GMT-12' |
  'Etc/GMT-13' |
  'Etc/GMT-14';

export interface TzDef {
  names: (number | string)[],

  /**
   * List of UTC offset changes
   *
   * Always has even length. Each pair of numbers refers first to a unix
   * time at which the time zone's UTC offset changes (for example, to
   * account for Daylight Saving Time).
   *
   * Transitions are defined for all of 32-bit Unix time (1970-01-01
   * through 2038-01-19T03:14:07 UTC); outside of that range, offsets
   * will not be accurate.
   * */
  transitions: number[],
}

export const tzdata: Record<TimeZone, TzDef>;
export function options(options: Options): void;
export function register(zone: TimeZone, glob?: DateHoldingGlobal): void;
export function unregister(glob?: DateHoldingGlobal): void;
export const _Date: typeof Date;
