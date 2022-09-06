timezone-mock
================

A JavaScript library to mock the local timezone.

This module is useful for testing that code works correctly when run in
other timezones, especially those which have Daylight Saving Time if the
timezone of your test system does not.

When `register` is called, it replaces the global Date constructor with
a mocked Date object which behaves as if it is in the specified timezone.

Note: Future timezone transitions are likely to change due to laws, etc.  Make
sure to always test using specific dates in the past. The timezone data used by
`timezone-mock 1.0.4+` should be up accurate for all times through the end of 2018.

Note: Node v8.0.0 changed how the string "YYYY-MM-DDTHH:MM:SS" is interpreted.
It was previously interpreted as a UTC date, but now is a local date. If your
code is using dates of this format, results will be inconsistent.  timezone-mock
treats them as a local date, so that it behaves consistently with new versions
of Node, but that means if you run the tests in here on old versions of node,
or use the mock on old versions of node, the tests may not be accurate (just
for parsing dates in the aforementioned format).


Usage Example
=============

```javascript
var assert = require('assert');
var timezone_mock = require('timezone-mock');

function buggyCode() {
  // This function is potentially a bug since it's interpreting a string in
  // the local timezone, which will behave differently depending on which
  // system it is ran on.
  return new Date('2015-01-01 12:00:00').getTime();
}
var result_local = buggyCode();
timezone_mock.register('US/Pacific');
var result_pacific = buggyCode();
timezone_mock.register('US/Eastern');
var result_eastern = buggyCode();
assert.equal(result_local, result_pacific); // Might fail
assert.equal(result_pacific, result_eastern); // Definitely fails

```

API
===
* `timezone_mock.register(timezone)` - Replace the global Date object with a mocked one for
the specified timezone.  Defaults to 'US/Pacific' if no timezone is specified.
* `timezone_mock.unregister()` - Return to normal Date object behavior
* `timezone_mock._Date` - access to the original Date object for testing. Available after `register` is called, and it's the Date
object of the provided global/window context.
* `timezone_mock.options({ fallbackFn })` - Option to provide a fallback function when `timezone-mock` fails to parse.

Supported Timezones
===================
Currently supported timezones are:
* US/Pacific
* US/Eastern
* Brazil/East
* UTC
* Europe/London
* Australia/Adelaide

I found that testing on these were enough to ensure code worked in
all timezones (important factor is to test on a timezone with Daylight Saving
Time if your local timezone does not).  Brazil/East has the unique characteristic
of having the DST transition happen right at midnight, so code that sets a Date
object to midnight on a particular day and then does operations on that Date
object is especially vulnerable in that timezone.  Europe/London is included as
a timezone that is a positive offset from UTC, and Australia/Adelaide as one that
has a large positive and non-integral offset (+9.5/+10.5).

Supported GMT Offsets
=====================
Note: the `Etc/GMT` timezones work the opposite of how one might expect, the `Etc/GMT+5` timezone is equivalent to US Eastern Standard Time (UTC-5).

Currently supported GMT offsets are:
* Etc/GMT+12
* Etc/GMT+11
* Etc/GMT+10
* Etc/GMT+9
* Etc/GMT+8
* Etc/GMT+7
* Etc/GMT+6
* Etc/GMT+5
* Etc/GMT+4
* Etc/GMT+3
* Etc/GMT+2
* Etc/GMT+1
* Etc/GMT+0
* Etc/GMT
* Etc/GMT-0
* Etc/GMT-1
* Etc/GMT-2
* Etc/GMT-3
* Etc/GMT-4
* Etc/GMT-5
* Etc/GMT-6
* Etc/GMT-7
* Etc/GMT-8
* Etc/GMT-9
* Etc/GMT-10
* Etc/GMT-11
* Etc/GMT-12
* Etc/GMT-13
* Etc/GMT-14

GMT offsets can be used to test if UTC times fall on particular local calendar days.
Note: `Etc/GMT+0`, `Etc/GMT`, and `Etc/GMT-0` all represent the same offset and are
equivalent to the `UTC` time zone.

Status
======

The behavior of `toLocaleString()` has changed in v1.3.0 to more closely match Node's
behavior, but only works on Node v14+.  Use v1.2.2 for the old behavior.  See note below.

Most Date member functions are supported except for some conversions to
locale-specific date strings.  These are mocked in a way that may only work
reliably on Node v14+.  Note that using locale-specific formatting is often
device- and browser-dependant, so any use of these in tests may indicate a
potential bug.

With non-DST timezones, it should behave identically to the native Javascript
Date object.  With DST timezones, it may sometimes behave slightly differently
when given an ambiguous date string (e.g. "2014-11-02 01:00:00" in "US/Pacific",
is treated as 1AM PDT instead of 1AM PST - same clock time, utc timestamp off by
an hour).
