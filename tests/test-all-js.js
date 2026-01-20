var path = require('path');
var fs = require('fs');
var child_process = require('child_process');

function main() {
  fs.readdirSync(__dirname).forEach(function (fname) {
    if ((/^test-.*\.(m|c)?js$/).test(fname) && fname !== path.basename(__filename)) {
      console.log(fname + '...');
      child_process.execSync('node ' + path.join(__dirname, fname), {
        stdio: 'inherit',
      });
    }
  });
}

if (require.main === module) {
  main();
}
