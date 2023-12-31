import { isArray } from 'epdoc-util';
import { SafeCopyOpts, fsutil } from './../src/index';

describe('fsutil', () => {
  beforeEach(async () => {
    await fsutil('./tests/data').copyTo('./tests/data1');
    await fsutil('./tests/data2').remove();
    await fsutil('./tests/data3').remove();
  });

  afterAll(async () => {
    await fsutil('./tests/data1');
    await fsutil('./tests/data2');
    await fsutil('./tests/data3');
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
        console.log(JSON.stringify(resp));
        resp = resp.sort();
        expect(resp[0]).toMatch(/tests\/data$/);
        expect(resp[1]).toMatch(/tests\/data1$/);
      });
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
  it('checksum', () => {
    return Promise.resolve()
      .then((resp) => {
        return fsutil('./tests/data1/sample.txt').checksum();
      })
      .then((resp) => {
        expect(resp).toBe('cacc6f06ae07f842663cb1b1722cafbee9b4d203');
      });
  }, 1000);
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

  test.skip('safeCopy', () => {
    return Promise.resolve()
      .then((resp) => {
        const opts: SafeCopyOpts = {
          ensureDir: true
        };
        return fsutil('./tests/data1').safeCopy('./tests/data2', opts);
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

  test('json', async () => {
    const SRC = './tests/data1/folder-sample/sample.json';
    const DEST = './tests/data1/folder-sample/sample-copy.json';
    const json = await fsutil(SRC).readJson();
    await fsutil(DEST).writeJson(json);
    expect(await fsutil(DEST).isFile()).toEqual(true);
    const json2 = await fsutil(DEST).readJson();
    expect(json2).toEqual(json);
  });
});
