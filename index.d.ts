interface DateHoldingGlobal {
  Date: typeof Date;
}

export type TimeZone =
  'Brazil/East' |
  'Europe/London' |
  'US/Eastern' |
  'US/Pacific' |
  'UTC';

export function register(zone: TimeZone, glob?: DateHoldingGlobal): void;
export function unregister(glob?: DateHoldingGlobal): void;
export const _Date: typeof Date;
