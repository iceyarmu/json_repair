import { repairJson } from '../src/index';

describe('Parse comment', () => {
  test('should handle single slash', () => {
    expect(repairJson('/')).toBe('');
  });

  test('should remove comments from JSON', () => {
    expect(repairJson('/* comment */ {"key": "value"}'));
    expect(repairJson('{ "key": { "key2": "value2" // comment }, "key3": "value3" }'))
      .toBe('{"key": {"key2": "value2"}, "key3": "value3"}');
    expect(repairJson('{ "key": { "key2": "value2" # comment }, "key3": "value3" }'))
      .toBe('{"key": {"key2": "value2"}, "key3": "value3"}');
    expect(repairJson('{ "key": { "key2": "value2" /* comment */ }, "key3": "value3" }'))
      .toBe('{"key": {"key2": "value2"}, "key3": "value3"}');
    expect(repairJson('[ "value", /* comment */ "value2" ]')).toBe('["value", "value2"]');
    expect(repairJson('{ "key": "value" /* comment')).toBe('{"key": "value"}');
  });
});
