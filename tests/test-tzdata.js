const assert = require('assert');
const timezone_mock = require("../index");

const max32BitUnixTime_s = 4_294_967_295;
const verbose = false;

if (verbose) {
  console.log(`     TIME ZONE     |   TIMESTAMP (s)   | OFFSET (min)`);
}

for (const [tzname, def] of Object.entries(timezone_mock.tzdata)) {
  const tzref = `tzdata["${tzname}"]`;
  assert(def.names.length > 0, `${tzref}.names is empty`);
  assert(def.transitions.length % 2 === 0, `Expected even number of elements in ${tzref}.transitions (ts/offset pairs)`);
  const now_s = Date.now() / 1000;
  timezone_mock.register(tzname);
  try {
    function checkOffsetIsDefined(ts) {
      let offset = new Date(ts).getTimezoneOffset() * -1;
      assert(typeof offset === 'number', `${tzref} gives no valid time zone offset for Unix T+${ts}s`)
      if (verbose) {
        console.log(`${tzname.padStart(18)} | ${ts.toLocaleString().padStart(17)} | ${offset.toLocaleString().padStart(4)}`);
      }
    }

    checkOffsetIsDefined(0);
    checkOffsetIsDefined(max32BitUnixTime_s);
    if (0 <= now_s && now_s <= max32BitUnixTime_s) {
      checkOffsetIsDefined(now_s);
    }
  } finally {
    timezone_mock.unregister();
  }
}
