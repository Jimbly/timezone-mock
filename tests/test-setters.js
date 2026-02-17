var assert = require('assert');
var timezone_mock = require('../');

if (!new timezone_mock._Date().toString().match(/\(PDT\)|\(PST\)|\(Pacific Daylight Time\)|\(Pacific Standard Time\)/)) {
  // Because we only have timezone info for a couple timezones, we can only test
  //   this if the timezone we're mocking is the same as the system timezone.
  // In theory this could be extended to be able to test any timezone for which
  //   we have timezone data.
  assert.ok(false, 'These tests only work if the local system timezone is Pacific');
}

timezone_mock.register('US/Pacific');

var orig = new timezone_mock._Date(0);
var mock = new Date(0);

// Assumes real and mock time zones fall on the same day, and assumes
// the setter does not change the relative offset between the system and
// mock time zone (i.e. if one zone makes a DST transition, the other
// zone also does)
function doit(fn, val, fails, mockOffset_h) {
  const args = typeof val === 'object' ? val : [val]
  if (mockOffset_h === undefined) {
    mockOffset_h = 0;
  }
  const testInfo = {
    orig: orig.toString(),
    mock: mock.toString(),
    fn,
    val,
  }
  var ret_orig = orig[fn](...args);
  var ret_mock = mock[fn](...args);
  const expDifference = fn === 'setHours' ? mockOffset_h * 3600000 : 0
  testInfo['ret_orig'] = ret_orig;
  testInfo['ret_mock'] = ret_mock;
  testInfo['ret_orig_date'] = new timezone_mock._Date(ret_orig).toString();
  testInfo['ret_mock_date'] = new Date(ret_mock).toString();
  testInfo['mock_minutes_ahead'] = (ret_mock - ret_orig) / 60000;
  testInfo['exp_mock_minutes_ahead'] = expDifference / 60000;
  if (!fails) {
    try {
      assert.equal(ret_orig, ret_mock + expDifference);
      assert.equal(
        orig.getTimezoneOffset(),
        mock.getTimezoneOffset() + (mockOffset_h * 60)
      );
      assert.equal(orig.getTime(), mock.getTime() + expDifference);
      assert.equal(orig.getFullYear(), mock.getFullYear())
      assert.equal(orig.getMonth(), mock.getMonth())
      assert.equal(orig.getDate(), mock.getDate())
      assert.equal(orig.getHours(), fn === 'setHours'
        ? mock.getHours()
        : (mock.getHours() - mockOffset_h) % 24
      );
      assert.equal(orig.getMinutes(), mock.getMinutes())
      assert.equal(orig.getSeconds(), mock.getSeconds())
    } catch (e) {
      console.log(JSON.stringify(testInfo, null, 2))
      throw e
    }
  }
  // orig and mock may have correctly been set to different times.
  // Re-synchronize to prevent them from drifting across tests.
  orig.setTime(mock.getTime());
}

doit('setMinutes', 30);
doit('setFullYear', 2015);
doit('setHours', 0);
doit('setMonth', 2);
doit('setDate', 1);
doit('setDate', 8);
doit('setHours', 2); // Spring Forward 2015
doit('setHours', 3);
doit('setHours', 2);
doit('setHours', 1);

doit('setMonth', 9);
doit('setDate', 1);
doit('setHours', 1);
doit('setMonth', 10); // Fall Back 2015
doit('setHours', 0);
doit('setHours', 1);
doit('setHours', 2);
doit('setHours', 1);

doit('setFullYear', [2023, 2, 13]);
doit('setFullYear', [2023, 2]);
doit('setMonth', [1, 2]);
doit('setHours', [23, 59, 23, 987]);
doit('setHours', [2, 23, 10]);
doit('setHours', [0, 18]);
doit('setMinutes', [43, 54, 123]);
doit('setMinutes', [12, 15]);
doit('setSeconds', [23, 768]);

// "Quick and dirty" 32-bit LCG with parameters attributed to Knuth.
//
// William H. Press, Saul A. Teukolsky, William T. Vetterling, and
// Brian P. Flannery. Numerical Recipes in C. 2nd ed. (Cambridge:
// Cambridge University Press, 2002), 284,
// https://s3.amazonaws.com/nrbook.com/book_C210.html.
let seed = 3425149915;
if (seed !== 3425149915) {
  console.log('test-setters seed = ' + seed)
}
const m = Math.pow(2, 32);
function randInt(max, rerolls) {
  let val;
  do {
    seed = (1664525 * seed + 1013904223) % m;
    val = Math.floor(seed / m * max);
  } while (rerolls !== undefined && rerolls.includes(val));
  return val;
}

