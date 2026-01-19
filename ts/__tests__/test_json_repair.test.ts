import { repairJson, loads } from '../src/index';

describe('Valid JSON', () => {
  test('should handle valid JSON without changes', () => {
    expect(repairJson('{"name": "John", "age": 30, "city": "New York"}'))
      .toBe('{"name": "John", "age": 30, "city": "New York"}');
    expect(repairJson('{"employees":["John", "Anna", "Peter"]} '))
      .toBe('{"employees": ["John", "Anna", "Peter"]}');
    expect(repairJson('{"key": "value:value"}')).toBe('{"key": "value:value"}');
    expect(repairJson('{"text": "The quick brown fox,"}')).toBe('{"text": "The quick brown fox,"}');
    expect(repairJson('{"text": "The quick brown fox won\'t jump"}')).toBe('{"text": "The quick brown fox won\'t jump"}');
    expect(repairJson('{"key": ""')).toBe('{"key": ""}');
    expect(repairJson('{"key1": {"key2": [1, 2, 3]}}')).toBe('{"key1": {"key2": [1, 2, 3]}}');
    expect(repairJson('{"key": 12345678901234567890}')).toBe('{"key": 12345678901234567890}');
    expect(repairJson('{"key": "value☺"}')).toBe('{"key": "value\\u263a"}');
    expect(repairJson('{"key": "value\\nvalue"}')).toBe('{"key": "value\\nvalue"}');
  });
});

describe('Multiple JSONs', () => {
  test('should handle multiple JSON elements', () => {
    expect(repairJson('[]{}'))  .toBe('[]');
    expect(repairJson('[]{"key":"value"}')).toBe('{"key": "value"}');
    expect(repairJson('{"key":"value"}[1,2,3,true]')).toBe('[{"key": "value"}, [1, 2, 3, true]]');
    expect(repairJson('lorem ```json {"key":"value"} ``` ipsum ```json [1,2,3,true] ``` 42'))
      .toBe('[{"key": "value"}, [1, 2, 3, true]]');
    expect(repairJson('[{"key":"value"}][{"key":"value_after"}]')).toBe('[{"key": "value_after"}]');
  });
});

describe('Repair JSON with objects', () => {
  test('should return objects when returnObjects is true', () => {
    expect(repairJson('[]', { returnObjects: true })).toEqual([]);
    expect(repairJson('{}', { returnObjects: true })).toEqual({});
    expect(repairJson('{"key": true, "key2": false, "key3": null}', { returnObjects: true }))
      .toEqual({ key: true, key2: false, key3: null });
    expect(repairJson('{"name": "John", "age": 30, "city": "New York"}', { returnObjects: true }))
      .toEqual({ name: 'John', age: 30, city: 'New York' });
    expect(repairJson('[1, 2, 3, 4]', { returnObjects: true })).toEqual([1, 2, 3, 4]);
    expect(repairJson('{"employees":["John", "Anna", "Peter"]} ', { returnObjects: true }))
      .toEqual({ employees: ['John', 'Anna', 'Peter'] });
  });

  test('should handle complex nested structures', () => {
    const input = `{
  "resourceType": "Bundle",
  "id": "1",
  "type": "collection",
  "entry": [
    {
      "resource": {
        "resourceType": "Patient",
        "id": "1",
        "name": [
          {"use": "official", "family": "Corwin", "given": ["Keisha", "Sunny"], "prefix": ["Mrs."},
          {"use": "maiden", "family": "Goodwin", "given": ["Keisha", "Sunny"], "prefix": ["Mrs."]}
        ]
      }
    }
  ]
}`;
    expect(repairJson(input, { returnObjects: true })).toEqual({
      resourceType: 'Bundle',
      id: '1',
      type: 'collection',
      entry: [
        {
          resource: {
            resourceType: 'Patient',
            id: '1',
            name: [
              {
                use: 'official',
                family: 'Corwin',
                given: ['Keisha', 'Sunny'],
                prefix: ['Mrs.'],
              },
              {
                use: 'maiden',
                family: 'Goodwin',
                given: ['Keisha', 'Sunny'],
                prefix: ['Mrs.'],
              },
            ],
          },
        },
      ],
    });
  });

  test('should handle HTML in JSON', () => {
    expect(repairJson(
      '{\n"html": "<h3 id="aaa">Waarom meer dan 200 Technical Experts - "Passie voor techniek"?</h3>"}',
      { returnObjects: true }
    )).toEqual({ html: '<h3 id="aaa">Waarom meer dan 200 Technical Experts - "Passie voor techniek"?</h3>' });
  });

  test('should handle quoted sections in arrays', () => {
    const input = `[
  {
    "foo": "Foo bar baz",
    "tag": "#foo-bar-baz"
  },
  {
    "foo": "foo bar "foobar" foo bar baz.",
    "tag": "#foo-bar-foobar"
  }
]`;
    expect(repairJson(input, { returnObjects: true })).toEqual([
      { foo: 'Foo bar baz', tag: '#foo-bar-baz' },
      { foo: 'foo bar "foobar" foo bar baz.', tag: '#foo-bar-foobar' },
    ]);
  });
});

describe('Skip JSON loads', () => {
  test('should work with skipJsonParse option', () => {
    expect(repairJson('{"key": true, "key2": false, "key3": null}', { skipJsonParse: true }))
      .toBe('{"key": true, "key2": false, "key3": null}');
    expect(repairJson('{"key": true, "key2": false, "key3": null}', { returnObjects: true, skipJsonParse: true }))
      .toEqual({ key: true, key2: false, key3: null });
    expect(repairJson('{"key": true, "key2": false, "key3": }', { skipJsonParse: true }))
      .toBe('{"key": true, "key2": false, "key3": ""}');
    expect(loads('{"key": true, "key2": false, "key3": }', { skipJsonParse: true }))
      .toEqual({ key: true, key2: false, key3: '' });
  });
});

describe('Stream stable mode', () => {
  test('should handle stream stable mode correctly', () => {
    // Default: stream_stable = false
    expect(repairJson('{"key": "val\\', { streamStable: false })).toBe('{"key": "val\\\\"}');
    expect(repairJson('{"key": "val\\n', { streamStable: false })).toBe('{"key": "val"}');
    expect(repairJson('{"key": "val\\n123,`key2:value2', { streamStable: false }))
      .toBe('{"key": "val\\n123", "key2": "value2"}');
    expect(repairJson('{"key": "val\\n123,`key2:value2`"}', { streamStable: true }))
      .toBe('{"key": "val\\n123,`key2:value2`"}');

    // stream_stable = true
    expect(repairJson('{"key": "val\\', { streamStable: true })).toBe('{"key": "val"}');
    expect(repairJson('{"key": "val\\n', { streamStable: true })).toBe('{"key": "val\\n"}');
    expect(repairJson('{"key": "val\\n123,`key2:value2', { streamStable: true }))
      .toBe('{"key": "val\\n123,`key2:value2"}');
    expect(repairJson('{"key": "val\\n123,`key2:value2`"}', { streamStable: true }))
      .toBe('{"key": "val\\n123,`key2:value2`"}');
  });
});

describe('Logging', () => {
  test('should return logs when logging is enabled', () => {
    const [result, log] = repairJson('{}', { logging: true }) as [any, any];
    expect(result).toEqual({});
    expect(log).toEqual([]);

    const [result2, log2] = repairJson('{"key": "value}', { logging: true }) as [any, any];
    expect(result2).toEqual({ key: 'value' });
    expect(log2.length).toBeGreaterThan(0);
    expect(log2[0]).toHaveProperty('text');
    expect(log2[0]).toHaveProperty('context');
  });
});
