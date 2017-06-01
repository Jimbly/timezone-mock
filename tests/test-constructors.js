var assert = require('assert');
var timezone_mock = require('../');

//////////////////////////////////////////////////////////////////////////
// Test date constructors as used by local timezone mode in node-mysql (local strings)
var test_str = '2015-01-01 01:23:45.678';
timezone_mock.register('UTC');
assert.equal(1420104225678 - 8*60*60*1000, new Date(test_str).getTime());
assert.equal(1420104225678 - 8*60*60*1000, new Date(2015, 0, 1, 1, 23, 45, 678).getTime());
timezone_mock.register('US/Pacific');
assert.equal(1420104225678, new Date(test_str).getTime());
assert.equal(1420104225678, new Date(2015, 0, 1, 1, 23, 45, 678).getTime());
timezone_mock.register('US/Eastern');
assert.equal(1420104225678 - 3*60*60*1000, new Date(test_str).getTime());
assert.equal(1420104225678 - 3*60*60*1000, new Date(2015, 0, 1, 1, 23, 45, 678).getTime());

timezone_mock.register('US/Pacific');
test_str = '2015-03-08 01:30:00.000'; // right before entering PDT
assert.equal(1425807000000, new Date(test_str).getTime());
assert.equal(1425807000000, new Date(2015, 2, 8, 1, 30, 0, 0).getTime());
test_str = '2015-03-08 02:30:00.000'; // doesn't exist, ends up 1:30am
assert.equal(1425807000000, new Date(test_str).getTime());
assert.equal(1425807000000, new Date(2015, 2, 8, 2, 30, 0, 0).getTime());
test_str = '2015-03-08 03:30:00.000'; // in PDT
assert.equal(1425810600000, new Date(test_str).getTime());
assert.equal(1425810600000, new Date(2015, 2, 8, 3, 30, 0, 0).getTime());
// leaving PDT, JS Date returns 1am PDT, not 1am PST
// JE: 2017-05-26, Node 6.9.1, Not sure why this was 1am PST before, no changes
//   to node should have changed how our mock behaves, yet, the mock is still
//   behaving the same as node, just they are both returning a different value
//   than the test previously expected, so, updating the test to reflect this.
test_str = '2014-11-02 01:00:00.000';
assert.equal(1414915200000, new Date(test_str).getTime());
assert.equal(1414915200000, new Date(2014, 10, 2, 1, 0, 0, 0).getTime());

//////////////////////////////////////////////////////////////////////////
// Test UTC/non-local timezone constructors
assert.equal(1495821155869, new Date('2017-05-26T17:52:35.869').getTime());
assert.equal(1495821155869, new Date('2017-05-26T17:52:35.869Z').getTime());
assert.equal(1495821155869, new Date('2017-05-26 17:52:35.869 Z').getTime());
assert.equal(1495821155869, new Date('2017-05-26 17:52:35.869 -00:00').getTime());
assert.equal(1495821155869, new Date('2017-05-26 17:52:35.869 +00:00').getTime());
assert.equal(1495821155869, new Date('2017-05-26 18:52:35.869 +01:00').getTime());
assert.equal(1495821155869, new Date('2017-05-26 10:52:35.869 -07:00').getTime());
assert.equal(1495821155000, new Date('2017-05-26T17:52:35').getTime());
assert.equal(1495821155000, new Date('2017-05-26 17:52:35 +00:00').getTime());
assert.equal(1495821155000, new Date('2017-05-26 10:52:35 -07:00').getTime());

//////////////////////////////////////////////////////////////////////////
// Test some generic properties about the date object
assert.equal(new Date(2017, 5).getTime(), new Date(2017, 5, 1, 0, 0, 0, 0).getTime());
