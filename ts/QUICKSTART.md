# Quick Start Guide

## Installation

```bash
cd ts
npm install
```

## Build

```bash
npm run build
```

This will compile TypeScript to JavaScript in the `dist/` directory.

## Basic Usage

### 1. Import the library

```typescript
import { repairJson, loads } from './src/index';
// or after publishing to npm:
// import { repairJson, loads } from '@yarmu/json-repair';
```

### 2. Repair JSON string

```typescript
const brokenJson = '{"name": "John", "age": 30';
const fixedJson = repairJson(brokenJson);
console.log(fixedJson);
// Output: {"name": "John", "age": 30}
```

### 3. Parse to object directly

```typescript
const brokenJson = '{"name": "John", "age": 30';
const obj = loads(brokenJson);
console.log(obj);
// Output: { name: 'John', age: 30 }
```

## Common Use Cases

### Fix missing quotes

```typescript
repairJson('{name: "John"}');
// {"name": "John"}
```

### Fix missing brackets

```typescript
repairJson('{"items": [1, 2, 3');
// {"items": [1, 2, 3]}
```

### Remove comments

```typescript
repairJson('{"name": "John" /* comment */}');
// {"name": "John"}
```

### Fix trailing commas

```typescript
repairJson('{"name": "John",}');
// {"name": "John"}
```

## Advanced Options

### With logging

```typescript
const [result, log] = repairJson('{"broken": "json"', {
  returnObjects: true,
  logging: true
}) as [any, any];

console.log('Result:', result);
console.log('Repairs made:', log);
```

### Strict mode

```typescript
try {
  repairJson('{"key": "value", "key": "duplicate"}', { strict: true });
} catch (e) {
  console.error('Invalid JSON:', e.message);
}
```

### Stream stable mode

```typescript
// For streaming/incomplete JSON
const streamJson = '{"key": "val\\';
const fixed = repairJson(streamJson, { streamStable: true });
```

## Run Examples

```bash
# Build first
npm run build

# Run examples
node dist/examples/usage.js
```

## Next Steps

- Read [README.md](README.md) for complete API documentation
- Check [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) for architecture details
- See [examples/usage.ts](examples/usage.ts) for more examples
- Review [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) for implementation details

## Troubleshooting

### "Cannot find module" error
Make sure you've run `npm run build` first.

### Type errors
Make sure you have TypeScript 5.0+ installed:
```bash
npm install --save-dev typescript@^5.0.0
```

### File not found
Make sure you're in the `ts/` directory when running commands.

## Need Help?

- Check the examples in `examples/usage.ts`
- Review the Python documentation (same functionality)
- Open an issue on GitHub
