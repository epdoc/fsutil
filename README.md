# epdoc/fsutil

Async File System utilities.


# Clients

```bash
npm install @epdoc/fsutil
```

```ts
import { fsitem } from '@epdoc/fsutil';

if( fsitem('~/.ssh').isDir() ) {
  console.log('SSH is installed');
}
```


# Developers

```bash
git clone git+https://github.com/epdoc/fsutil.git
cd fsutil
npm install
npm run build
npm test
```

Check for latest version using `npm-check -u`, which must be installed globally.

# Methods

## readJson

Read a JSON file.

## deepReadJson

Read a JSON file that may 'include' other JSON files.

## Test for file type (new in 4.1.1)

Use FSBytes class to look at the first few bytes of a file to determine it's type.

```ts
const fs:FSItem = new FSItem('/path/to/file.pdf');
const isPdf = fs.getBytes().isPdf();
```