import { repairJson } from '../src/index';

describe('Strict mode', () => {
  test('should reject multiple top-level values', () => {
    expect(() => {
      repairJson('{"key":"value"}["value"]', { strict: true });
    }).toThrow(/Multiple top-level JSON elements/);
  });

  test('should reject duplicate keys inside array', () => {
    const payload = '[{"key": "first", "key": "second"}]';
    expect(() => {
      repairJson(payload, { strict: true, skipJsonParse: true });
    }).toThrow(/Duplicate key found/);
  });

  test('should reject empty keys', () => {
    const payload = '{"" : "value"}';
    expect(() => {
      repairJson(payload, { strict: true, skipJsonParse: true });
    }).toThrow(/Empty key found/);
  });

  test('should require colon between key and value', () => {
    expect(() => {
      repairJson('{"missing" "colon"}', { strict: true });
    }).toThrow(/Missing ':' after key/);
  });

  test('should reject empty values', () => {
    const payload = '{"key": , "key2": "value2"}';
    expect(() => {
      repairJson(payload, { strict: true, skipJsonParse: true });
    }).toThrow(/Parsed value is empty/);
  });

  test('should reject empty object with extra characters', () => {
    expect(() => {
      repairJson('{"dangling"}', { strict: true });
    }).toThrow(/Parsed object is empty/);
  });

  test('should detect immediate doubled quotes', () => {
    expect(() => {
      repairJson('{"key": """"}', { strict: true });
    }).toThrow(/doubled quotes followed by another quote/);
  });

  test('should detect doubled quotes followed by string', () => {
    expect(() => {
      repairJson('{"key": "" "value"}', { strict: true });
    }).toThrow(/doubled quotes followed by another quote while parsing a string/);
  });
});
