import { repairJson } from '../src/index';

describe('Parse number', () => {
  test('should parse basic numbers', () => {
    expect(repairJson('1', { returnObjects: true })).toBe(1);
    expect(repairJson('1.2', { returnObjects: true })).toBe(1.2);
    expect(repairJson('{"value": 82461110}', { returnObjects: true })).toEqual({ value: 82461110 });
    expect(repairJson('{"value": 1234.56}', { returnObjects: true })).toEqual({ value: 1234.56 });
  });
});

describe('Parse number edge cases', () => {
  test('should handle number edge cases', () => {
    expect(repairJson(' - { "test_key": ["test_value", "test_value2"] }'))
      .toBe('{"test_key": ["test_value", "test_value2"]}');
    expect(repairJson('{"key": 1/3}')).toBe('{"key": "1/3"}');
    expect(repairJson('{"key": .25}')).toBe('{"key": 0.25}');
    expect(repairJson('{"here": "now", "key": 1/3, "foo": "bar"}'))
      .toBe('{"here": "now", "key": "1/3", "foo": "bar"}');
    expect(repairJson('{"key": 12345/67890}')).toBe('{"key": "12345/67890"}');
    expect(repairJson('[105,12')).toBe('[105, 12]');
    expect(repairJson('{"key", 105,12,')).toBe('{"key": "105,12"}');
    expect(repairJson('{"key": 1/3, "foo": "bar"}')).toBe('{"key": "1/3", "foo": "bar"}');
    expect(repairJson('{"key": 10-20}')).toBe('{"key": "10-20"}');
    expect(repairJson('{"key": 1.1.1}')).toBe('{"key": "1.1.1"}');
    expect(repairJson('[- ')).toBe('[]');
    expect(repairJson('{"key": 1. }')).toBe('{"key": 1.0}');
    expect(repairJson('{"key": 1e10 }')).toBe('{"key": 10000000000.0}');
    expect(repairJson('{"key": 1e }')).toBe('{"key": 1}');
    expect(repairJson('{"key": 1notanumber }')).toBe('{"key": "1notanumber"}');
    expect(repairJson('[1, 2notanumber]')).toBe('[1, "2notanumber"]');
  });
});
