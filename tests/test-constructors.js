/* eslint-env es6 */
// This test should pass regardless of what timezone your local machine is in

var assert = require('assert');
var timezone_mock = require('..');

var test = global.test || function (name, tst) {
  console.log('TEST:', name, '...');
  tst();
  console.log('      PASSED!');
};

function isMockDate(d) {
  return typeof d.fromLocal === 'function';
}

//////////////////////////////////////////////////////////////////////////
// This test must be first
test('unregister without register', function() {
  assert.ok(!isMockDate(new Date()));
  timezone_mock.unregister();
  assert.ok(!isMockDate(new Date()));
  timezone_mock.register();
  assert.ok(isMockDate(new Date()));
  timezone_mock.unregister();
  assert.ok(!isMockDate(new Date()));
});


//////////////////////////////////////////////////////////////////////////
test('"simple" date constructors', function() {
  timezone_mock.register();
  assert.ok(new Date());
  assert.ok(new Date(null));

  assert.ok(new Date(''));
  assert.ok(new Date('').toString() === 'Invalid Date');
  assert.ok(Number.isNaN(new Date('').getHours()));
  assert.equal(new Date(1627943659743).toString(), '2021-08-02T22:34:19.743Z UTC (MockDate: GMT-0700)');
  assert.equal(Object.prototype.toString.call(new Date(1627943659743)), '[object Date]');
  assert.equal(Object.prototype.toString.call(undefined), '[object Undefined]');

  var invalidDateMadeValid = new Date('');
  assert.ok(invalidDateMadeValid.setTime(12345) === 12345);
  assert.ok(!Number.isNaN(invalidDateMadeValid.getHours()));
});

//////////////////////////////////////////////////////////////////////////
test('date constructors as used by local timezone mode in node-mysql (local strings)', function() {
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
  assert.equal(new Date(test_str).getTime(), new Date(test_str).valueOf());
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

  // Testing "local" constructors that look like UTC constructors,
  //   This behavior changed on Node v8.0.0
  assert.equal(1420104225678, new Date('2015-01-01T01:23:45.678').getTime());
  assert.equal(1420104225000, new Date('2015-01-01T01:23:45').getTime());

  // supports variation of ECMAscript spec for THH:mm
  // https://www.ecma-international.org/ecma-262/#sec-date-time-string-format
  assert.equal(1414915200000, new Date('2014-11-02T01:00').getTime());
});

/////////////////////////////////
test('constructor supports time format YYYY-MM-DDZ', function() {
  timezone_mock.register('UTC');
  assert.equal(new Date('2017-05-26Z').toLocaleTimeString('en-US'), '12:00:00 AM');
  assert.equal(new Date('2017-05-26Z').toLocaleDateString('en-US'), '5/26/2017');
  assert.throws(() => new Date('2017-05-26X').toLocaleTimeString('en-US'));
  timezone_mock.unregister();
  timezone_mock.register('US/Pacific');
  assert.equal(new Date('2017-05-26Z').toLocaleTimeString('en-US'), '5:00:00 PM');
  assert.equal(new Date('2017-05-26Z').toLocaleDateString('en-US'), '5/25/2017');
  timezone_mock.unregister();
});

/////////////////////////////////
test('constructor supports time format YYYY-MM-DDThh:mmZ', function() {
  timezone_mock.register('UTC');
  assert.equal(new Date('2017-05-26T00:00Z').toLocaleTimeString('en-US'), '12:00:00 AM');
  assert.equal(new Date('2017-05-26T00:00Z').toLocaleDateString('en-US'), '5/26/2017');
  assert.throws(() => new Date('2017-05-26T00:00:Z').toLocaleTimeString('en-US'));
  timezone_mock.unregister();
  timezone_mock.register('US/Pacific');
  assert.equal(new Date('2017-05-26T00:00Z').toLocaleTimeString('en-US'), '5:00:00 PM');
  assert.equal(new Date('2017-05-26T00:00Z').toLocaleDateString('en-US'), '5/25/2017');
  timezone_mock.unregister();
});

