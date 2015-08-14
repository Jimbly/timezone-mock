var assert = require('assert');
var timezone_mock = require('../');

timezone_mock.register('US/Pacific');

var orig = new timezone_mock._Date(0);
var mock = new Date(0);
function doit(fn, val) {
  orig[fn](val);
  mock[fn](val);
  console.log(fn, val, orig, mock);
  assert.equal(orig.getTime(), mock.getTime());
  assert.equal(orig.getHours(), mock.getHours());
  assert.equal(orig.getTimezoneOffset(), mock.getTimezoneOffset());
}
doit('setMinutes', 30);
doit('setFullYear', 2015);
doit('setHours', 0);
doit('setMonth', 2);
doit('setDate', 1);
doit('setDate', 8);
doit('setHours', 2);
doit('setHours', 3);
doit('setHours', 2);
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
