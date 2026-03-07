const fs = require('fs');
const path = require('path');

module.exports = async function () {
  const summaryPath = path.resolve(process.cwd(), 'coverage', 'coverage-summary.json');
  if (!fs.existsSync(summaryPath)) return;

  const { total } = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
  const avg = (
    (total.statements.pct + total.branches.pct + total.functions.pct + total.lines.pct) / 4
  ).toFixed(1);

  process.stdout.write(`\nTotal coverage: ${avg}%\n`);
};
