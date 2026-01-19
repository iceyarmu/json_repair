import * as path from 'path';
import * as fs from 'fs';
import { fromFile } from '../src/index';

describe('Repair JSON from file', () => {
  test('should read and repair JSON from file', () => {
    const filepath = path.join(__dirname, 'invalid.json');
    const result = fromFile(filepath);

    expect(Array.isArray(result)).toBe(true);
    if (Array.isArray(result)) {
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('_id');
      expect(result[0]).toHaveProperty('name');
    }
  });

  test('should handle logging with file input', () => {
    const tmpPath = path.join(__dirname, 'temp_test.json');
    fs.writeFileSync(tmpPath, '{key:value}');

    try {
      const [result, log] = fromFile(tmpPath, { logging: true }) as [any, any];
      expect(result).toEqual({ key: 'value' });
      expect(log.length).toBeGreaterThan(0);
      expect(log[0]).toHaveProperty('text');
      expect(log[0]).toHaveProperty('context');
    } finally {
      fs.unlinkSync(tmpPath);
    }
  });

  test('should handle large file', () => {
    const tmpPath = path.join(__dirname, 'temp_large.json');
    const largeContent = 'x'.repeat(5 * 1024 * 1024); // 5 MB
    fs.writeFileSync(tmpPath, largeContent);

    try {
      const [result, log] = fromFile(tmpPath, { logging: true }) as [any, any];
      expect(result).toBe('');
      expect(log).toEqual([]);
    } finally {
      fs.unlinkSync(tmpPath);
    }
  });
});
