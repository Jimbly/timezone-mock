'use strict';

var assert = require('assert');
var tzdata = require('./lib/tzdata.js');
exports.tzdata = tzdata;

var _Date = null;
exports._Date = Date;

var mockDateOptions = {};

var timezone;

var weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

var HOUR = 60 * 60 * 1000;

var date_iso_8601_regex = /^\d\d\d\d(-\d\d(-\d\d(T\d\d:\d\d(:\d\d)?(\.\d\d\d)?(\d\d\d)?(Z|[+-]\d\d:?\d\d))?)?)?$/;
var date_with_offset = /^\d\d\d\d-\d\d-\d\d( \d\d:\d\d:\d\d(\.\d\d\d)? )?(Z|(-|\+|)\d\d:\d\d)$/;
var date_rfc_2822_regex = /^\d\d-\w\w\w-\d\d\d\d \d\d:\d\d:\d\d (\+|-)\d\d\d\d$/;
var local_date_regex = /^\d\d\d\d-\d\d-\d\d[T ]\d\d:\d\d(:\d\d(\.\d\d\d)?)?$/;
var local_GMT_regex = /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun), \d\d \w\w\w \d\d\d\d \d\d:\d\d:\d\d GMT$/

function MockDate(param) {
  if (arguments.length === 0) {
    this.d = new _Date();
  } else if (arguments.length === 1) {
    if (param instanceof MockDate) {
      this.d = new _Date(param.d);
    } else if (typeof param === 'string') {
      if (param.match(date_iso_8601_regex) ||
        param.match(date_with_offset) ||
        param.match(date_rfc_2822_regex) ||
        param.match(local_GMT_regex) ||
        param === ''
      ) {
        this.d = new _Date(param);
      } else if (param.match(local_date_regex)) {
        this.d = new _Date();
        this.fromLocal(new _Date(param.replace(' ', 'T') + 'Z'));
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
    this.fromLocal(new _Date(_Date.UTC.apply(null, arguments)));
  }
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
MockDate.prototype.fromLocal = function (d) {
  // From a Date object in the fake-timezone where the returned UTC values are
  //   meant to be interpreted as local values.
  this.d.setTime(d.getTime() + this.calcTZO(d.getTime() + this.calcTZO(d.getTime()) * HOUR) * HOUR);
};
function localsetter(fn) {
  MockDate.prototype[fn] = function () {
    var d = new _Date(this.d.getTime() - this.calcTZO() * HOUR);
    d['setUTC' + fn.slice(3)].apply(d, arguments);
    this.fromLocal(d);
    return this.getTime();
  };
}
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
  'getDate',
  'getDay',
  'getFullYear',
  'getHours',
  'getMilliseconds',
  'getMinutes',
  'getMonth',
  'getSeconds',
].forEach(localgetter);
[
  'setDate',
  'setFullYear',
  'setHours',
  'setMilliseconds',
  'setMinutes',
  'setMonth',
  'setSeconds',
].forEach(localsetter);

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

MockDate.now = function () { return _Date.now() };

MockDate.UTC = function () { return _Date.UTC.apply(_Date, arguments) };

MockDate.prototype.toDateString = function () {
  if (Number.isNaN(this.d.getTime())) {
    return new _Date('').toDateString();
  }
  return weekDays[this.getDay()] + ' ' + months[this.getMonth()] + ' ' +
    this.getDate().toString().padStart(2, '0') + ' ' + this.getFullYear();
};

MockDate.prototype.toLocaleString = function (locales, options) {
  options = Object.assign({ timeZone: timezone }, options);
  var time = this.d.getTime();
  if (Number.isNaN(time)) {
    return new _Date('').toDateString();
  }
  return new _Date(time).toLocaleString(locales, options);
};

MockDate.prototype.toLocaleDateString = function (locales, options) {
  options = Object.assign({ timeZone: timezone }, options);
  var time = this.d.getTime();
  if (Number.isNaN(time)) {
    return new _Date('').toDateString();
  }
  return new _Date(time).toLocaleDateString(locales, options);
};

MockDate.prototype.toLocaleTimeString = function (locales, options) {
  options = Object.assign({ timeZone: timezone }, options);
  var time = this.d.getTime();
  if (Number.isNaN(time)) {
    return new _Date('').toDateString();
  }
  return new _Date(time).toLocaleTimeString(locales, options);
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
