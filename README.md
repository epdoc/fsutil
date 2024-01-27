# epdoc/fsutil

Async File System utilities.


# Clients

```bash
npm install @epdoc/fsutil
```

```ts
import { futil } from '@epdoc/fsutil';

if( fsutil('~/.ssh').isDir() ) {
  console.log('SSH is installed');
}
```


# Developers

```bash
npm install
npm run build
npm test
```

# Methods

## readJson

Read a JSON file.

## deepReadJson

Read a JSON file that may 'include' other JSON files.

