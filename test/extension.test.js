const assert = require('assert');
const vscode = require('vscode');
const sinon = require('sinon');
const path = require('path');
const fs = require('fs');
const hljs = require('highlight.js');
const { after, beforeEach, afterEach, suite, test } = require('mocha');

const extension = require('../extension');


suite('Extension Test Suite', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  after(() => {
    vscode.window.showInformationMessage('All tests done!');
  });

  suite('getThemes function', () => {
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
      const mockPinoLogger = { error: sandbox.stub() };
      sandbox.stub(fs, 'readdirSync').throws(new Error('Directory not found'));
      sandbox.stub(path, 'join').returns('/mocked/path/to/styles');
      const themes = extension.getThemes(mockPinoLogger);
      assert.deepStrictEqual(themes, [], 'getThemes should return an empty array on error');
    });
  });

  suite('highlightJson function', () => {
    test('should highlight JSON with line numbers and no search keyword', () => {
      const code = '{"key": "value"}';
      sandbox.stub(hljs, 'highlight').returns({ value: '<span class="hljs-string">"key"</span>: <span class="hljs-string">"value"</span>' });
      const result = extension.highlightJson(code);
      assert.strictEqual(
        result,
        '<span class="line-number unselectable">1</span><span class="hljs-string">"key"</span>: <span class="hljs-string">"value"</span>',
        'should add line number and preserve highlight.js output'
      );
    });

    test('should highlight search keyword in non-tag content', () => {
      const code = '{"key": "value"}';
      const searchKeyword = 'key';
      sandbox.stub(hljs, 'highlight').returns({ value: '<span class="hljs-string">"key"</span>: <span class="hljs-string">"value"</span>' });
      const result = extension.highlightJson(code, searchKeyword);
      assert.strictEqual(
        result,
        '<span class="line-number unselectable">1</span><span class="hljs-string">"<span class="highlight-match">key</span>"</span>: <span class="hljs-string">"value"</span>',
        'should highlight keyword in non-tag content'
      );
    });

    test('should handle special characters in search keyword', () => {
      const code = '{"key.name": "value"}';
      const searchKeyword = 'key.name';
      sandbox.stub(hljs, 'highlight').returns({ value: '<span class="hljs-string">"key.name"</span>: <span class="hljs-string">"value"</span>' });
      const result = extension.highlightJson(code, searchKeyword);
      assert.strictEqual(
        result,
        '<span class="line-number unselectable">1</span><span class="hljs-string">"<span class="highlight-match">key.name</span>"</span>: <span class="hljs-string">"value"</span>',
        'should escape and highlight special characters in keyword'
      );
    });

    test('should handle multiple lines with keyword highlighting', () => {
      const code = '{\n  "key": "value",\n  "key2": "value"\n}';
      const searchKeyword = 'key';
      sandbox.stub(hljs, 'highlight').returns({
        value: '<span class="hljs-punctuation">{</span>\n  <span class="hljs-string">"key"</span>: <span class="hljs-string">"value"</span>,\n  <span class="hljs-string">"key2"</span>: <span class="hljs-string">"value"</span>\n<span class="hljs-punctuation">}</span>'
      });
      const result = extension.highlightJson(code, searchKeyword);
      const expected = [
        '<span class="line-number unselectable">1</span><span class="hljs-punctuation">{</span>',
        '<span class="line-number unselectable">2</span>  <span class="hljs-string">"<span class="highlight-match">key</span>"</span>: <span class="hljs-string">"value"</span>,',
        '<span class="line-number unselectable">3</span>  <span class="hljs-string">"<span class="highlight-match">key</span>2"</span>: <span class="hljs-string">"value"</span>',
        '<span class="line-number unselectable">4</span><span class="hljs-punctuation">}</span>'
      ].join('\n');
      assert.strictEqual(result, expected, 'should highlight keyword across multiple lines');
    });

    test('should handle empty code input with line number', () => {
      const code = '';
      sandbox.stub(hljs, 'highlight').returns({ value: '' });
      const result = extension.highlightJson(code);
      assert.strictEqual(
        result,
        '<span class="line-number unselectable">1</span>',
        'should return a single line number for empty input'
      );
    });

    test('should handle case-insensitive keyword matching', () => {
      const code = '{"Key": "value"}';
      const searchKeyword = 'key';
      sandbox.stub(hljs, 'highlight').returns({ value: '<span class="hljs-string">"Key"</span>: <span class="hljs-string">"value"</span>' });
      const result = extension.highlightJson(code, searchKeyword);
      assert.strictEqual(
        result,
        '<span class="line-number unselectable">1</span><span class="hljs-string">"<span class="highlight-match">Key</span>"</span>: <span class="hljs-string">"value"</span>',
        'should highlight keyword case-insensitively'
      );
    });

    test('should highlight multiple keyword occurrences in a single line', () => {
      const code = '{"key": "key value"}';
      const searchKeyword = 'key';
      sandbox.stub(hljs, 'highlight').returns({ value: '<span class="hljs-string">"key"</span>: <span class="hljs-string">"key value"</span>' });
      const result = extension.highlightJson(code, searchKeyword);
      assert.strictEqual(
        result,
        '<span class="line-number unselectable">1</span><span class="hljs-string">"<span class="highlight-match">key</span>"</span>: <span class="hljs-string">"<span class="highlight-match">key</span> value"</span>',
        'should highlight all keyword occurrences in non-tag content'
      );
    });

    test('should handle no keyword matches', () => {
      const code = '{"key": "value"}';
      const searchKeyword = 'missing';
      sandbox.stub(hljs, 'highlight').returns({ value: '<span class="hljs-string">"key"</span>: <span class="hljs-string">"value"</span>' });
      const result = extension.highlightJson(code, searchKeyword);
      assert.strictEqual(
        result,
        '<span class="line-number unselectable">1</span><span class="hljs-string">"key"</span>: <span class="hljs-string">"value"</span>',
        'should return highlighted JSON with line number when no keywords match'
      );
    });

    test('should handle empty or null search keyword', () => {
      const code = '{"key": "value"}';
      const searchKeywords = ['', null];
      sandbox.stub(hljs, 'highlight').returns({ value: '<span class="hljs-string">"key"</span>: <span class="hljs-string">"value"</span>' });
      searchKeywords.forEach(searchKeyword => {
        const result = extension.highlightJson(code, searchKeyword);
        assert.strictEqual(
          result,
          '<span class="line-number unselectable">1</span><span class="hljs-string">"key"</span>: <span class="hljs-string">"value"</span>',
          `should return highlighted JSON with line number for ${searchKeyword === '' ? 'empty' : 'null'} search keyword`
        );
      });
    });
  });
});
