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
  const args = typeof val === 'object' ? val : [val]
  var ret_orig = orig[fn](...args);
  var ret_mock = mock[fn](...args);
  // console.log(fn, val.toString(), orig, mock);
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
function randInt(max) {
  seed = (1664525 * seed + 1013904223) % m;
  return Math.floor(seed / m * max);
}

for (var ii = 0; ii < 100000; ++ii) {
  switch (randInt(3)) { // eslint-disable-line default-case
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
