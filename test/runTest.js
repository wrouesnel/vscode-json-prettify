const { runTests } = require('@vscode/test-electron');
const path = require('path');

async function main() {
  try {
    console.log('running tests');
    const extensionDevelopmentPath = path.resolve(__dirname, '../');
    const extensionTestsPath = path.resolve(__dirname, './extension.test.js');
    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs: [
        '--disable-extensions',
        '--disable-workspace-trust',
        '--disable-updates',
        '--user-data-dir=/tmp/vscode-test-user-data-' + Date.now() // Unique directory
      ],
      testRunner: 'mocha',
      mochaOptions: {
        ui: 'bdd',
        timeout: 10000,
        reporter: 'spec',
        slow: 5000
      }
    });
  } catch (err) {
    console.error('Failed to run tests', err);
    process.exit(1);
  }
}

main();
