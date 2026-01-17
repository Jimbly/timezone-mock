'use strict';

var assert = require('assert');
var tzdata = require('./lib/tzdata.js');
exports.tzdata = tzdata;
exports.timeZones = Object.keys(tzdata);

var _Date = null;
exports._Date = Date;

var mockDateOptions = {};

var timezone;
var offsets;

var weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

var HOUR = 60 * 60 * 1000;

var date_iso_8601_regex = /^\d\d\d\d(-\d\d(-\d\d(T\d\d:\d\d(:\d\d)?(\.\d\d\d)?(\d\d\d)?(Z|[+-]\d\d:?\d\d))?)?)?$/;
var date_with_offset = /^\d\d\d\d-\d\d-\d\d( \d\d:\d\d:\d\d(\.\d\d\d)? )?(Z|(-|\+|)\d\d:\d\d)$/;
var date_rfc_2822_regex = /^\d\d-\w\w\w-\d\d\d\d \d\d:\d\d:\d\d (\+|-)\d\d\d\d$/;
var local_date_regex = /^(\d\d\d\d)-(\d\d)-(\d\d)[T ](\d\d):(\d\d)(?::(\d\d)(?:\.(\d\d\d))?)?$/;
var local_GMT_regex = /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun), \d\d \w\w\w \d\d\d\d \d\d:\d\d:\d\d GMT$/;

function MockDate(param) {
  if (arguments.length === 0) {
    this.d = new _Date();
  } else if (arguments.length === 1) {
    if (param instanceof MockDate) {
      this.d = new _Date(param.d);
    } else if (typeof param === 'string') {
      let localDateMatch;
      if (param.match(date_iso_8601_regex) ||
        param.match(date_with_offset) ||
        param.match(date_rfc_2822_regex) ||
        param.match(local_GMT_regex) ||
        param === ''
      ) {
        this.d = new _Date(param);
      } else if (localDateMatch = param.match(local_date_regex)) {
        // FYI, if() condition assigns and then checks nullish; not logical comparison
        const segments = localDateMatch
          .slice(1)
          .filter(g => g !== undefined)
          .map((n) => Number.parseInt(n));
        segments[1]--; // Correct month to monthIndex
        this.d = new _Date();
        this.fromLocal(...segments);
      } else if (mockDateOptions.fallbackFn) {
        this.d = mockDateOptions.fallbackFn(param);
      } else {
        assert.ok(false, 'Unhandled date format passed to MockDate constructor: ' + param);
      }
    } else if (typeof param === 'number' || param === null || param === undefined) {
      this.d = new _Date(param);
    } else if (mockDateOptions.fallbackFn) {
      this.d = mockDateOptions.fallbackFn(param);
    } else {
      assert.ok(false, 'Unhandled type passed to MockDate constructor: ' + typeof param);
    }
  } else {
    this.d = new _Date();
    this.fromLocal(...arguments);
  }
}

function getAllOffsets(timezone) {
  return tzdata[timezone].transitions.reduce((acc, o, i) => {
    if (i % 2 === 1 && !acc.includes(o)) {
      acc.push(o);
    }
    return acc;
  }, []);
}

// eslint-disable-next-line consistent-return
MockDate.prototype.calcTZO = function (ts) {
  var data = tzdata[timezone];
  assert.ok(data, 'Unsupported timezone: ' + timezone);
  ts = (ts || this.d.getTime()) / 1000;
  if (Number.isNaN(ts)) {
    return NaN;
  }
  for (var ii = 2; ii < data.transitions.length; ii += 2) {
    if (data.transitions[ii] > ts) {
      return -data.transitions[ii - 1];
    }
  }
  // note: should never reach here!
  assert.ok(false, ts);
};

function passthrough(fn) {
  MockDate.prototype[fn] = function () {
    var real_date;
    if (this instanceof MockDate) {
      real_date = this.d;
    } else if (this instanceof _Date) {
      // console.log calls our prototype to format regular Date objects!
      // This should only be hit while debugging MockDate itself though, as
      // there should be no _Date objects in user code when using MockDate.
      real_date = this;
    } else {
      assert(false, 'Unexpected object type');
    }
    return real_date[fn].apply(real_date, arguments);
  };
}

