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

