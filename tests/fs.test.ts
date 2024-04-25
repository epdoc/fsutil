import { isDate, isValidDate } from '@epdoc/typeutil';
import { isArray } from 'epdoc-util';
import os from 'node:os';
import path from 'node:path';
import { FSStats, FSUtil, SafeCopyOpts, fsutil, isFilePath, isFilename, isFolderPath } from './../src/index';

const HOME = os.userInfo().homedir;

describe('fsutil', () => {
  beforeEach(async () => {
    await fsutil('./tests/data').copyTo('./tests/data1');
    await fsutil('./tests/data2').remove();
    await fsutil('./tests/data2-01').remove();
    await fsutil('./tests/data2-02').remove();
    await fsutil('./tests/data2-03').remove();
    await fsutil('./tests/data3').remove();
  });

  afterAll(async () => {
    await fsutil('./tests/data1').remove();
    await fsutil('./tests/data2').remove();
    await fsutil('./tests/data2-01').remove();
    await fsutil('./tests/data2-02').remove();
    await fsutil('./tests/data2-03').remove();
    await fsutil('./tests/data3').remove();
  });

  test('fsGetFolders', () => {
    return fsutil('.')
      .getFolders()
      .then((resp) => {
        expect(isArray(resp)).toBe(true);
        return fsutil('./tests').getFolders();
      })
      .then((resp) => {
        expect(isArray(resp)).toBe(true);
        expect(resp.length).toBe(2);
        resp = resp.sort();
        expect(resp[0]).toMatch(/data$/);
        expect(resp[1]).toMatch(/data1$/);
      });
  });
  test('fsGetFiles', () => {
    return fsutil('.')
      .getFolders()
      .then((resp) => {
        expect(isArray(resp)).toBe(true);
        return fsutil('./tests').getFiles();
      })
      .then((resp) => {
        expect(isArray(resp)).toBe(true);
        expect(resp.length).toBe(1);
        resp = resp.sort();
        expect(resp[0]).toMatch(/fs\.test\.ts$/);
        return fsutil('./tests').getChildren({ files: true });
      })
      .then((resp) => {
        expect(isArray(resp.files)).toBe(true);
        expect(resp.files.length).toBe(1);
        resp = resp.sortFiles();
        expect(resp.files[0].filename).toMatch(/fs\.test\.ts$/);
      });
  });
  test('getChildren', () => {
    return fsutil('.')
      .getChildren()
      .then((resp) => {
        expect(isArray(resp.files)).toBe(true);
        expect(isArray(resp.folders)).toBe(true);
        return fsutil('./tests').getChildren();
      })
      .then((resp) => {
        expect(isArray(resp.files)).toBe(true);
        expect(isArray(resp.folders)).toBe(true);
        expect(resp.files.length).toBe(1);
        expect(resp.folders.length).toBe(2);
        resp = resp.sortFolders();
        expect(resp.folders[0].filename).toMatch('data');
      });
  });
  test('setExt', () => {
    const PATH = './mypath/to/file/sample.json';
    const EXPECTED = './mypath/to/file/sample.rsc';
    const fs = fsutil(PATH);
    expect(fs.setExt('txt').extname).toEqual('.txt');
    expect(fs.setExt('rsc').path).toEqual(EXPECTED);
  });
  test('isDir', () => {
    return Promise.resolve()
      .then((resp) => {
        return fsutil('./tests').isDir();
      })
      .then((resp) => {
        expect(resp).toBe(true);
        return fsutil('./tests/data1').isDir();
      })
      .then((resp) => {
        expect(resp).toBe(true);
      });
  });
  test('fsExists', () => {
    return Promise.resolve()
      .then((resp) => {
        return fsutil('./tests').exists();
      })
      .then((resp) => {
        expect(resp).toBe(true);
        return fsutil('./tests/data1').exists();
      })
      .then((resp) => {
        expect(resp).toBe(true);
      });
  });
  test('fs dirExists', () => {
    return Promise.resolve()
      .then((resp) => {
        return fsutil('./tests').dirExists();
      })
      .then((resp) => {
        expect(resp).toBe(true);
        return fsutil('./tests/data1').dirExists();
      })
      .then((resp) => {
        expect(resp).toBe(true);
      });
  });
  test('fs fileExists', () => {
    return Promise.resolve()
      .then((resp) => {
        return fsutil('./tests').fileExists();
      })
      .then((resp) => {
        expect(resp).toBe(false);
        return fsutil('./tests/data1').fileExists();
      })
      .then((resp) => {
        expect(resp).toBe(false);
        return fsutil('./tests/data1/sample.txt').fileExists();
      })
      .then((resp) => {
        expect(resp).toBe(true);
      });
  });
  test('fs Stats', () => {
    return Promise.resolve()
      .then((resp) => {
        return fsutil('./tests').getStats();
      })
      .then((stats) => {
        expect(FSStats.isInstance(stats)).toBe(true);
        expect(stats.exists()).toBe(true);
        expect(stats.isDirectory()).toBe(true);
        expect(stats.isFile()).toBe(false);
        expect(isValidDate(stats.createdAt())).toBe(true);
        expect(stats.size).toBe(160);
      });
  });
  test('constructor with .folder', () => {
    return Promise.resolve()
      .then((resp) => {
        return fsutil('./tests').dirExists();
      })
      .then((resp) => {
        expect(resp).toBe(true);
        return fsutil('./tests/data/.withdot').dirExists();
      })
      .then((resp) => {
        expect(resp).toBe(true);
        return fsutil('./tests/data/.withdot/dotsample.json').fileExists();
      })
      .then((resp) => {
        expect(resp).toBe(true);
      });
  });
  it('constructor', () => {
    expect(fsutil('home', 'file.json').basename).toBe('file');
    expect(fsutil('/home', 'file.json').path).toBe('/home/file.json');
  }, 1000);
  it('constructor with HOME', () => {
    const fs = new FSUtil().home().add('.folder').add('file.txt');
    expect(fs.path).toBe(path.resolve(HOME, '.folder', 'file.txt'));
    expect(fs.filename).toBe('file.txt');
    expect(fs.parts[0]).toEqual(HOME);
    expect(fs.parts[1]).toEqual('.folder');
    expect(fs.parts[2]).toEqual('file.txt');
  }, 1000);
  it('guards', () => {
    expect(isFilename('hello')).toBe(true);
    expect(isFilePath('hello')).toBe(true);
    expect(isFilePath('~/xx/hello')).toBe(true);
    expect(isFolderPath('~/xx/hello')).toBe(true);
  }, 1000);
  it('isType', () => {
    expect(fsutil('file.json').isType('json')).toBe(true);
    expect(fsutil('file.json').isType('jsson')).toBe(false);
    expect(fsutil('file.JSON').isType('jsson', 'json')).toBe(true);
    expect(fsutil('file.txt').isType('jsson', 'JSON')).toBe(false);
    expect(fsutil('file.json').isType('jsson', 'JSON')).toBe(true);
    expect(fsutil('file.json').isType(/^json$/)).toBe(true);
    expect(fsutil('file.json').isType(/^JSON$/)).toBe(false);
    expect(fsutil('file.json').isType(/^JSON$/i)).toBe(true);
    expect(fsutil('file.json').isJson()).toBe(true);
    expect(fsutil('file.JSON').isJson()).toBe(true);
    expect(fsutil('file.JSON').isPdf()).toBe(false);
    expect(fsutil('file.JSON').isTxt()).toBe(false);
    expect(fsutil('file.JSON').isXml()).toBe(false);
    expect(fsutil('file.PDF').isPdf()).toBe(true);
    expect(fsutil('file.pdf').isPdf()).toBe(true);
    expect(fsutil('file.xml').isXml()).toBe(true);
    expect(fsutil('file.TXT').isTxt()).toBe(true);
    expect(fsutil('file.TXT').isNamed('file')).toBe(true);
    expect(fsutil('file.TXT').isNamed('TXT')).toBe(false);
  }, 1000);
  it('getPdfDate', () => {
    return Promise.resolve()
      .then((resp) => {
        return fsutil('./tests', 'data', '.withdot/text alignment.pdf').getPdfDate();
      })
      .then((resp) => {
        expect(isValidDate(resp)).toBe(true);
        if (isDate(resp)) {
          process.env.TZ = 'CST';
          expect(new Date(resp).toISOString()).toBe('2018-02-01T06:00:00.000Z');
        }
      })
      .catch((err) => {
        console.log(err);
        throw err;
      });
  }, 1000);
  it('ext', () => {
    const fs = fsutil('./tests/xxx.jpg');
    fs.setExt('.txt');
    expect(fs.extname).toEqual('.txt');
    fs.setExt('pdf');
    expect(fs.extname).toEqual('.pdf');
    fs.setExt('jpg');
    expect(fs.extname).toEqual('.jpg');
    fs.setExt('.jpg');
    expect(fs.extname).toEqual('.jpg');
  }, 1000);
  it('checksum', () => {
    return Promise.resolve()
      .then((resp) => {
        return fsutil('./tests/data1/sample.txt').checksum();
      })
      .then((resp) => {
        expect(resp).toBe('cacc6f06ae07f842663cb1b1722cafbee9b4d203');
      });
  }, 1000);
  it('newError string', () => {
    const fs = new FSUtil('my/path/to/file.txt');
    const err = fs.newError(23, 'my message');
    // @ts-ignore
    expect(err.code).toEqual(23);
    expect(err.message).toEqual('my message: my/path/to/file.txt');
    expect(fs.parts.length).toEqual(1);
    expect(fs.parts[0]).toEqual('my/path/to/file.txt');
  });
  it('newError Error', () => {
    const fs = new FSUtil('my/path/to', 'file.txt');
    const err0 = new Error('hello');
    const err = fs.newError(err0);
    // @ts-ignore
    expect(err.code).toBeUndefined();
    const val = path.resolve('my/path/to', 'file.txt');
    expect(err.message).toEqual('hello: ' + val);
    expect(fs.parts.length).toEqual(2);
    expect(fs.parts[0]).toEqual('my/path/to');
    expect(fs.parts[1]).toEqual('file.txt');
  });
  test('fsEqual', () => {
    return Promise.resolve()
      .then((resp) => {
        return fsutil('./tests/fs.test.ts').filesEqual('./tests/fs.test.ts');
      })
      .then((resp) => {
        expect(resp).toBe(true);
        return fsutil('./tests/fs.test.ts').filesEqual('./tests/data1/sample.txt');
      })
      .then((resp) => {
        expect(resp).toBe(false);
        return fsutil('./tests/data1/sample.txt').filesEqual('./tests');
      })
      .then((resp) => {
        expect(resp).toBe(false);
      });
  });
  test('fsEnsureDir fsutil.Remove', () => {
    return Promise.resolve()
      .then((resp) => {
        return fsutil('./tests').ensureDir();
      })
      .then((resp) => {
        return fsutil('./tests/data1/tmp1').ensureDir();
      })
      .then((resp) => {
        return fsutil('./tests/data1/tmp1').isDir();
      })
      .then((resp) => {
        expect(resp).toBe(true);
        return fsutil('./tests/data1/tmp1').remove();
      })
      .then((resp) => {
        expect(resp).toBeUndefined();
        return fsutil('./tests/data1/tmp1').isDir();
      })
      .then((resp) => {
        expect(resp).toBe(false);
      });
  });
  test('fsCopy fsutil.Move', () => {
    return Promise.resolve()
      .then((resp) => {
        return fsutil('./tests/data1').copyTo('./tests/data2', { preserveTimestamps: true });
      })
      .then((resp) => {
        expect(resp).toBeUndefined();
        return fsutil('./tests/data2').isDir();
      })
      .then((resp) => {
        expect(resp).toEqual(true);
        return fsutil('./tests/data2/folder-sample').isDir();
      })
      .then((resp) => {
        expect(resp).toEqual(true);
        return fsutil('./tests/data2/folder-sample/sample2.txt').isFile();
      })
      .then((resp) => {
        expect(resp).toEqual(true);
        return fsutil('./tests/data2/folder-sample/sample2.txt').filesEqual('./tests/data1/folder-sample/sample2.txt');
      })
      .then((resp) => {
        expect(resp).toBe(true);
        return fsutil('./tests/data2').moveTo('./tests/data3');
      })
      .then((resp) => {
        expect(resp).toBeUndefined();
        return fsutil('./tests/data2').isDir();
      })
      .then((resp) => {
        expect(resp).toEqual(false);
        return fsutil('./tests/data3').isDir();
      })
      .then((resp) => {
        expect(resp).toEqual(true);
        return fsutil('./tests/data3').remove();
      })
      .then((resp) => {
        expect(resp).toBeUndefined();
        return fsutil('./tests/data3').isDir();
      })
      .then((resp) => {
        expect(resp).toBe(false);
      });
  });

  test('safeCopy', () => {
    return Promise.resolve()
      .then((resp) => {
        const opts: SafeCopyOpts = {
          ensureDir: true
        };
        return fsutil('./tests/data1').safeCopy('./tests/data2', opts);
      })
      .then((resp) => {
        expect(resp).toBe(true);
        return fsutil('./tests/data2').isDir();
      })
      .then((resp) => {
        expect(resp).toEqual(true);
        return fsutil('./tests/data2/folder-sample').isDir();
      })
      .then((resp) => {
        expect(resp).toEqual(true);
        return fsutil('./tests/data2/folder-sample/sample2.txt').isFile();
      })
      .then((resp) => {
        expect(resp).toEqual(true);
        return fsutil('./tests/data2/folder-sample/sample2.txt').filesEqual('./tests/data1/folder-sample/sample2.txt');
      })
      .then((resp) => {
        expect(resp).toBe(true);
        const opts: SafeCopyOpts = {
          ensureDir: false,
          index: 5
        };
        return fsutil('./tests/data1').safeCopy('./tests/data2', opts);
      })
      .then((resp) => {
        expect(resp).toEqual(true);
        return fsutil('./tests/data2').isDir();
      })
      .then((resp) => {
        expect(resp).toEqual(true);
        return fsutil('./tests/data2-01').isDir();
      })
      .then((resp) => {
        expect(resp).toEqual(true);
      });
  });

  test('json', async () => {
    const SRC = './tests/data1/folder-sample/sample.json';
    const DEST = './tests/data1/folder-sample/sample-copy.json';
    const json = await fsutil(SRC).readJson();
    await fsutil(DEST).writeJson(json);
    expect(await fsutil(DEST).isFile()).toEqual(true);
    const json2 = await fsutil(DEST).readJson();
    expect(json2).toEqual(json);
  });
  test('json err', async () => {
    const SRC = './tests/data/.withdot/broken.json';
    return Promise.resolve()
      .then((resp) => {
        return fsutil(SRC).readJson();
      })
      .then((resp) => {
        expect(true).toBe(false);
      })
      .catch((err) => {
        expect(err.message).toContain('Bad control character in string literal in JSON at position 120');
      });
  });

  test('deep json', async () => {
    const opts = { pre: '{{', post: '}}', includeUrl: true };
    const SRC = './tests/data1/folder-sample/sample-nested.json';
    const SRC2 = './tests/data1/folder-sample/sample-compare.json';
    const json2 = await fsutil(SRC2).readJson();
    const json = await fsutil(SRC).deepReadJson(opts);
    expect(json2).toEqual(json);
  });

  test('write utf8', async () => {
    const sin = 'here is a line of text';
    const DEST = './tests/data1/folder-sample/output.txt';
    await fsutil(DEST).write(sin);
    expect(await fsutil(DEST).isFile()).toEqual(true);
    const s = await fsutil(DEST).readAsString();
    expect(s).toEqual(sin);
  });
  test('write lines', async () => {
    const lines = ['this', 'is', 'line 2'];
    const DEST = './tests/data1/folder-sample/output.txt';
    await fsutil(DEST).write(lines);
    expect(await fsutil(DEST).isFile()).toEqual(true);
    const s = await fsutil(DEST).readAsString();
    expect(s).toEqual(lines.join('\n'));
  });

  test('readAsString', async () => {
    const SRC = './tests/data/sample.txt';
    const result = 'This is sample.txt. \nDo not edit or move this file.\n';
    const str = await fsutil(SRC).readAsString();
    console.log(str);
    expect(str).toEqual(result);
  });
  test('path resolve', async () => {
    const SRC = './tests/data/sample.json';
    const result = 'This is sample.txt.\\nDo not edit or move this file.';
    const fsutil = new FSUtil('/', 'the', 'path', 'goes', 'right.here.txt');
    expect(fsutil.path).toEqual('/the/path/goes/right.here.txt');
    expect(fsutil.dirname).toEqual('/the/path/goes');
    expect(fsutil.extname).toEqual('.txt');
    expect(fsutil.basename).toEqual('right.here');
    expect(fsutil.isType('txt')).toEqual(true);
    expect(fsutil.isTxt()).toEqual(true);
    expect(fsutil.isJson()).toEqual(false);
    expect(fsutil.isType('json', 'txt')).toEqual(true);
    expect(fsutil.isType('json', 'pdf')).toEqual(false);
    expect(fsutil.isType('txt', 'pdf')).toEqual(true);
  });
});
