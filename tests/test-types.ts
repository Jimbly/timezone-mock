import * as timezone_mock from "..";
import type { TimeZone } from "..";
import * as assert from 'assert';

const utc: TimeZone = 'UTC';
const aus: TimeZone = 'Australia/Adelaide';

// @ts-expect-error
const no_tz: TimeZone = 'notatimezone';

const timeZones: readonly TimeZone[] = timezone_mock.timeZones;
assert.strictEqual(timeZones.length, 35);
