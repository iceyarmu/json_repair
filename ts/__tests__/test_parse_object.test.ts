import { repairJson } from '../src/index';

describe('Parse object', () => {
  test('should parse basic objects', () => {
    expect(repairJson('{}', { returnObjects: true })).toEqual({});
    expect(repairJson('{ "key": "value", "key2": 1, "key3": true }', { returnObjects: true }))
      .toEqual({ key: 'value', key2: 1, key3: true });
    expect(repairJson('{', { returnObjects: true })).toEqual({});
    expect(repairJson('{ "key": value, "key2": 1 "key3": null }', { returnObjects: true }))
      .toEqual({ key: 'value', key2: 1, key3: null });
    expect(repairJson('   {  }   ')).toBe('{}');
    expect(repairJson('{')).toBe('{}');
    expect(repairJson('}')).toBe('');
    expect(repairJson('{"')).toBe('{}');
  });
});

describe('Parse object edge cases', () => {
  test('should handle malformed objects', () => {
    expect(repairJson('{foo: [}')).toBe('{"foo": []}');
    expect(repairJson('{"": "value"')).toBe('{"": "value"}');
    expect(repairJson('{"key": "v"alue"}')).toBe('{"key": "v\\"alue\\""}');
    expect(repairJson('{"value_1": true, COMMENT "value_2": "data"}'))
      .toBe('{"value_1": true, "value_2": "data"}');
    expect(repairJson('{"value_1": true, SHOULD_NOT_EXIST "value_2": "data" AAAA }'))
      .toBe('{"value_1": true, "value_2": "data"}');
    expect(repairJson('{"" : true, "key2": "value2"}')).toBe('{"": true, "key2": "value2"}');
  });

  test('should handle complex quote issues in objects', () => {
    expect(repairJson('{""answer"":[{""traits":\'\'Female aged 60+\'\',""answer1"":""5""}]}'))
      .toBe('{"answer": [{"traits": "Female aged 60+", "answer1": "5"}]}');
    expect(repairJson('{ "words": abcdef", "numbers": 12345", "words2": ghijkl" }'))
      .toBe('{"words": "abcdef", "numbers": 12345, "words2": "ghijkl"}');
    expect(repairJson('{"number": 1,"reason": "According...""ans": "YES"}'))
      .toBe('{"number": 1, "reason": "According...", "ans": "YES"}');
    expect(repairJson('{ "a" : "{ b": {} }" }')).toBe('{"a": "{ b"}');
    expect(repairJson('{"b": "xxxxx" true}')).toBe('{"b": "xxxxx"}');
    expect(repairJson('{"key": "Lorem "ipsum" s,"}')).toBe('{"key": "Lorem \\"ipsum\\" s,"}');
    expect(repairJson('{"lorem": ipsum, sic, datum.",}')).toBe('{"lorem": "ipsum, sic, datum."}');
  });

  test('should handle unquoted values', () => {
    expect(repairJson('{"lorem": sic tamet. "ipsum": sic tamet, quick brown fox. "sic": ipsum}'))
      .toBe('{"lorem": "sic tamet.", "ipsum": "sic tamet", "sic": "ipsum"}');
    expect(repairJson('{"lorem_ipsum": "sic tamet, quick brown fox. }'))
      .toBe('{"lorem_ipsum": "sic tamet, quick brown fox."}');
    expect(repairJson('{"key":value, " key2":"value2" }')).toBe('{"key": "value", " key2": "value2"}');
    expect(repairJson('{"key":value "key2":"value2" }')).toBe('{"key": "value", "key2": "value2"}');
    expect(repairJson("{'text': 'words{words in brackets}more words'}"))
      .toBe('{"text": "words{words in brackets}more words"}');
    expect(repairJson('{text:words{words in brackets}}')).toBe('{"text": "words{words in brackets}"}');
    expect(repairJson('{text:words{words in brackets}m}')).toBe('{"text": "words{words in brackets}m"}');
  });

  test('should handle code fences and special cases', () => {
    expect(repairJson('{"key": "value, value2"```')).toBe('{"key": "value, value2"}');
    expect(repairJson('{"key": "value}```')).toBe('{"key": "value"}');
    expect(repairJson('{key:value,key2:value2}')).toBe('{"key": "value", "key2": "value2"}');
    expect(repairJson('{"key:"value"}')).toBe('{"key": "value"}');
    expect(repairJson('{"key:value}')).toBe('{"key": "value"}');
    expect(repairJson('[{"lorem": {"ipsum": "sic"}, """" "lorem": {"ipsum": "sic"}]'))
      .toBe('[{"lorem": {"ipsum": "sic"}}, {"lorem": {"ipsum": "sic"}}]');
  });

  test('should handle array merging in objects', () => {
    expect(repairJson('{ "key": ["arrayvalue"], ["arrayvalue1"], ["arrayvalue2"], "key3": "value3" }'))
      .toBe('{"key": ["arrayvalue", "arrayvalue1", "arrayvalue2"], "key3": "value3"}');
    expect(repairJson('{ "key": ["arrayvalue"], "key3": "value3", ["arrayvalue1"] }'))
      .toBe('{"key": ["arrayvalue"], "key3": "value3", "arrayvalue1": ""}');
    expect(repairJson('{"key": "{\\\\"key\\\\\\":[\\"value\\\\\\"],\\"key2\\":"value2"}"}'))
      .toBe('{"key": "{\\"key\\":[\\"value\\"],\\"key2\\":\\"value2\\"}"}');
    expect(repairJson('{"key": , "key2": "value2"}')).toBe('{"key": "", "key2": "value2"}');
    expect(repairJson('{"array":[{"key": "value"], "key2": "value2"}'))
      .toBe('{"array": [{"key": "value"}], "key2": "value2"}');
    expect(repairJson('[{"key":"value"}},{"key":"value"}]'))
      .toBe('[{"key": "value"}, {"key": "value"}]');
  });
});

describe('Parse object merge at the end', () => {
  test('should merge objects after closing brace', () => {
    expect(repairJson('{"key": "value"}, "key2": "value2"}'))
      .toBe('{"key": "value", "key2": "value2"}');
    expect(repairJson('{"key": "value"}, "key2": }')).toBe('{"key": "value", "key2": ""}');
    expect(repairJson('{"key": "value"}, []')).toBe('{"key": "value"}');
    expect(repairJson('{"key": "value"}, ["abc"]')).toBe('[{"key": "value"}, ["abc"]]');
    expect(repairJson('{"key": "value"}, {}')).toBe('{"key": "value"}');
    expect(repairJson('{"key": "value"}, "" : "value2"}')).toBe('{"key": "value", "": "value2"}');
    expect(repairJson('{"key": "value"}, "key2" "value2"}')).toBe('{"key": "value", "key2": "value2"}');
    expect(repairJson('{"key1": "value1"}, "key2": "value2", "key3": "value3"}'))
      .toBe('{"key1": "value1", "key2": "value2", "key3": "value3"}');
  });
});
