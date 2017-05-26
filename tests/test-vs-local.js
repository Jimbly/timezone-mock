var assert = require('assert');
var timezone_mock = require('../');

//////////////////////////////////////////////////////////////////////////
// Test that the mocked date behaves exactly the same as the system date when
//   mocking the same timezone.
// JE: 2017-05-26, Node 6.9.1: This test seems to fail when specifying non-
//   existent dates (undefined behavior anyway), not sure if this was working
//   before or not.

if (!new timezone_mock._Date().toString().match(/\(PDT\)|\(PST\)/)) {
  // Because we only have timezone info for a couple timezones, we can only test
  //   this if the timezone we're mocking is the same as the system timezone.
  // In theory this could be extended to be able to test any timezone for which
  //   we have timezone data.
  assert.ok(false, 'These tests only work if the local system timezone is Pacific');
}

timezone_mock.register('US/Pacific');

function test(d) {
  var ret = [];
  ret.push(d.getTimezoneOffset());
  ret.push(d.getHours());
  d.setTime(new Date('2015-03-08T02:30:11.000Z').getTime());
  ret.push(d.getTimezoneOffset());
  ret.push(d.getHours());
  d.setTime(new Date('2015-03-07T02:30:11.000Z').getTime());
  ret.push(d.getTimezoneOffset());
  ret.push(d.getHours());
  d.setTime(new Date('2015-03-09T02:30:11.000Z').getTime());
  ret.push(d.getTimezoneOffset());
  ret.push(d.getHours());
  return ret;
}

var orig = new timezone_mock._Date();
var mock = new Date();

function pad2(v) {
  return ('0' + v).slice(-2);
}

var ts = new Date('2013-01-01T00:00:00.000Z').getTime();
var was_ok = true;
var last = ts;
var end = ts + 5*365*24*60*60*1000;
for (; ts < end; ts += 13*60*1000) {
  orig.setTime(ts);
  mock.setTime(ts);
  assert.equal(orig.toISOString(), mock.toISOString());
  var ok = true;
  function check(label) {
    function check2(fn) {
      if (orig[fn]() !== mock[fn]()) {
        ok = false;
        if (was_ok) {
          console.log('  ' + fn + ' (' + label + ')', orig[fn](), mock[fn]());
        }
      }
    }
    check2('getTimezoneOffset');
    check2('getHours');
    check2('getTime');
  }
  check('setTime');
  var test = new timezone_mock._Date(ts);
  orig = new timezone_mock._Date('2015-01-01');
  mock = new Date('2015-01-01');
  orig.setFullYear(test.getUTCFullYear());
  mock.setFullYear(test.getUTCFullYear());
  orig.setMinutes(test.getUTCMinutes());
  mock.setMinutes(test.getUTCMinutes());
  orig.setHours(test.getUTCHours());
  mock.setHours(test.getUTCHours());
  check('setFullYear/Minutes/Hours');
  orig.setDate(test.getUTCDate());
  mock.setDate(test.getUTCDate());
  check('setDate');
  var str = test.getUTCFullYear() + '-' + pad2(test.getUTCMonth() + 1) + '-' + pad2(test.getUTCDate()) + ' ' +
    pad2(test.getUTCHours()) + ':' + pad2(test.getUTCMinutes()) + ':' + pad2(test.getUTCSeconds());
  orig = new timezone_mock._Date(str);
  mock = new Date(str);
  check('constructor ' + str);
  if (was_ok !== ok) {
    console.log((ok ? 'OK    ' : 'NOT OK') + ' - ' + ts + ' (' + (ts - last) + ') ' + orig.toISOString() + ' (' + orig.toLocaleString() + ')');
    last = ts;
    was_ok = ok;
  }
}