function runRandom(mockOffset_h) {
  if (mockOffset_h === undefined) {
    mockOffset_h = 0;
  }

  for (var ii = 0; ii < 100000; ++ii) {

    // The tests assume the Mock/System offset is constant, but that's
    // not always true in March or November (it is true of all other
    // months for US time zones since 2007)
    const uncoveredMonths = mockOffset_h === 0 ? [] : [2, 10]

    switch (randInt(3)) { // eslint-disable-line default-case
      case 0:
        doit('setMonth', randInt(12, uncoveredMonths), false, mockOffset_h);
        break;
      case 1:
        doit('setDate', randInt(28) + 1, false, mockOffset_h);
        break;
      case 2:
        // It's hard to check setDate() when the system and mock local
        // times fall on different days (instead, hardcoded examples are
        // tested below).
        const bufferHours = Math.abs(mockOffset_h);
        const hour = randInt(24 - (2*bufferHours)) + bufferHours;
        doit('setHours', hour, false, mockOffset_h);
        break;
    }
  }
}

// Offset table is not perfectly accurate prior to the epoch
doit('setFullYear', [1971]);
runRandom();
timezone_mock.unregister();

timezone_mock.register('US/Eastern');
// 2007 was the first year with the current US Daylight Saving Time
// configuration, hence the first year for which we can safely assume a
// particular relative offset between the System and Mock time zones.
// (Energy Policy Act of 2005)
orig = new timezone_mock._Date('2007-06-01T09:00:00-07:00');
mock = new Date('2007-06-01T12:00:00-04:00');
runRandom(3);
timezone_mock.unregister();

timezone_mock.register('America/Anchorage');
orig = new timezone_mock._Date('2007-06-01T11:00:00-08:00');
mock = new Date('2007-06-01T12:00:00-07:00');
runRandom(-1);
timezone_mock.unregister();

// https://github.com/Jimbly/timezone-mock/issues/78
function testIssue78() {
  timezone_mock.register("UTC")
  var timeStr = '2026-02-04T06:52:09.050Z'
  var t = 1770187929050
  var date = new Date(timeStr)
  assert.equal(date.toISOString(), timeStr)
  assert.equal(date.setFullYear(2026), t)
  assert.equal(date.toISOString(), timeStr)
  assert.equal(date.setFullYear(2026), t)
  assert.equal(date.toISOString(), timeStr)
  assert.equal(date.setFullYear(2026), t)
  assert.equal(date.toISOString(), timeStr)
  timezone_mock.unregister()
}
testIssue78()

// Hard-coded tests of tricky dates
// Dimensions to test:
// Mock TZ is ahead/behind System TZ (2 cases)
// Positive/negative offset change between the initial and final Date values
// - The new time value falls on the other side of the offset transition in both Mock and System TZ, or just oneb
// Initial local time does/doesn't split the System vs. Mock time zones across an interval boundary
// Ending Date value is before/after the initial Date value

