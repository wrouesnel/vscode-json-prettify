const assert = require('assert');
const vscode = require('vscode');
const sinon = require('sinon');
const path = require('path');
const fs = require('fs');
const { after, beforeEach, afterEach, suite, test } = require('mocha');

const extension = require('../extension');

suite('Extension Test Suite', () => {
  after(() => {
    vscode.window.showInformationMessage('All tests done!');
  });

  suite('getThemes function', () => {
    let sandbox;

    beforeEach(() => {
      sandbox = sinon.createSandbox();
    });

    afterEach(() => {
      sandbox.restore();
    });

    test('should return sorted list of unique theme names from CSS files', () => {
      const mockFiles = ['default.css', 'dark.min.css', 'light.css', 'solarized-dark.min.css'];
      sandbox.stub(fs, 'readdirSync').returns(mockFiles);
      sandbox.stub(path, 'join').returns('/mocked/path/to/styles');
      const themes = extension.getThemes();
      assert.deepStrictEqual(themes, ['dark', 'default', 'light', 'solarized-dark']);
    });

    test('should handle empty styles directory', () => {
      sandbox.stub(fs, 'readdirSync').returns([]);
      sandbox.stub(path, 'join').returns('/mocked/path/to/styles');
      const themes = extension.getThemes();
      assert.deepStrictEqual(themes, []);
    });

    test('should handle filesystem errors gracefully', () => {
      const logger = { error: sinon.stub() };
      sandbox.stub(fs, 'readdirSync').throws(new Error('Directory not found'));
      sandbox.stub(path, 'join').returns('/mocked/path/to/styles');
      const themes = extension.getThemes(logger);
      assert.deepStrictEqual(themes, []);
      assert.strictEqual(logger.error.callCount, 1,
        `logger.error should be called exactly once, but was called ${logger.error.callCount} times`);
      const errorMessage = logger.error.getCall(0).args[0];
      assert.match(errorMessage,
        /error reading styles directory \/mocked\/path\/to\/styles/,
        'logger.error should log the correct message');
    });
  });
});