/////////////////////////////////
test('constructor supports time format Fri, 27 Jul 2019 10:32:24 GMT', function() {
  timezone_mock.register('UTC');
  assert.equal(new Date('Fri, 27 Jul 2019 10:32:24 GMT').toLocaleString('en-US'), '7/27/2019, 10:32:24 AM');
  assert.throws(() => new Date('Fre, 27 Jul 2019 10:32:24 GMT').toLocaleString('en-US'));
  timezone_mock.unregister();
  timezone_mock.register('US/Pacific');
  assert.equal(new Date('Fri, 27 Jul 2019 10:32:24 GMT').toLocaleString('en-US'), '7/27/2019, 3:32:24 AM');
  timezone_mock.unregister();
});

//////////////////////////////////////////////////////////////////////////
test('UTC/non-local timezone constructors', function() {
  assert.equal(1495821155869, new Date('2017-05-26T17:52:35.869Z').getTime());
  assert.equal(1495821155869, new Date('2017-05-26T17:52:35.869000Z').getTime());
  assert.equal(1495821155869, new Date('2017-05-26 17:52:35.869 Z').getTime());
  assert.equal(1495821155869, new Date('2017-05-26 17:52:35.869 -00:00').getTime());
  assert.equal(1495821155869, new Date('2017-05-26 17:52:35.869 +00:00').getTime());
  assert.equal(1495821155869, new Date('2017-05-26 18:52:35.869 +01:00').getTime());
  assert.equal(1495821155869, new Date('2017-05-26 10:52:35.869 -07:00').getTime());
  assert.equal(1495821155869, new Date('2017-05-26T17:52:35.869+00:00').getTime());
  assert.equal(1495821155869, new Date('2017-05-26T10:52:35.869-0700').getTime());
  assert.equal(1495821155000, new Date('2017-05-26T17:52:35+00:00').getTime());
  assert.equal(1495821155000, new Date('2017-05-26 17:52:35 +00:00').getTime());
  assert.equal(1495821155000, new Date('2017-05-26 10:52:35 -07:00').getTime());
});

//////////////////////////////////////////////////////////////////////////
test('some generic properties about the date object', function() {
  assert.equal(new Date(2017, 5).getTime(), new Date(2017, 5, 1, 0, 0, 0, 0).getTime());
});

//////////////////////////////////////////////////////////////////////////
test('Brazil timezone oddities', function() {
  var test_str = '2017-10-15 00:00:00.000'; // Midnight on this day doesn't exist, jumps to 11PM previous day
  timezone_mock.register('Brazil/East');
  assert.equal(1508032800000, new Date(test_str).getTime());
  assert.equal(1508032800000, new Date(2017, 9, 15, 0, 0, 0, 0).getTime());

  // Some dates after DST was abolished
  assert.equal(1577847600000, new Date('2020-01-01 00:00:00.000').getTime());
  assert.equal(new Date('2026-01-15T16:29:00Z').toLocaleString('en-US'), '1/15/2026, 1:29:00 PM');
  timezone_mock.unregister();
});

//////////////////////////////////////////////////////////////////////////
test('Make sure month May exists', function() {
  timezone_mock.register();
  // Any date in May should be in May and not in June
  assert.equal(new Date(1588316400000).toDateString(), 'Fri May 01 2020');
  // Any date after May should have the right month name
  assert.equal(new Date(1598964466381).toDateString(), 'Tue Sept 01 2020');
  timezone_mock.unregister();
});

//////////////////////////////////////////////////////////////////////////
test('option to use a fallback function when failing to parse (issue #24)', function() {
  timezone_mock.unregister();
  var _Date = Date;
  timezone_mock.options({
    fallbackFn: function (date) {
      return new _Date(date);
    }
  });
  timezone_mock.register('UTC');
  assert.equal(new Date('Fri, 26 Jul 2019 10:32:24 GMT-1').toDateString(), 'Fri Jul 26 2019');
  timezone_mock.unregister();

  // How can we reset options?
  timezone_mock.options();
  timezone_mock.register('UTC');
  var got_error = false;
  try {
    assert.equal(new Date('Fri, 26 Jul 2019 10:32:24 GMT-1').toDateString(), 'Fri Jul 26 2019');
  } catch (err) {
    // Expected
    got_error = true;
  }
  assert.equal(got_error, true);
  timezone_mock.unregister();
});

