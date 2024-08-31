# @epdoc/fsutil

Async File System utilities for Node.js

## Description

@epdoc/fsutil is a powerful and flexible Node.js package that provides asynchronous file system utilities. It offers an intuitive API for working with files and directories, including operations like reading, writing, copying, and moving files, as well as directory management and file type detection.

## Key Features

1. Asynchronous file operations
2. Directory management
3. File type detection (including PDF, XML, JSON, and more)
4. File comparison and checksums
5. JSON reading and writing with deep copy support
6. Base64 encoding/decoding support
7. Flexible sorting options for files and directories
8. PDF metadata extraction

## Installation

To install @epdoc/fsutil, run the following command in your project directory:

```bash
npm install @epdoc/fsutil
```

## Usage

Here's an example of how to use @epdoc/fsutil to read a JSON file:

```javascript
const { fsitem } = require('@epdoc/fsutil');
// Check if a directory exists
if (await fsitem('~/.ssh').isDir()) {
  console.log('SSH directory exists');
}
// Read a JSON file
const config = await fsitem('config.json').readJson();
// Write to a file
await fsitem('output.txt').write('Hello, World!');
// Copy a file safely
await fsitem('source.txt').safeCopy('destination.txt');
```


## API Overview

### Main Classes

- `FSItem`: Core class for file system operations
  - Methods for file/directory operations (e.g., `isFile()`, `isDir()`, `getStats()`)
  - File content operations (e.g., `readAsBuffer()`, `readAsString()`, `readJson()`)
  - File manipulation (e.g., `write()`, `safeCopy()`, `backup()`)
  - Directory operations (e.g., `getChildren()`, `getFiles()`, `getFolders()`)
  - Sorting methods (e.g., `sortChildren()`, `sortFiles()`, `sortFilesBySize()`)

- `FSBytes`: Class for working with file bytes and detecting file types
  - Methods for file type detection (e.g., `getType()`, `getCategory()`)
  - Utility methods for byte manipulation and comparison

- `FSStats`: Extended class for file statistics
  - Provides additional methods on top of Node.js's `fs.Stats`

### Factory Functions

- `fsitem(path: string): FSItem`: Creates an FSItem instance for the given path
- `fsbytes(buffer: Buffer): FSBytes`: Creates an FSBytes instance for the given buffer

### Types and Interfaces

- `FileType`: Enum for various file types
- `FileCategory`: Enum for file categories
- `FSSortOpts`: Interface for sorting options
- `SafeCopyOpts`: Interface for safe copy options
- `FileConflictStrategy`: Type for handling file conflicts

For detailed API documentation and usage examples, please refer to the JSDoc comments in the source code of each class and function.

## Development

To set up the development environment:

1. Clone the repository:
   ```bash
   git clone https://github.com/epdoc/fsutil.git
   ```
2. Install dependencies:
   ```bash
   cd fsutil
   npm install
   ```
3. Build the project:
   ```bash
   npm run build
   ```
4. Run tests:
   ```bash
   npm test
   ```

To check for the latest version of dependencies, use `npm-check -u` (must be installed globally).

## License

[Insert license information here]

## Contributing

Contributions are not whole heartedly welcome yet, as I am still developing this
mostly for personal use! Please feel free to submit a Pull Request.

## Support

If you encounter any problems or have any questions, please open an issue on the GitHub repository.


