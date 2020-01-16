// This test should pass regardless of what timezone your local machine is in

var timezone_mock = require('..');

//////////////////////////////////////////////////////////////////////////
test('"simple" date constructors', function() {
  expect(new Date()).toBeTruthy();
  expect(new Date('')).toBeTruthy();
  expect(new Date('').toString()).toBe('Invalid Date');
  expect(new Date('').getHours()).toBe(NaN);
});

//////////////////////////////////////////////////////////////////////////
test('date constructors as used by local timezone mode in node-mysql (local strings)', function() {
  var test_str = '2015-01-01 01:23:45.678';
  timezone_mock.register('UTC');
  expect(1420104225678 - 8*60*60*1000).toBe(new Date(test_str).getTime());
  expect(1420104225678 - 8*60*60*1000).toBe(new Date(2015, 0, 1, 1, 23, 45, 678).getTime());

  timezone_mock.register('US/Pacific');
  expect(1420104225678).toBe(new Date(test_str).getTime());
  expect(1420104225678).toBe(new Date(2015, 0, 1, 1, 23, 45, 678).getTime());

  timezone_mock.register('US/Eastern');
  expect(1420104225678 - 3*60*60*1000).toBe(new Date(test_str).getTime());
  expect(1420104225678 - 3*60*60*1000).toBe(new Date(2015, 0, 1, 1, 23, 45, 678).getTime());

  timezone_mock.register('US/Pacific');
  test_str = '2015-03-08 01:30:00.000'; // right before entering PDT
  expect(1425807000000).toBe(new Date(test_str).getTime());
  expect(new Date(test_str).getTime()).toBe(new Date(test_str).valueOf());
  expect(1425807000000).toBe(new Date(2015, 2, 8, 1, 30, 0, 0).getTime());
  test_str = '2015-03-08 02:30:00.000'; // doesn't exist, ends up 1:30am
  expect(1425807000000).toBe(new Date(test_str).getTime());
  expect(1425807000000).toBe(new Date(2015, 2, 8, 2, 30, 0, 0).getTime());
  test_str = '2015-03-08 03:30:00.000'; // in PDT
  expect(1425810600000).toBe(new Date(test_str).getTime());
  expect(1425810600000).toBe(new Date(2015, 2, 8, 3, 30, 0, 0).getTime());
  // leaving PDT, JS Date returns 1am PDT, not 1am PST
  // JE: 2017-05-26, Node 6.9.1, Not sure why this was 1am PST before, no changes
  //   to node should have changed how our mock behaves, yet, the mock is still
  //   behaving the same as node, just they are both returning a different value
  //   than the test previously expected, so, updating the test to reflect this.
  test_str = '2014-11-02 01:00:00.000';
  expect(1414915200000).toBe(new Date(test_str).getTime());
  expect(1414915200000).toBe(new Date(2014, 10, 2, 1, 0, 0, 0).getTime());

  // Test "local" constructors that look like UTC constructors,
  //   This behavior changed on Node v8.0.0
  expect(1420104225678).toBe(new Date('2015-01-01T01:23:45.678').getTime());
  expect(1420104225000).toBe(new Date('2015-01-01T01:23:45').getTime());
});

//////////////////////////////////////////////////////////////////////////
test('UTC/non-local timezone constructors', function() {
  expect(1495821155869).toBe(new Date('2017-05-26T17:52:35.869Z').getTime());
  expect(1495821155869).toBe(new Date('2017-05-26 17:52:35.869 Z').getTime());
  expect(1495821155869).toBe(new Date('2017-05-26 17:52:35.869 -00:00').getTime());
  expect(1495821155869).toBe(new Date('2017-05-26 17:52:35.869 +00:00').getTime());
  expect(1495821155869).toBe(new Date('2017-05-26 18:52:35.869 +01:00').getTime());
  expect(1495821155869).toBe(new Date('2017-05-26 10:52:35.869 -07:00').getTime());
  expect(1495821155869).toBe(new Date('2017-05-26T17:52:35.869+00:00').getTime());
  expect(1495821155869).toBe(new Date('2017-05-26T10:52:35.869-0700').getTime());
  expect(1495821155000).toBe(new Date('2017-05-26T17:52:35+00:00').getTime());
  expect(1495821155000).toBe(new Date('2017-05-26 17:52:35 +00:00').getTime());
  expect(1495821155000).toBe(new Date('2017-05-26 10:52:35 -07:00').getTime());
});

//////////////////////////////////////////////////////////////////////////
test('some generic properties about the date object', function() {
  expect(new Date(2017, 5).getTime()).toBe(new Date(2017, 5, 1, 0, 0, 0, 0).getTime());
});

//////////////////////////////////////////////////////////////////////////
test('Brazil timezone oddities', function() {
  timezone_mock.register('Brazil/East');
  test_str = '2017-10-15 00:00:00.000'; // Midnight on this day doesn't exist, jumps to 11PM previous day
  expect(1508032800000).toBe(new Date(test_str).getTime());
  expect(1508032800000).toBe(new Date(2017, 9, 15, 0, 0, 0, 0).getTime());
});