//////////////////////////////////////////////////////////////////////////
test('toLocaleString() works', function() {
  const options = {
    year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric'
  };
  timezone_mock.register('UTC');
  assert.equal('May 26, 2017, 5:52 PM', new Date('2017-05-26T17:52:35.869Z').toLocaleString('en-US', options));
  timezone_mock.unregister();
  timezone_mock.register('US/Pacific');
  assert.equal('May 26, 2017, 10:52 AM', new Date('2017-05-26T17:52:35.869Z').toLocaleString('en-US', options));
  timezone_mock.unregister();
  timezone_mock.register('Australia/Adelaide');
  assert.equal('May 27, 2017, 3:22 AM', new Date('2017-05-26T17:52:35.869Z').toLocaleString('en-US', options));
  timezone_mock.unregister();
  timezone_mock.register('Australia/Adelaide');
  const optionsWithTz = {
    year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', timeZone: 'UTC'
  };
  assert.equal('May 26, 2017, 5:52 PM', new Date('2017-05-26T17:52:35.869Z').toLocaleString('en-US', optionsWithTz));
  timezone_mock.unregister();
});

//////////////////////////////////////////////////////////////////////////
test('toLocaleDateString() works', function() {
  const options = {
    year: 'numeric', month: 'short', day: 'numeric'
  };
  timezone_mock.register('UTC');
  assert.equal('May 26, 2017', new Date('2017-05-26T17:52:35.869Z').toLocaleDateString('en-US', options));
  timezone_mock.unregister();
  timezone_mock.register('US/Pacific');
  assert.equal('May 26, 2017', new Date('2017-05-26T17:52:35.869Z').toLocaleDateString('en-US', options));
  timezone_mock.unregister();
  timezone_mock.register('Australia/Adelaide');
  assert.equal('May 27, 2017', new Date('2017-05-26T17:52:35.869Z').toLocaleDateString('en-US', options));
  timezone_mock.unregister();
  timezone_mock.register('Australia/Adelaide');
  const optionsWithTz = {
    year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC'
  };
  assert.equal('May 26, 2017', new Date('2017-05-26T17:52:35.869Z').toLocaleDateString('en-US', optionsWithTz));
  timezone_mock.unregister();
});

//////////////////////////////////////////////////////////////////////////
test('toLocaleTimeString() works', function() {
  timezone_mock.register('UTC');
  assert.equal('5:52:35 PM', new Date('2017-05-26T17:52:35.869Z').toLocaleTimeString('en-US'));
  timezone_mock.unregister();
  timezone_mock.register('US/Pacific');
  assert.equal('10:52:35 AM', new Date('2017-05-26T17:52:35.869Z').toLocaleTimeString('en-US'));
  timezone_mock.unregister();
  timezone_mock.register('Australia/Adelaide');
  assert.equal('3:22:35 AM', new Date('2017-05-26T17:52:35.869Z').toLocaleTimeString('en-US'));
  timezone_mock.unregister();
  timezone_mock.register('Australia/Adelaide');
  assert.equal('5:52:35 PM', new Date('2017-05-26T17:52:35.869Z').toLocaleTimeString('en-US', { timeZone: 'UTC' }));
  timezone_mock.unregister();
});

//////////////////////////////////////////////////////////////////////////
test('chained mocking', function() {
  timezone_mock.unregister();
  // Make a mock'd date that changes Date.now()
  var RealDate = Date;
  assert.ok(!isMockDate(new RealDate()));
  function MyDate() {
    RealDate.apply(this, arguments);
  }
  MyDate.prototype = Object.create(RealDate.prototype);
  for (var key in Date) {
    MyDate[key] = Date[key];
  }
  MyDate.now = function () {
    return 1234;
  };
  global.Date = MyDate;
  // Register timezone_mock on top of it
  timezone_mock.register();
  // We should get a mocked date using our mocked now function
  assert.ok(isMockDate(new Date()));
  assert.equal(Date.now(), 1234);
  // Unregister timezone_mock and our test mock
  timezone_mock.unregister();
  assert.ok(!isMockDate(new Date()));
  assert.equal(global.Date, MyDate);
  global.Date = RealDate;
});
