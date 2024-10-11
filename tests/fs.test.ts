import { dateUtil } from '@epdoc/timeutil';
import { isDate, isValidDate } from '@epdoc/typeutil';
import { isArray } from 'epdoc-util';
import os from 'node:os';
import path from 'node:path';
<<<<<<< Updated upstream
import { FSItem, FSStats, SafeCopyOpts, fsitem, isFilePath, isFilename, isFolderPath } from './../src/index';
=======
import process from 'node:process';
import { FSItem, fsitem, FSStats, isFilename, isFilePath, isFolderPath, type SafeCopyOpts } from '../mod.ts';
import { fileConflictStrategyType } from '../src/types.ts';
>>>>>>> Stashed changes

const HOME = os.userInfo().homedir;

describe('fsitem', () => {
  beforeEach(async () => {
    const fs = fsitem('./tests/data');
    await fs.copyTo('./tests/data1', { overwrite: true });
    await fsitem('./tests/data2').remove({ recursive: true });
    await fsitem('./tests/data2-01').remove();
    await fsitem('./tests/data2-02').remove();
    await fsitem('./tests/data2-03').remove();
    await fsitem('./tests/data3').remove();
  });

  afterAll(async () => {
    await fsitem('./tests/data1').remove();
    await fsitem('./tests/data2').remove();
    await fsitem('./tests/data2-01').remove();
    await fsitem('./tests/data2-02').remove();
    await fsitem('./tests/data2-03').remove();
    await fsitem('./tests/data3').remove();
  });

  test('fsGetFolders', () => {
    return fsitem('.')
      .getFolders()
      .then((resp) => {
        expect(isArray(resp)).toBe(true);
        return fsitem('./tests').getFolders();
      })
      .then((resp) => {
        expect(isArray(resp)).toBe(true);
        expect(resp.length).toBe(2);
        resp = resp.sort();
        expect(resp[0].filename).toMatch(/data$/);
        expect(resp[1].filename).toMatch(/data1$/);
      });
  });
  test('fsGetFiles', () => {
    let fs0: FSItem = fsitem('.');
    let fs1 = fsitem('./tests');
    return fs0
      .getFolders()
      .then((resp) => {
        expect(isArray(resp)).toBe(true);
        return fs1.getFiles();
      })
      .then((resp) => {
        expect(isArray(resp)).toBe(true);
        expect(resp.length).toBe(1);
        fs1.sortFiles();
<<<<<<< Updated upstream
        expect(fs1.files[0].filename).toMatch(/fs\.test\.ts$/);
        return fs1.getChildren();
=======
        expect(fs1.files[0].filename).toBe(TEST_FILES[0]);
        expect(fs1.files[1].filename).toBe(TEST_FILES[1]);
        expect(fs1.files[2].filename).toBe(TEST_FILES[2]);
        expect(fs1.files[3].filename).toBe(TEST_FILES[3]);
        return fs1.walk();
>>>>>>> Stashed changes
      })
      .then((resp) => {
        expect(isArray(resp)).toBe(true);
        expect(resp.length).toBe(3);
        fs1.sortFiles();
        expect(fs1.files[0].filename).toMatch(/fs\.test\.ts$/);
      });
  });
  test('getChildren', () => {
    let fs0: FSItem = fsitem('.');
    let fs1 = fsitem('./tests');
    return fs0
      .walk()
      .then((resp) => {
        expect(isArray(resp)).toBe(true);
        expect(isArray(fs0.files)).toBe(true);
        expect(isArray(fs0.folders)).toBe(true);
        return fs1.walk();
      })
      .then((resp) => {
        expect(isArray(resp)).toBe(true);
        expect(isArray(fs1.files)).toBe(true);
        expect(isArray(fs1.folders)).toBe(true);
        expect(fs1.files.length).toBe(1);
        expect(fs1.folders.length).toBe(2);
        fs1.sortFolders();
        expect(fs1.folders[0].filename).toMatch('data');
      });
  });
  test('setExt', () => {
    const PATH = './mypath/to/file/sample.json';
    const EXPECTED = './mypath/to/file/sample.rsc';
    const fs = fsitem(PATH);
    expect(fs.setExt('txt').extname).toEqual('.txt');
    expect(fs.setExt('rsc').path).toEqual(EXPECTED);
  });
  test('setBasename', () => {
    const PATH = './mypath/to/file/sample.less.json';
    const EXPECTED = './mypath/to/file/sample.more.json';
    const fs = fsitem(PATH);
    fs.setBasename('sample.more');
    expect(fs.path).toEqual(EXPECTED);
    expect(fs.basename).toEqual('sample.more');
  });
  test('isDir', () => {
    return Promise.resolve()
      .then((resp) => {
        return fsitem('./tests').isDir();
      })
      .then((resp) => {
        expect(resp).toBe(true);
        return fsitem('./tests/data1').isDir();
      })
      .then((resp) => {
        expect(resp).toBe(true);
      });
  });
  test('fsExists', () => {
    return Promise.resolve()
      .then((resp) => {
        return fsitem('./tests').exists();
      })
      .then((resp) => {
        expect(resp).toBe(true);
        return fsitem('./tests/data1').exists();
      })
      .then((resp) => {
        expect(resp).toBe(true);
      });
  });
  test('fs dirExists', () => {
    return Promise.resolve()
      .then((resp) => {
        return fsitem('./tests').dirExists();
      })
      .then((resp) => {
        expect(resp).toBe(true);
        return fsitem('./tests/data1').dirExists();
      })
      .then((resp) => {
        expect(resp).toBe(true);
      });
  });
  test('fs fileExists', () => {
    return Promise.resolve()
      .then((resp) => {
        return fsitem('./tests').fileExists();
      })
      .then((resp) => {
        expect(resp).toBe(false);
        return fsitem('./tests/data1').fileExists();
      })
      .then((resp) => {
        expect(resp).toBe(false);
        return fsitem('./tests/data1/sample.txt').fileExists();
      })
      .then((resp) => {
        expect(resp).toBe(true);
      });
  });
  test('fs Stats', () => {
    return Promise.resolve()
      .then((resp) => {
        return fsitem('./tests').getStats();
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
        return fsitem('./tests').dirExists();
      })
      .then((resp) => {
        expect(resp).toBe(true);
        return fsitem('./tests/data/.withdot').dirExists();
      })
      .then((resp) => {
        expect(resp).toBe(true);
        return fsitem('./tests/data/.withdot/dotsample.json').fileExists();
      })
      .then((resp) => {
        expect(resp).toBe(true);
      });
  });
  it('constructor', () => {
    expect(fsitem('home', 'file.json').basename).toBe('file');
    expect(fsitem('/home', 'file.json').path).toBe('/home/file.json');
  }, 1000);
  it('constructor with HOME', () => {
    const fs = new FSItem().home().add('.folder').add('file.txt');
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
    expect(fsitem('file.json').isType('json')).toBe(true);
    expect(fsitem('file.json').isType('jsson')).toBe(false);
    expect(fsitem('file.JSON').isType('jsson', 'json')).toBe(true);
    expect(fsitem('file.txt').isType('jsson', 'JSON')).toBe(false);
    expect(fsitem('file.json').isType('jsson', 'JSON')).toBe(true);
    expect(fsitem('file.json').isType(/^json$/)).toBe(true);
    expect(fsitem('file.json').isType(/^JSON$/)).toBe(false);
    expect(fsitem('file.json').isType(/^JSON$/i)).toBe(true);
    expect(fsitem('file.json').isJson()).toBe(true);
    expect(fsitem('file.JSON').isJson()).toBe(true);
    expect(fsitem('file.JSON').isPdf()).toBe(false);
    expect(fsitem('file.JSON').isTxt()).toBe(false);
    expect(fsitem('file.JSON').isXml()).toBe(false);
    expect(fsitem('file.PDF').isPdf()).toBe(true);
    expect(fsitem('file.pdf').isPdf()).toBe(true);
    expect(fsitem('file.xml').isXml()).toBe(true);
    expect(fsitem('file.TXT').isTxt()).toBe(true);
    expect(fsitem('file.TXT').isNamed('file')).toBe(true);
    expect(fsitem('file.TXT').isNamed('TXT')).toBe(false);
  }, 1000);
  it('getPdfDate', () => {
    return Promise.resolve()
      .then((resp) => {
        return fsitem('./tests', 'data', '.withdot/text alignment.pdf').getPdfDate();
      })
      .then((resp) => {
        expect(isValidDate(resp)).toBe(true);
        if (isDate(resp)) {
          process.env.TZ = 'CST';
          expect(new Date(resp).toISOString()).toBe('2018-02-01T00:00:00.000Z');
          expect(dateUtil(resp).toISOLocaleString()).toBe('2018-01-31T18:00:00.000-06:00');
        }
      })
      .catch((err) => {
        console.log(err);
        throw err;
      });
  }, 1000);
  it('ext', () => {
    const fs = fsitem('./tests/xxx.jpg');
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
        return fsitem('./tests/data1/sample.txt').checksum();
      })
      .then((resp) => {
        expect(resp).toBe('cacc6f06ae07f842663cb1b1722cafbee9b4d203');
      });
  }, 1000);
  it('newError string', () => {
    const fs = new FSItem('my/path/to/file.txt');
    const err = fs.newError(23, 'my message');
    // @ts-ignore
    expect(err.code).toEqual(23);
    expect(err.message).toEqual('my message: my/path/to/file.txt');
    expect(fs.parts.length).toEqual(1);
    expect(fs.parts[0]).toEqual('my/path/to/file.txt');
  });
  it('newError Error', () => {
    const fs = new FSItem('my/path/to', 'file.txt');
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
        return fsitem('./tests/fs.test.ts').filesEqual('./tests/fs.test.ts');
      })
      .then((resp) => {
        expect(resp).toBe(true);
        return fsitem('./tests/fs.test.ts').filesEqual('./tests/data1/sample.txt');
      })
      .then((resp) => {
        expect(resp).toBe(false);
        return fsitem('./tests/data1/sample.txt').filesEqual('./tests');
      })
      .then((resp) => {
        expect(resp).toBe(false);
      });
  });
  test('fsEnsureDir fsitem.Remove', () => {
    return Promise.resolve()
      .then((resp) => {
        return fsitem('./tests').ensureDir();
      })
      .then((resp) => {
        return fsitem('./tests/data1/tmp1').ensureDir();
      })
      .then((resp) => {
        return fsitem('./tests/data1/tmp1').isDir();
      })
      .then((resp) => {
        expect(resp).toBe(true);
        return fsitem('./tests/data1/tmp1').remove();
      })
      .then((resp) => {
        expect(resp).toBeUndefined();
        return fsitem('./tests/data1/tmp1').isDir();
      })
      .then((resp) => {
        expect(resp).toBe(false);
      });
  });
  test('fsEnsureDir no file', () => {
    return Promise.resolve()
      .then((resp) => {
        return fsitem('./tests/data1/tmp.txt').ensureDir();
      })
      .then((resp) => {
        return fsitem('./tests/data1/tmp.txt').isDir();
      })
      .then((resp) => {
        expect(resp).toBe(true);
        return fsitem('./tests/data1/tmp.txt').remove();
      })
      .then((resp) => {
        expect(resp).toBeUndefined();
        return fsitem('./tests/data1/tmp.txt').isDir();
      })
      .then((resp) => {
        expect(resp).toBe(false);
      });
  });
  test('fsCopy fsitem.Move', () => {
    return Promise.resolve()
      .then((resp) => {
        return fsitem('./tests/data1').copyTo('./tests/data2', { preserveTimestamps: true });
      })
      .then((resp) => {
        expect(resp).toBeUndefined();
        return fsitem('./tests/data2').isDir();
      })
      .then((resp) => {
        expect(resp).toEqual(true);
        return fsitem('./tests/data2/folder-sample').isDir();
      })
      .then((resp) => {
        expect(resp).toEqual(true);
        return fsitem('./tests/data2/folder-sample/sample2.txt').isFile();
      })
      .then((resp) => {
        expect(resp).toEqual(true);
        return fsitem('./tests/data2/folder-sample/sample2.txt').filesEqual('./tests/data1/folder-sample/sample2.txt');
      })
      .then((resp) => {
        expect(resp).toBe(true);
        return fsitem('./tests/data2').moveTo('./tests/data3');
      })
      .then((resp) => {
        expect(resp).toBeUndefined();
        return fsitem('./tests/data2').isDir();
      })
      .then((resp) => {
        expect(resp).toEqual(false);
        return fsitem('./tests/data3').isDir();
      })
      .then((resp) => {
        expect(resp).toEqual(true);
        return fsitem('./tests/data3').remove();
      })
      .then((resp) => {
        expect(resp).toBeUndefined();
        return fsitem('./tests/data3').isDir();
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
        return fsitem('./tests/data1').safeCopy('./tests/data2', opts);
      })
      .then((resp) => {
        expect(resp).toBe(true);
        return fsitem('./tests/data2').isDir();
      })
      .then((resp) => {
        expect(resp).toEqual(true);
        return fsitem('./tests/data2/folder-sample').isDir();
      })
      .then((resp) => {
        expect(resp).toEqual(true);
        return fsitem('./tests/data2/folder-sample/sample2.txt').isFile();
      })
      .then((resp) => {
        expect(resp).toEqual(true);
        return fsitem('./tests/data2/folder-sample/sample2.txt').filesEqual('./tests/data1/folder-sample/sample2.txt');
      })
      .then((resp) => {
        expect(resp).toBe(true);
        const opts: SafeCopyOpts = {
          ensureDir: false,
          index: 5
        };
        return fsitem('./tests/data1').safeCopy('./tests/data2', opts);
      })
      .then((resp) => {
        expect(resp).toEqual(true);
        return fsitem('./tests/data2').isDir();
      })
      .then((resp) => {
        expect(resp).toEqual(true);
        return fsitem('./tests/data2-01').isDir();
      })
      .then((resp) => {
        expect(resp).toEqual(true);
      });
  });

  test('json', async () => {
    const SRC = './tests/data1/folder-sample/sample.json';
    const DEST = './tests/data1/folder-sample/sample-copy.json';
    const json = await fsitem(SRC).readJson();
    await fsitem(DEST).writeJson(json);
    expect(await fsitem(DEST).isFile()).toEqual(true);
    const json2 = await fsitem(DEST).readJson();
    expect(json2).toEqual(json);
  });
  test('json err', async () => {
    const SRC = './tests/data/.withdot/broken.json';
    return Promise.resolve()
      .then((resp) => {
        return fsitem(SRC).readJson();
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
    const json2 = await fsitem(SRC2).readJson();
    const json = await fsitem(SRC).deepReadJson(opts);
    expect(json2).toEqual(json);
  });

  test('write utf8', async () => {
    const sin = 'here is a line of text';
    const DEST = './tests/data1/folder-sample/output.txt';
    await fsitem(DEST).write(sin);
    expect(await fsitem(DEST).isFile()).toEqual(true);
    const s = await fsitem(DEST).readAsString();
    expect(s).toEqual(sin);
  });
  test('write lines', async () => {
    const lines = ['this', 'is', 'line 2'];
    const DEST = './tests/data1/folder-sample/output.txt';
    await fsitem(DEST).write(lines);
    expect(await fsitem(DEST).isFile()).toEqual(true);
    const s = await fsitem(DEST).readAsString();
    expect(s).toEqual(lines.join('\n'));
  });

  test('readAsString', async () => {
    const SRC = './tests/data/sample.txt';
    const result = 'This is sample.txt. \nDo not edit or move this file.\n';
    const str = await fsitem(SRC).readAsString();
    console.log(str);
    expect(str).toEqual(result);
  });
  test('path resolve', async () => {
    const SRC = './tests/data/sample.json';
    const result = 'This is sample.txt.\\nDo not edit or move this file.';
    const fsitem = new FSItem('/', 'the', 'path', 'goes', 'right.here.txt');
    expect(fsitem.path).toEqual('/the/path/goes/right.here.txt');
    expect(fsitem.dirname).toEqual('/the/path/goes');
    expect(fsitem.extname).toEqual('.txt');
    expect(fsitem.basename).toEqual('right.here');
    expect(fsitem.isType('txt')).toEqual(true);
    expect(fsitem.isTxt()).toEqual(true);
    expect(fsitem.isJson()).toEqual(false);
    expect(fsitem.isType('json', 'txt')).toEqual(true);
    expect(fsitem.isType('json', 'pdf')).toEqual(false);
    expect(fsitem.isType('txt', 'pdf')).toEqual(true);
  });
});