function localgetter(fn) {
  MockDate.prototype[fn] = function () {
    if (Number.isNaN(this.d.getTime())) {
      return NaN;
    }
    var d = new _Date(this.d.getTime() - this.calcTZO() * HOUR);
    return d['getUTC' + fn.slice(3)]();
  };
}

function localsetter(fn) {
  function getArgsToUse(settableProps, propToSet, calledWithArgs) {
    const i = settableProps.indexOf(propToSet);
    let args = settableProps.map(p => this.d['get' + p]());
    for (let j = 0; j < calledWithArgs.length && i >= 0; j++) {
      args[j + i] = calledWithArgs[j]
    }
    return args;
  }

  MockDate.prototype[fn] = function () {
    const propToSet = fn.slice(3);
    let dateArgs = getArgsToUse.call(this, dateProps, propToSet, arguments);
    let timeArgs = getArgsToUse.call(this, timeProps, propToSet, arguments);
    this.fromLocal(...dateArgs, ...timeArgs);
    return this.getTime();
  };
}

/** Convert a local timestamp to a Unix time
 *
 * Matches Node.js behavior for handling invalid or ambiguous times.
 *
 * Arguments are the individual date and time component values for the
 * local time: year, monthIndex (January = 0), day, hour, minute,
 * second, millisecond; just as in the corresponding `Date` constructor.
 *
 * A local timestamp usually describes exactly one instant, but it can
 * match zero or more instants if its representation falls around a UTC
 * offset change.
 *
 * For example, the timestamp 2015-11-01T01:30:00 corresponds to two
 * Unix times if interpreted in a U.S. time zone, because U.S. clocks
 * were set backward from 02:00 Daylight Time to 01:00 Standard Time.
 *
 * Conversely, 2015-03-08T02:30:00 does not refer to any valid U.S. time
 * at all -- Standard Time ends at 02:00 and Daylight Time begins at
 * 03:00.
 *
 * When attempting to set the local time to a time falling within an
 * offset transition (usually daylight saving time), we follow the
 * EcmaScript specification.
 *
 * Ecma International. _EcmaScript 2025 Language Specification_. 16th
 *   edition. ed. Kevin Gibbons. (2025).  https://tc39.es/ecma262/#sec-intro.
 *   Section 21.4.1.26 ("UTC (t)"), p. 483.
 *
 * Human-readable explanation from MDN:
 *   > When attempting to set the local time to a time falling within an
 *   > offset transition (usually daylight saving time), the exact time is
 *   > derived using the same behavior as Temporal's disambiguation:
 *   > "compatible" option. That is, if the local time corresponds to two
 *   > instants, the earlier one is chosen; if the local time does not exist
 *   > (there is a gap), we go forward by the gap duration.
 *
 * JavaScript Reference, Mozilla Developer Network, "Date", accessed 16
 * January 2026,
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date#date_components_and_time_zones.
 *
 * A similar phenomenon occurs around leap seconds, but we do not
 * account for those.
 * */
MockDate.prototype.fromLocal = function () {
  this.d.setTime(
    offsets.reduce(([acc, correctOffset], o) => {
      const ts = _Date.UTC(...arguments) - (o * HOUR);
      if (-this.calcTZO(ts) === o) {
        return [correctOffset === false || ts < acc ? ts : acc, true];
      } else {
        return [correctOffset === false && ts > acc ? ts : acc, false];
      }
    }, [null, false])[0]
  );
}

const dateProps = [
  'FullYear',
  'Month',
  'Date',
];

const timeProps = [
  'Hours',
  'Minutes',
  'Seconds',
  'Milliseconds',
];

[
  'getUTCDate',
  'getUTCDay',
  'getUTCFullYear',
  'getUTCHours',
  'getUTCMilliseconds',
  'getUTCMinutes',
  'getUTCMonth',
  'getUTCSeconds',
  'getTime',
  'setTime',
  'setUTCDate',
  'setUTCFullYear',
  'setUTCHours',
  'setUTCMilliseconds',
  'setUTCMinutes',
  'setUTCMonth',
  'setUTCSeconds',
  'toGMTString',
  'toISOString',
  'toJSON',
  'toUTCString',
  'valueOf',
].forEach(passthrough);
[
  ...dateProps,
  ...timeProps,
  'Day',
].map(s => 'get' + s)
  .forEach(localgetter);
[
  ...dateProps,
  ...timeProps,
].map(s => 'set' + s)
  .forEach(localsetter);