// Format: mock tz, local time at start, argument to setDate(), expected absolute time at end
const cases = [
  ['US/Eastern', '2025-01-11T12:00:00', 'setDate', 12, '2025-01-12T12:00:00-05:00'], // set forward by one day, nothing funny
  ['US/Eastern', '2025-01-11T12:00:00', 'setDate', 10, '2025-01-10T12:00:00-05:00'], // set backward by one day
  ['US/Eastern', '2025-01-11T01:00:00', 'setDate', 12, '2025-01-12T01:00:00-05:00'], // mock/real split across a day boundary
  ['US/Eastern', '2025-01-11T01:00:00', 'setDate', 10, '2025-01-10T01:00:00-05:00'], // same, but set the day backward
  ['US/Eastern', '2025-03-07T12:00:00', 'setDate', 11, '2025-03-11T12:00:00-04:00'], // Clock changes forward
  ['US/Eastern', '2025-03-11T12:00:00', 'setDate',  7, '2025-03-07T12:00:00-05:00'], // Clock un-changes forward
  ['US/Eastern', '2025-11-01T12:00:00', 'setDate',  3, '2025-11-03T12:00:00-05:00'], // Clock changes backward
  ['US/Eastern', '2025-11-03T12:00:00', 'setDate',  1, '2025-11-01T12:00:00-04:00'], // Clock un-changes backward

  // One offset changes, but the other offset doesn't
  ['US/Eastern', '2025-03-08T03:30:00', 'setDate', 9, '2025-03-09T03:30:00-04:00'], // ET changes forward, PT doesn't
  ['US/Eastern', '2025-03-10T03:30:00', 'setDate', 9, '2025-03-09T03:30:00-04:00'], // PT un-changes forward, ET doesn't
  ['US/Eastern', '2025-11-03T02:30:00', 'setDate', 2, '2025-11-02T02:30:00-05:00'], // PT un-changes backward, ET doesn't
  // Also, this starting time splits real and mock across a day boundary (02:30 EDT / 23:30 PDT)
  ['US/Eastern', '2025-11-01T02:30:00', 'setDate', 2, '2025-11-02T02:30:00-05:00'], // ET changes backward, PT doesn't

  ['America/Anchorage', '2025-01-11T12:00:00', 'setDate', 12, '2025-01-12T12:00:00-09:00'], // set forward by one day, nothing funny
  ['America/Anchorage', '2025-01-11T12:00:00', 'setDate', 10, '2025-01-10T12:00:00-09:00'], // set backward by one day
  ['America/Anchorage', '2025-01-11T23:30:00', 'setDate', 11, '2025-01-11T23:30:00-09:00'], // mock/real split across a day boundary
  ['America/Anchorage', '2025-01-11T23:30:00', 'setDate', 12, '2025-01-12T23:30:00-09:00'], // same, but set the day forward
  ['America/Anchorage', '2025-03-07T12:00:00', 'setDate', 11, '2025-03-11T12:00:00-08:00'], // Clock changes forward
  ['America/Anchorage', '2025-03-11T12:00:00', 'setDate',  7, '2025-03-07T12:00:00-09:00'], // Clock un-changes forward
  ['America/Anchorage', '2025-11-01T12:00:00', 'setDate',  3, '2025-11-03T12:00:00-09:00'], // Clock changes backward
  ['America/Anchorage', '2025-11-03T12:00:00', 'setDate',  1, '2025-11-01T12:00:00-08:00'], // Clock un-changes backward

  // One offset changes, but the other offset doesn't
  ['America/Anchorage', '2025-03-08T01:30:00', 'setDate', 9, '2025-03-09T01:30:00-09:00'], // PT changes forward, AKT doesn't
  ['America/Anchorage', '2025-03-10T01:30:00', 'setDate', 9, '2025-03-09T01:30:00-09:00'], // AKT un-changes forward, PT doesn't

  // Cannot test split PT/AKT transitions, because the interval between the
  // PT and AKT transition is shorter than the magnitude of the transition itself.
  // AKT is the most negative zone that observes DST, so there's no way
  // to exercise this case as long as the tests run in US/Pacific.
  // ['America/Anchorage', '2025-11-03T??:??:??', 'setDate', 2, '2025-11-02T??:??:??-08:00'], // AKT un-changes backward, PT doesn't

  // Can't cross a day boundary with this test; need at least 3 hours of relative offset
  // ['America/Anchorage', '2025-11-01T00:59:00', 'setDate', 2, '2025-11-02T01:59:00-08:00'], // PT changes backward, AKT doesn't

  // setFullYear
  ['US/Eastern', '2015-12-31T19:30:00-05:00', 'setFullYear', 2015, '2015-12-31T19:30:00-05:00'],  // Mock and UTC in different years
  ['US/Eastern', '2015-12-31T19:30:00-05:00', 'setFullYear', 2016, '2016-12-31T19:30:00-05:00'],
  ['US/Eastern', '2015-01-01T00:30:00-05:00', 'setFullYear', 2015, '2015-01-01T00:30:00-05:00'],  // System and Mock in different years
  ['US/Eastern', '2015-01-01T00:30:00-05:00', 'setFullYear', 2016, '2016-01-01T00:30:00-05:00'],

  // For very old dates, Node uses mean solar time in Los Angeles
  // rather than US standard times. timezone_mock does not emulate this,
  // so we are expecting to be off by 422 seconds here.
  ['US/Pacific', '1970-01-01T00:00:00Z'     , 'setFullYear',   20, -61504445222000 + 422000 ]
];

for (const c of cases) {
  testLocalSetterCase(...c);
}

function testLocalSetterCase(mockTz, start, fn, newValue, expectedEnd) {
  timezone_mock.register(mockTz)
  const d = new Date(start);
  const t = new timezone_mock._Date(expectedEnd).getTime();
  try {
    assert.equal(d[fn](newValue), t)
    assert.equal(d.getTime(), t)
  } catch (e) {
    console.log(JSON.stringify({
      mockTz, start: start, newDate: newValue,
      expectedEnd: new Date(expectedEnd).toISOString(),
      actualEnd: d.toISOString(),
    }, null, 2))
    throw e;
  }
  timezone_mock.unregister();
}
