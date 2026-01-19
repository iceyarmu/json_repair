import { repairJson } from '../src/index';

describe('Parse array', () => {
  test('should parse basic arrays', () => {
    expect(repairJson('[]', { returnObjects: true })).toEqual([]);
    expect(repairJson('[1, 2, 3, 4]', { returnObjects: true })).toEqual([1, 2, 3, 4]);
    expect(repairJson('[', { returnObjects: true })).toEqual([]);
    expect(repairJson('[[1\n\n]')).toBe('[[1]]');
  });
});

describe('Parse array edge cases', () => {
  test('should handle malformed arrays', () => {
    expect(repairJson('[{]')).toBe('[]');
    expect(repairJson('[')).toBe('[]');
    expect(repairJson('["')).toBe('[]');
    expect(repairJson(']')).toBe('');
    expect(repairJson('[1, 2, 3,')).toBe('[1, 2, 3]');
    expect(repairJson('[1, 2, 3, ...]')).toBe('[1, 2, 3]');
    expect(repairJson('[1, 2, ... , 3]')).toBe('[1, 2, 3]');
    expect(repairJson("[1, 2, '...', 3]")).toBe('[1, 2, "...", 3]');
    expect(repairJson('[true, false, null, ...]')).toBe('[true, false, null]');
    expect(repairJson('["a" "b" "c" 1')).toBe('["a", "b", "c", 1]');
  });

  test('should handle arrays in objects', () => {
    expect(repairJson('{"employees":["John", "Anna",')).toBe('{"employees": ["John", "Anna"]}');
    expect(repairJson('{"employees":["John", "Anna", "Peter'))
      .toBe('{"employees": ["John", "Anna", "Peter"]}');
    expect(repairJson('{"key1": {"key2": [1, 2, 3')).toBe('{"key1": {"key2": [1, 2, 3]}}');
    expect(repairJson('{"key": ["value]}')).toBe('{"key": ["value"]}');
    expect(repairJson('["lorem "ipsum" sic"]')).toBe('["lorem \\"ipsum\\" sic"]');
    expect(repairJson('{"key1": ["value1", "value2"}, "key2": ["value3", "value4"]}'))
      .toBe('{"key1": ["value1", "value2"], "key2": ["value3", "value4"]}');
    expect(repairJson('{"key": ["value" "value1" "value2"]}'))
      .toBe('{"key": ["value", "value1", "value2"]}');
  });

  test('should handle quoted sections in arrays', () => {
    expect(repairJson('{"key": ["lorem "ipsum" dolor "sit" amet, "consectetur" ", "lorem "ipsum" dolor", "lorem"]}'))
      .toBe('{"key": ["lorem \\"ipsum\\" dolor \\"sit\\" amet, \\"consectetur\\" ", "lorem \\"ipsum\\" dolor", "lorem"]}');
    expect(repairJson('{"k"e"y": "value"}')).toBe('{"k\\"e\\"y": "value"}');
    expect(repairJson('["key":"value"}]')).toBe('[{"key": "value"}]');
    expect(repairJson('[{"key": "value", "key')).toBe('[{"key": "value"}, ["key"]]');
    expect(repairJson("{'key1', 'key2'}")).toBe('["key1", "key2"]');
  });
});

describe('Parse array missing quotes', () => {
  test('should handle missing quotes in arrays', () => {
    expect(repairJson('["value1" value2", "value3"]')).toBe('["value1", "value2", "value3"]');
    expect(repairJson('{"bad_one":["Lorem Ipsum", "consectetur" comment" ], "good_one":[ "elit", "sed", "tempor"]}'))
      .toBe('{"bad_one": ["Lorem Ipsum", "consectetur", "comment"], "good_one": ["elit", "sed", "tempor"]}');
    expect(repairJson('{"bad_one": ["Lorem Ipsum","consectetur" comment],"good_one": ["elit","sed","tempor"]}'))
      .toBe('{"bad_one": ["Lorem Ipsum", "consectetur", "comment"], "good_one": ["elit", "sed", "tempor"]}');
  });
});