MockDate.prototype.getYear = function () {
  return this.getFullYear() - 1900;
};

MockDate.prototype.setYear = function (yr) {
  if (yr < 1900) {
    return this.setFullYear(1900 + yr);
  }
  return this.setFullYear(yr);
};

MockDate.parse = function (dateString) {
  return new MockDate(dateString).getTime();
};

MockDate.prototype.getTimezoneOffset = function () {
  if (Number.isNaN(this.d.getTime())) {
    return NaN;
  }
  return this.calcTZO() * 60;
};

MockDate.prototype.toString = function () {
  if (this instanceof _Date) {
    // someone, like util.inspect, calling Date.prototype.toString.call(foo)
    return _Date.prototype.toString.call(this);
  }
  if (Number.isNaN(this.d.getTime())) {
    return new _Date('').toString();
  }
  var str = [this.d.toISOString() + ' UTC (MockDate: GMT'];
  var tzo = -this.calcTZO();
  if (tzo < 0) {
    str.push('-');
    tzo *= -1;
  } else {
    str.push('+');
  }
  str.push(Math.floor(tzo).toString().padStart(2, '0'));
  tzo -= Math.floor(tzo);
  if (tzo) {
    str.push(tzo * 60);
  } else {
    str.push('00');
  }
  str.push(')');
  return str.join('');
};

MockDate.now = function () {
  return _Date.now();
};

MockDate.UTC = function () {
  return _Date.UTC.apply(_Date, arguments);
};

MockDate.prototype.toDateString = function () {
  if (Number.isNaN(this.d.getTime())) {
    return new _Date('').toDateString();
  }
  return weekDays[this.getDay()] + ' ' + months[this.getMonth()] + ' ' +
    this.getDate().toString().padStart(2, '0') + ' ' + this.getFullYear();
};

MockDate.prototype.toLocaleString = function (locales, opts) {
  opts = Object.assign({timeZone: timezone}, opts);
  var time = this.d.getTime();
  if (Number.isNaN(time)) {
    return new _Date('').toDateString();
  }
  return new _Date(time).toLocaleString(locales, opts);
};

MockDate.prototype.toLocaleDateString = function (locales, opts) {
  opts = Object.assign({timeZone: timezone}, opts);
  var time = this.d.getTime();
  if (Number.isNaN(time)) {
    return new _Date('').toDateString();
  }
  return new _Date(time).toLocaleDateString(locales, opts);
};

MockDate.prototype.toLocaleTimeString = function (locales, opts) {
  opts = Object.assign({timeZone: timezone}, opts);
  var time = this.d.getTime();
  if (Number.isNaN(time)) {
    return new _Date('').toDateString();
  }
  return new _Date(time).toLocaleTimeString(locales, opts);
};

// TODO:
// 'toTimeString',

function options(opts) {
  mockDateOptions = opts || {};
}

exports.options = options;

var orig_object_toString;

function mockDateObjectToString() {
  if (this instanceof MockDate) {
    // Look just like a regular Date to anything doing very low-level Object.prototype.toString calls
    // See: https://github.com/Jimbly/timezone-mock/issues/48
    return '[object Date]';
  }
  return orig_object_toString.call(this);
}

function register(new_timezone, glob) {
  if (!glob) {
    if (typeof window !== 'undefined') {
      glob = window;
    } else {
      glob = global;
    }
  }
  timezone = new_timezone || 'US/Pacific';
  offsets = getAllOffsets(timezone);
  tzdata[timezone].transitions.reduce((acc, o, i) => {
    if (i % 2 === 1 && !acc.includes(o)) {
      acc.push(o);
    }
    return acc;
  }, [])
  if (glob.Date !== MockDate) {
    _Date = glob.Date;
    exports._Date = glob.Date;
  }
  glob.Date = MockDate;
  if (!orig_object_toString) {
    orig_object_toString = Object.prototype.toString;
    Object.prototype.toString = mockDateObjectToString;
  }
}

exports.register = register;

function unregister(glob) {
  if (!glob) {
    if (typeof window !== 'undefined') {
      glob = window;
    } else {
      glob = global;
    }
  }
  if (glob.Date === MockDate) {
    assert(_Date);
    glob.Date = _Date;
  }
}

exports.unregister = unregister;
