# JSON Repair - TypeScript Implementation

A complete TypeScript port of the popular [json-repair](https://github.com/mangiucugna/json_repair) Python library.

This library can fix invalid JSON strings, which is especially useful when dealing with LLM outputs that may have malformed JSON.

**✅ 100% Feature Parity** | **✅ 150+ Tests** | **✅ Fully Type-Safe** | **✅ Production Ready**

## Features

- Fix missing quotes, brackets, and commas
- Handle incomplete arrays and objects
- Auto-complete missing values
- Remove comments from JSON
- Support for streaming/incomplete JSON
- Strict mode for validation

## Installation

```bash
npm install @yarmu/json-repair
```

## Usage

```typescript
import { repairJson, loads } from '@yarmu/json-repair';

// Repair and return as string
const fixed = repairJson('{"name": "John", "age": 30');
console.log(fixed); // '{"name": "John", "age": 30}'

// Repair and parse to object
const obj = loads('{"name": "John", "age": 30');
console.log(obj); // { name: 'John', age: 30 }
```

## API

### `repairJson(jsonStr, options?)`

Repairs a JSON string and returns the fixed JSON string or parsed object.

**Parameters:**
- `jsonStr` (string): The JSON string to repair
- `options` (object, optional):
  - `returnObjects` (boolean): If true, return parsed object instead of string. Default: false
  - `skipJsonParse` (boolean): Skip initial JSON.parse validation. Default: false
  - `logging` (boolean): Return repair log along with result. Default: false
  - `streamStable` (boolean): Keep repairs stable for streaming JSON. Default: false
  - `strict` (boolean): Raise errors instead of repairing certain issues. Default: false

**Returns:** string | JSONReturnType | [JSONReturnType, RepairLog[]]

### `loads(jsonStr, options?)`

Works like `JSON.parse()` but repairs the JSON first.

**Parameters:**
- `jsonStr` (string): The JSON string to parse
- `options` (object, optional):
  - `skipJsonParse` (boolean): Skip initial JSON.parse validation. Default: false
  - `logging` (boolean): Return repair log along with result. Default: false
  - `streamStable` (boolean): Keep repairs stable for streaming JSON. Default: false
  - `strict` (boolean): Raise errors instead of repairing. Default: false

**Returns:** JSONReturnType | [JSONReturnType, RepairLog[]]

### `load(fd, options?)`

Read and repair JSON from a file descriptor.

**Parameters:**
- `fd` (number): File descriptor
- `options` (object, optional): Same as `loads`

**Returns:** JSONReturnType | [JSONReturnType, RepairLog[]]

### `fromFile(filename, options?)`

Read and repair JSON from a file.

**Parameters:**
- `filename` (string): Path to JSON file
- `options` (object, optional): Same as `loads`

**Returns:** JSONReturnType | [JSONReturnType, RepairLog[]]

## Examples

```typescript
import { repairJson, loads } from '@yarmu/json-repair';

// Missing closing brace
repairJson('{"name": "John"'); // '{"name": "John"}'

// Missing quotes
repairJson('{name: "John"}'); // '{"name": "John"}'

// Trailing comma
repairJson('{"name": "John",}'); // '{"name": "John"}'

// With comments
repairJson('{"name": "John" /* comment */}'); // '{"name": "John"}'

// Direct parsing
const obj = loads('{"name": "John", "age": 30');
// Returns: { name: 'John', age: 30 }

// With logging
const [result, log] = repairJson('{"name": "John"', {
  returnObjects: true,
  logging: true
});
console.log(log); // Array of repair operations

// Strict mode (throws on structural issues)
try {
  repairJson('{"key": "value", "key": "duplicate"}', { strict: true });
} catch (e) {
  console.error('Duplicate keys found!');
}
```

## Testing

This project includes a comprehensive test suite with **150+ test cases** covering all functionality.

### Run Tests

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Test Coverage

- **8 test files** covering all modules
- **150+ test cases** ported from Python version
- **>90% code coverage** target
- All edge cases and error conditions tested

For detailed testing information, see [TESTING_GUIDE.md](TESTING_GUIDE.md) and [TEST_SUMMARY.md](TEST_SUMMARY.md).

## Documentation

- [README.md](README.md) - This file
- [QUICKSTART.md](QUICKSTART.md) - Quick start guide
- [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) - Project architecture
- [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) - Implementation details
- [TESTING_GUIDE.md](TESTING_GUIDE.md) - Testing instructions
- [TEST_SUMMARY.md](TEST_SUMMARY.md) - Test coverage details
- [COMPLETE_SUMMARY.md](COMPLETE_SUMMARY.md) - Complete project summary

## License

MIT

## Credits

This is a TypeScript port of the Python [json-repair](https://github.com/mangiucugna/json_repair) library by Stefano Baccianella.
