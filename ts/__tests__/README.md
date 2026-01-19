# JSON Repair TypeScript Tests

This directory contains comprehensive tests for the TypeScript implementation of json-repair, ported from the original Python test suite.

## Test Files

### Core Functionality Tests

1. **test_json_repair.test.ts** - Main API and integration tests
   - Valid JSON handling
   - Multiple JSON elements
   - Object return mode
   - Skip JSON parse option
   - Stream stable mode
   - Logging functionality

2. **test_parse_string.test.ts** - String parsing tests
   - Basic string parsing
   - Missing and mixed quotes
   - Escape sequences
   - Markdown links
   - LLM code blocks
   - Boolean and null parsing

3. **test_parse_array.test.ts** - Array parsing tests
   - Basic array parsing
   - Malformed arrays
   - Missing commas/brackets
   - Arrays in objects
   - Quoted sections

4. **test_parse_object.test.ts** - Object parsing tests
   - Basic object parsing
   - Malformed objects
   - Missing colons
   - Unquoted keys/values
   - Object merging

5. **test_parse_number.test.ts** - Number parsing tests
   - Integer and float parsing
   - Scientific notation
   - Edge cases (fractions, ranges, etc.)

6. **test_parse_comment.test.ts** - Comment handling tests
   - Line comments (//, #)
   - Block comments (/* */)

7. **test_strict_mode.test.ts** - Strict mode validation tests
   - Duplicate key detection
   - Empty key/value detection
   - Structural validation

8. **test_repair_json_from_file.test.ts** - File I/O tests
   - Reading from files
   - Logging with files
   - Large file handling

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run tests with coverage
```bash
npm run test:coverage
```

### Run a specific test file
```bash
npx jest test_parse_string.test.ts
```

### Run tests matching a pattern
```bash
npx jest --testNamePattern="should handle"
```

## Test Coverage

The test suite covers:

✅ All core parsing functions (string, number, array, object, comment)
✅ Edge cases and malformed JSON
✅ All API functions (repairJson, loads, load, fromFile)
✅ Options (returnObjects, skipJsonParse, logging, streamStable, strict)
✅ Error handling and strict mode validation
✅ File I/O operations

## Test Data Files

- **invalid.json** - Invalid JSON file for testing file repair
- **valid.json** - Valid JSON file for testing file reading

## Comparison with Python Tests

All Python tests have been ported to TypeScript:

| Python Test File | TypeScript Test File | Status |
|-----------------|---------------------|--------|
| test_json_repair.py | test_json_repair.test.ts | ✅ Complete |
| test_parse_string.py | test_parse_string.test.ts | ✅ Complete |
| test_parse_array.py | test_parse_array.test.ts | ✅ Complete |
| test_parse_object.py | test_parse_object.test.ts | ✅ Complete |
| test_parse_number.py | test_parse_number.test.ts | ✅ Complete |
| test_parse_comment.py | test_parse_comment.test.ts | ✅ Complete |
| test_strict_mode.py | test_strict_mode.test.ts | ✅ Complete |
| test_repair_json_from_file.py | test_repair_json_from_file.test.ts | ✅ Complete |
| test_performance.py | - | ⏭️ Skipped (optional) |
| test_repair_json_cli.py | - | ⏭️ Skipped (no CLI yet) |

## Writing New Tests

When adding new tests, follow the existing pattern:

```typescript
import { repairJson } from '../src/index';

describe('Feature name', () => {
  test('should do something specific', () => {
    expect(repairJson('{"broken": "json"}')).toBe('{"broken": "json"}');
  });
});
```

## Test Utilities

Jest provides these useful matchers:

- `toBe()` - Strict equality
- `toEqual()` - Deep equality
- `toThrow()` - Exception checking
- `toHaveProperty()` - Object property checking
- `toBeGreaterThan()` - Numeric comparison

## Debugging Tests

### Run tests with verbose output
```bash
npx jest --verbose
```

### Run only failed tests
```bash
npx jest --onlyFailures
```

### Debug a specific test
```bash
node --inspect-brk node_modules/.bin/jest --runInBand test_parse_string.test.ts
```

Then open Chrome DevTools at `chrome://inspect`

## Coverage Reports

After running `npm run test:coverage`, view the HTML report:

```bash
open coverage/index.html
```

Coverage goals:
- Statements: > 90%
- Branches: > 85%
- Functions: > 90%
- Lines: > 90%

## CI/CD Integration

To integrate with CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run tests
  run: npm test

- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/lcov.info
```

## Troubleshooting

### Tests failing due to TypeScript errors
```bash
npm run build
```

### Tests timing out
Increase Jest timeout in jest.config.js:
```javascript
testTimeout: 10000
```

### File not found errors
Make sure test data files are in the correct location:
```bash
ls __tests__/*.json
```
