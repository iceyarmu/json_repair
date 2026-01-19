import { repairJson } from '../src/index';

describe('Parse string', () => {
  test('should handle basic string parsing', () => {
    expect(repairJson('"')).toBe('');
    expect(repairJson('\n')).toBe('');
    expect(repairJson(' ')).toBe('');
    expect(repairJson('string')).toBe('');
    expect(repairJson('stringbeforeobject {}')).toBe('{}');
  });
});

describe('Missing and mixed quotes', () => {
  test('should fix missing and mixed quotes', () => {
    expect(repairJson('{"key": "string", "key2": false, "key3": null, "key4": unquoted}'))
      .toBe('{"key": "string", "key2": false, "key3": null, "key4": "unquoted"}');
    expect(repairJson('{"name": "John", "age": 30, "city": "New York'))
      .toBe('{"name": "John", "age": 30, "city": "New York"}');
    expect(repairJson('{"name": "John", "age": 30, city: "New York"}'))
      .toBe('{"name": "John", "age": 30, "city": "New York"}');
    expect(repairJson('{"name": "John", "age": 30, "city": New York}'))
      .toBe('{"name": "John", "age": 30, "city": "New York"}');
    expect(repairJson('{"name": John, "age": 30, "city": "New York"}'))
      .toBe('{"name": "John", "age": 30, "city": "New York"}');
    expect(repairJson('{"slanted_delimiter": "value"}'))
      .toBe('{"slanted_delimiter": "value"}');
    expect(repairJson('{"name": "John", "age": 30, "city": "New'))
      .toBe('{"name": "John", "age": 30, "city": "New"}');
    expect(repairJson('{"name": "John", "age": 30, "city": "New York, "gender": "male"}'))
      .toBe('{"name": "John", "age": 30, "city": "New York", "gender": "male"}');
  });

  test('should handle complex quote issues', () => {
    expect(repairJson('[{"key": "value", COMMENT "notes": "lorem "ipsum", sic." }]'))
      .toBe('[{"key": "value", "notes": "lorem \\"ipsum\\", sic."}]');
    expect(repairJson('{"key": ""value"}')).toBe('{"key": "value"}');
    expect(repairJson('{"key": "value", 5: "value"}')).toBe('{"key": "value", "5": "value"}');
    expect(repairJson('{"foo": "\\"bar\\""}')).toBe('{"foo": "\\"bar\\""}');
    expect(repairJson('{"" key":"val"}')).toBe('{" key": "val"}');
    expect(repairJson('{"key": value "key2" : "value2" '))
      .toBe('{"key": "value", "key2": "value2"}');
    expect(repairJson('{"key": "lorem ipsum ... "sic " tamet. ...}'))
      .toBe('{"key": "lorem ipsum ... \\"sic \\" tamet. ..."}');
    expect(repairJson('{"key": value , }')).toBe('{"key": "value"}');
    expect(repairJson('{"comment": "lorem, "ipsum" sic "tamet". To improve"}'))
      .toBe('{"comment": "lorem, \\"ipsum\\" sic \\"tamet\\". To improve"}');
    expect(repairJson('{"key": "v"alu"e"} key:')).toBe('{"key": "v\\"alu\\"e"}');
    expect(repairJson('{"key": "v"alue", "key2": "value2"}'))
      .toBe('{"key": "v\\"alue", "key2": "value2"}');
    expect(repairJson('[{"key": "v"alu,e", "key2": "value2"}]'))
      .toBe('[{"key": "v\\"alu,e", "key2": "value2"}]');
  });
});

describe('Escaping', () => {
  test('should handle escape sequences', () => {
    expect(repairJson('\'"\'')). toBe('');
    expect(repairJson('{"key": \'string"\n\t\\le\'}')).toBe('{"key": "string\\"\\n\\t\\\\le"}');
    expect(repairJson(String.raw`{"real_content": "Some string: Some other string \t Some string <a href=\"https://domain.com\">Some link</a>"}`))
      .toBe(String.raw`{"real_content": "Some string: Some other string \t Some string <a href=\"https://domain.com\">Some link</a>"}`);
    expect(repairJson('{"key_1\n": "value"}')).toBe('{"key_1": "value"}');
    expect(repairJson('{"key\t_": "value"}')).toBe('{"key\\t_": "value"}');
    expect(repairJson('{"key": "value"}')).toBe('{"key": "value"}');
    expect(repairJson('{"key": "\\u0076\\u0061\\u006C\\u0075\\u0065"}', { skipJsonParse: true }))
      .toBe('{"key": "value"}');
    expect(repairJson('{"key": "valu\\\'e"}')).toBe('{"key": "valu\'e"}');
    expect(repairJson('{"key": "{\\"key\\": 1, \\"key2\\": 1}"}'))
      .toBe('{"key": "{\\"key\\": 1, \\"key2\\": 1}"}');
  });
});

describe('Markdown', () => {
  test('should handle markdown links', () => {
    expect(repairJson('{ "content": "[LINK]("https://google.com")" }'))
      .toBe('{"content": "[LINK](\\"https://google.com\\")"}');
    expect(repairJson('{ "content": "[LINK](" }')).toBe('{"content": "[LINK]("}');
    expect(repairJson('{ "content": "[LINK](", "key": true }'))
      .toBe('{"content": "[LINK](", "key": true}');
  });
});

describe('Leading/trailing characters', () => {
  test('should handle leading/trailing characters', () => {
    expect(repairJson('````{ "key": "value" }```')).toBe('{"key": "value"}');
    expect(repairJson('{    "a": "",    "b": [ { "c": 1} ] \n}```'))
      .toBe('{"a": "", "b": [{"c": 1}]}');
    expect(repairJson('Based on the information extracted, here is the filled JSON output: ```json { "a": "b" } ```'))
      .toBe('{"a": "b"}');
    expect(repairJson(`
      The next 64 elements are:
      \`\`\`json
      { "key": "value" }
      \`\`\`
    `)).toBe('{"key": "value"}');
  });
});

describe('String JSON LLM block', () => {
  test('should handle code blocks in strings', () => {
    expect(repairJson('{"key": "``"}')).toBe('{"key": "``"}');
    expect(repairJson('{"key": "```json"}')).toBe('{"key": "```json"}');
    expect(repairJson('{"key": "```json {"key": [{"key1": 1},{"key2": 2}]}```"}'))
      .toBe('{"key": {"key": [{"key1": 1}, {"key2": 2}]}}');
    expect(repairJson('{"response": "```json{}"}')).toBe('{"response": "```json{}"}');
  });
});

describe('Parse boolean or null', () => {
  test('should parse boolean and null values', () => {
    expect(repairJson('True', { returnObjects: true })).toBe('');
    expect(repairJson('False', { returnObjects: true })).toBe('');
    expect(repairJson('Null', { returnObjects: true })).toBe('');
    expect(repairJson('true', { returnObjects: true })).toBe(true);
    expect(repairJson('false', { returnObjects: true })).toBe(false);
    expect(repairJson('null', { returnObjects: true })).toBe(null);
    expect(repairJson('  {"key": true, "key2": false, "key3": null}'))
      .toBe('{"key": true, "key2": false, "key3": null}');
    expect(repairJson('{"key": TRUE, "key2": FALSE, "key3": Null}   '))
      .toBe('{"key": true, "key2": false, "key3": null}');
  });
});
