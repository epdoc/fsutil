# epdoc/fsutil

Async File System utilities.


# Clients

```bash
npm install @epdoc/fsutil
```

```ts
import { futil } from '@epdoc/futil';

if( futil('~/.ssh').isDir() ) {
  console.log('SSH is installed');
}
```


# Developers

```bash
npm install
npm run build
npm test
```

