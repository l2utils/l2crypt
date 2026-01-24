# l2crypt

Lineage 2 cryptography library and CLI tool. This library provides asynchronous decoding for Lineage 2 files, specifically focusing on version 413 (RSA + Zlib).

## Features

- **Asynchronous I/O**: Efficient file reading and writing using `node:fs/promises`.
- **RSA Decryption**: Robust implementation of the RSA algorithm used in Lineage 2 version 413.
- **Zlib Decompression**: Automatic decompression of decoded file blocks.
- **CLI Tool**: Easy-to-use command-line interface powered by `commander`.
- **100% Test Coverage**: Fully verified core logic with Jest.
- **CI/CD Built-in**: GitHub Actions workflow for automated testing.

## Installation

```bash
npm install
```

## Usage

### Command Line Interface

You can run the tool using `ts-node`:

```bash
# Decode to a specific file
npx ts-node src/index.ts -i in/L2.ini -o out/L2.ini

# Decode and output to stdout
npx ts-node src/index.ts in/L2.ini > decoded.ini

# Display help
npx ts-node src/index.ts --help
```

#### Options

- `-i, --input <path>`: Path to the input file.
- `-o, --output <path>`: Path to the output file (optional, defaults to `stdout`).
- `-V, --version`: Output the version number.
- `-h, --help`: Display help information.

## Development

### Running Tests

To run the unit test suite:

```bash
npm test
```

### Coverage Report

To generate and view the test coverage report (100% coverage is enforced):

```bash
npm run test:coverage
```

### CI/CD

The project includes a GitHub Actions workflow in `.github/workflows/test.yml` that automatically runs tests on every push and pull request to the `main` branch.

## License

MIT
