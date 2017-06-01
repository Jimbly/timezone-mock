var assert = require('assert');
var tzdata = require('./lib/tzdata.js');
exports.tzdata = tzdata;

var _Date = Date;
exports._Date = _Date;

var timezone;

var HOUR = 60 * 60 * 1000;

var date_iso_8601_regex=/^\d\d\d\d(-\d\d(-\d\d(T\d\d\:\d\d\:\d\d(\.\d\d\d)?Z?)?)?)?$/;
var date_with_offset=/^\d\d\d\d-\d\d-\d\d \d\d\:\d\d\:\d\d(\.\d\d\d)? (Z|(\-|\+|)\d\d\:\d\d)$/;
var date_rfc_2822_regex=/^\d\d-\w\w\w-\d\d\d\d \d\d\:\d\d\:\d\d (\+|-)\d\d\d\d$/;
var local_date_regex=/^\d\d\d\d-\d\d-\d\d \d\d\:\d\d\:\d\d(\.\d\d\d)?$/;

function MockDate(param) {
  if (arguments.length === 1) {
    if (param instanceof MockDate) {
      this.d = new _Date(param.d);
    } else if (typeof param === 'string') {
      if (param.match(date_iso_8601_regex) || param.match(date_with_offset) || param.match(date_rfc_2822_regex)) {
        this.d = new _Date(param);
      } else if (param.match(local_date_regex)) {
        this.d = new _Date();
        this.fromLocal(new _Date(param.replace(' ', 'T')));
      } else {
        assert.ok(false, 'Unhandled date format passed to MockDate constructor: ' + param);
      }
    } else if (typeof param === 'number') {
      this.d = new _Date(param);
    } else {
      assert.ok(false, 'Unhandled type passed to MockDate constructor: ' + typeof param);
    }
  } else {
    this.d = new _Date();
    this.fromLocal(new _Date(_Date.UTC.apply(null, arguments)));
  }
}

MockDate.prototype.calcTZO = function (ts) {
  var data = tzdata[timezone];
  assert.ok(data, 'Unsupported timezone: ' + timezone);
  ts = (ts || this.d.getTime()) / 1000;
  for (var ii = 2; ii < data.transitions.length; ii+=2) {
    if (data.transitions[ii] > ts) {
      return -data.transitions[ii-1];
    }
  }
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
    var d = new _Date(this.d.getTime() - this.calcTZO() * HOUR);
    return d['getUTC' + fn.slice(3)]();
  };
}
MockDate.prototype.fromLocal = function(d) {
  // From a Date object in the fake-timezone where the returned UTC values are
  //   meant to be interpreted as local values.
  this.d.setTime(d.getTime() + this.calcTZO(d.getTime() + this.calcTZO(d.getTime()) * HOUR) * HOUR);
};
function localsetter(fn) {
  MockDate.prototype[fn] = function () {
    var d = new _Date(this.d.getTime() - this.calcTZO() * HOUR);
    d['setUTC' + fn.slice(3)].apply(d, arguments);
    this.fromLocal(d);
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

MockDate.prototype.getTimezoneOffset = function () {
  return this.calcTZO() * 60;
};

MockDate.prototype.toString = MockDate.prototype.toLocaleString = function () {
  if (this instanceof _Date) {
    // someone, like util.inspect, calling Date.prototype.toString.call(foo)
    return _Date.prototype.toString.call(this);
  }
  return 'Mockday ' + this.d.toISOString() + ' GMT-0' + this.calcTZO() + '00 (MockDate)';
};

MockDate.now = _Date.now;

MockDate.UTC = _Date.UTC;

// TODO:
// 'toDateString',
// 'toLocaleDateString',
// 'toLocaleTimeString',
// 'toTimeString',

function register(new_timezone) {
  timezone = new_timezone || 'US/Pacific';
  global.Date = MockDate;
}
exports.register = register;

function unregister() {
  global.Date = _Date;
}
exports.unregister = unregister;
