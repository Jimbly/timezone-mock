timezone-mock
================

A JavaScript library to mock the local timezone.

This module is useful for testing that code works correctly when run in
other timezones, especially those which have Daylight Saving Time if the
timezone of your test system does not.

When `register` is called, it replaces the global Date constructor with
a mocked Date object which behaves as if it is in the specified timezone.

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
timezone_mock.register('US/Pacific');
var result_eastern = buggyCode();
assert.equal(result_local, result_pacific); // Might fail
assert.equal(result_pacific, result_eastern); // Definitely fails

```

API
===
* `timezone_mock.register(timezone)` - Replace the global Date object with a mocked one for
the specified timezone.  Defaults to 'US/Pacific' if no timezone is specified.
* `timezone_mock.unregister()` - Return to normal Date object behavior
* `timezone_mock._Date` - access to the original Date object for testing

Supported Timezones
===================
Currently supported timezones are:
* US/Pacific
* US/Eastern
* UTC

I found that testing on these three were enough to ensure code worked in
all timezones (import factor is to test on a timezone with Daylight Saving
Time if your local timezone does not).

Status
======

Most Date member functions are supported except for some conversions to
locale-specific date strings.

With non-DST timezones, it should behave identically to the native Javascript
Date object.  With DST timezones, it may sometimes behave slightly differently
when given an ambiguous date string (e.g. "2014-11-02 01:00:00" in "US/Pacific",
is treated as 1AM PDT instead of 1AM PST - same clock time, utc timestamp off by
an hour).
