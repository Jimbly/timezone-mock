/* eslint-env es6 */
/*
  Usage: Run and copy into tzdata.js
    node import.js /usr/share/zoneinfo/Europe/London > out.txt
    node import.js /usr/share/zoneinfo/PST8PDT >> out.txt
    node import.js /usr/share/zoneinfo/EST5EDT >> out.txt
    node import.js /usr/share/zoneinfo/America/Sao_Paulo >> out.txt
    node import.js /usr/share/zoneinfo/Australia/Adelaide >> out.txt
*/
const assert = require('assert');
const fs = require('fs');

assert(process.argv[2]);
let tzfile = fs.readFileSync(process.argv[2]);

let idx = 0;

let magic = tzfile.toString('ascii', 0, 4);
idx += 4;
assert(magic === 'TZif');

let version = tzfile.readUInt8(idx++);
assert(version === 0x32);

idx += 15;
let values = [];
for (let ii = 0; ii < 6; ++ii) {
  values[ii] = tzfile.readUInt32BE(idx);
  idx += 4;
}
let [tzh_ttisgmtcnt, tzh_ttisstdcnt, tzh_leapcnt, tzh_timecnt, tzh_typecnt, tzh_charcnt] = values;
// console.log(`tzh_ttisgmtcnt:${tzh_ttisgmtcnt} tzh_ttisstdcnt:${tzh_ttisstdcnt} tzh_leapcnt:${tzh_leapcnt} ` +
//   `tzh_timecnt:${tzh_timecnt} tzh_typecnt:${tzh_typecnt} tzh_charcnt:${tzh_charcnt}`);

let transitions = [];
for (let ii = 0; ii < tzh_timecnt; ++ii) {
  transitions.push({ time: tzfile.readUInt32BE(idx) });
  idx += 4;
}

for (let ii = 0; ii < tzh_timecnt; ++ii) {
  transitions[ii].which = tzfile.readUInt8(idx++);
}
transitions.sort(function (a, b) {
  return a.time - b.time;
});

let ttinfos = [];
for (let ii = 0; ii < tzh_typecnt; ++ii) {
  let ttinfo = {};
  ttinfo.tt_gmtoff = tzfile.readInt32BE(idx);
  idx += 4;
  ttinfo.tt_isdst = tzfile.readUInt8(idx++);
  ttinfo.tt_abbrind = tzfile.readUInt8(idx++);
  ttinfos.push(ttinfo);
}

let abbr = tzfile.toString('ascii', idx, idx + tzh_charcnt);
idx += tzh_charcnt;
for (let ii = 0; ii < ttinfos.length; ++ii) {
  ttinfos[ii].tt_abbr = abbr.slice(ttinfos[ii].tt_abbrind).split('\0')[0];
}

for (let ii = 0; ii < tzh_leapcnt; ++ii) {
  /* let time = */tzfile.readUInt32BE(idx);
  idx += 4;
  /* let total_leap_seconds = */tzfile.readUInt32BE(idx);
  idx += 4;
}

assert(!tzh_ttisstdcnt || tzh_ttisstdcnt === tzh_typecnt);
for (let ii = 0; ii < tzh_ttisstdcnt; ++ii) {
  ttinfos[ii].isstd = tzfile.readUInt8(idx++);
}

assert(!tzh_ttisgmtcnt || tzh_ttisgmtcnt === tzh_typecnt);
for (let ii = 0; ii < tzh_ttisgmtcnt; ++ii) {
  ttinfos[ii].isgmt = tzfile.readUInt8(idx++);
}

// console.log(JSON.stringify(transitions, undefined, 2));
// console.log(JSON.stringify(ttinfos, undefined, 2));

let cuttoff = new Date('2038').getTime() / 1000; // Things get weird after this in the Linux data, ignore it
transitions = transitions.filter((trans) => trans.time < cuttoff);

// add transitions for the first and last timestamps if the time zone doesn't have DST transitions
if (!transitions.length) {
  transitions.push({ time: 0, which: 0 });
  transitions.push({ time: Infinity, which: 0 });
}

let named = {};
let out = {
  names: [],
  transitions: [],
};
for (let ii = 0; ii < transitions.length; ++ii) {
  let trans = transitions[ii];
  let ttinfo = ttinfos[trans.which];
  let offs = ttinfo.tt_gmtoff / 3600;
  out.transitions.push(trans.time, offs);
  if (!named[offs]) {
    out.names.push(offs, ttinfo.tt_abbr);
    named[offs] = true;
  }
}

if (out.transitions[0]) {
  // Assume alternating and start at the other
  out.transitions.splice(0, 0, 0, out.transitions[3]);
}

const zoneName = process.argv[2].split('zoneinfo/')[1]
  .replace('PST8PDT', 'US/Pacific')
  .replace('EST5EDT', 'US/Eastern')
  .replace('America/Sao_Paulo', 'Brazil/East');
console.log(`  '${zoneName}': {`);
console.log(`    names: [${out.names.map((v) => (typeof v === 'string' ? `'${v}'` : v)).join(', ')}],`);
console.log('    transitions: [');
for (let ii = 0; ii < out.transitions.length; ii += 2) {
  console.log(`      ${out.transitions[ii]}, ${out.transitions[ii + 1]},`);
}
console.log('    ],\n  },');
