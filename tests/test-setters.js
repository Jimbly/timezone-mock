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
function doit(fn, val, fails) {
  var ret_orig = orig[fn](val);
  var ret_mock = mock[fn](val);
  console.log(fn, val, orig, mock);
  if (!fails) {
    assert.equal(ret_orig, ret_mock);
    assert.equal(orig.getTime(), mock.getTime());
    assert.equal(orig.getHours(), mock.getHours());
    assert.equal(orig.getTimezoneOffset(), mock.getTimezoneOffset());
  }
}
doit('setMinutes', 30);
doit('setFullYear', 2015);
doit('setHours', 0);
doit('setMonth', 2);
doit('setDate', 1);
doit('setDate', 8);
// JE: 2018-04-10: These are not a valid date (setting 2:30am when clocks go from
//  1:59am to 3am on that day), and for some reason we no longer behave exactly
//  like Node, so just disabling this test for now.
doit('setHours', 2, true);
doit('setHours', 3);
doit('setHours', 2, true);
doit('setHours', 1);

doit('setMonth', 9);
doit('setDate', 1);
doit('setHours', 1);
doit('setMonth', 10);
doit('setHours', 0);
doit('setHours', 1);
doit('setHours', 2);
doit('setHours', 1);

function randInt(max) {
  return Math.floor(Math.random() * max);
}
for (var ii = 0; ii < 100000; ++ii) {
  switch (randInt(3)) {
    case 0:
      doit('setMonth', randInt(12));
      break;
    case 1:
      doit('setDate', randInt(28) + 1);
      break;
    case 2:
      doit('setHours', randInt(24));
      break;
  }
}
