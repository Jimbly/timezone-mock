var assert = require('assert');
var timezone_mock = require('../');

//////////////////////////////////////////////////////////////////////////
// Test date constructors as used by local timezone mode in node-mysql (local strings)
var test_str = '2015-01-01 01:23:45.678';
timezone_mock.register('UTC');
assert.equal(1420104225678 - 8*60*60*1000, new Date(test_str).getTime());
timezone_mock.register('US/Pacific');
assert.equal(1420104225678, new Date(test_str).getTime());
timezone_mock.register('US/Eastern');
assert.equal(1420104225678 - 3*60*60*1000, new Date(test_str).getTime());

timezone_mock.register('US/Pacific');
test_str = '2015-03-08 01:30:00.000'; // right before entering PDT
assert.equal(1425807000000, new Date(test_str).getTime());
test_str = '2015-03-08 02:30:00.000'; // doesn't exist, ends up 1:30am
assert.equal(1425807000000, new Date(test_str).getTime());
test_str = '2015-03-08 03:30:00.000'; // in PDT
assert.equal(1425810600000, new Date(test_str).getTime());
test_str = '2014-11-02 01:00:00.000'; // leaving PDT, JS Date returns 1am PST, not 1am PDT
assert.equal(1414918800000, new Date(test_str).getTime());
