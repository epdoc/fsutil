// import * as checksum from 'checksum';
import { DateUtil } from '@epdoc/timeutil';
import {
  DeepCopyOpts,
  Dict,
  deepCopy,
  deepCopySetDefaultOpts,
  isArray,
  isError,
  isNonEmptyArray,
  isNonEmptyString,
  isObject,
  isRegExp,
  isString
} from '@epdoc/typeutil';
import checksum from 'checksum';
import * as fx from 'fs-extra';
import fs from 'node:fs';
import path from 'node:path';
import Pdfparser from 'pdf2json';

const REG = {
  pdf: /\.pdf$/i,
  xml: /\.xml$/i,
  json: /\.json$/i,
  txt: /\.txt$/i
};

export type FilePath = string;
export type FolderPath = string;
export type FileName = string;
export type FileExt = string; // includes '.'

export function isFilename(val: any): val is FileName {
  return isNonEmptyString(val);
}
export function isFolderPath(val: any): val is FolderPath {
  return isNonEmptyString(val);
}
export function isFilePath(val: any): val is FilePath {
  return isNonEmptyString(val);
}
export type FsDeepCopyOpts = DeepCopyOpts & {
  includeUrl?: any;
};

export type SafeCopyOpts = Partial<{
  errorOnNoSource: boolean;
  errorOnExist: boolean;
  move: boolean; // Set to true to move the file rather than copy the file
  ensureDir: boolean; // Ensure the parent dest folder exists
  overwrite: boolean; // if backup and index are not set, and this is set, then overwrite the old file
  backup: boolean; // backup dest as dest~, will overwrite previous backups
  index: boolean; // add a count to the filename until we find one that isn't taken
  test: boolean; // don't actually move or copy the file, just execute the logic around it
}>;

export function fsutil(...args: FilePath[] | FolderPath[]): FSUtil {
  return new FSUtil(...args);
}

export class FSUtil {
  // @ts-ignore
  private f: FilePath | FolderPath;

  constructor(...args: FilePath[] | FolderPath[]) {
    if (args.length === 1) {
      if (isArray(args[0])) {
        this.f = path.resolve(args[0]);
      } else {
        this.f = args[0];
      }
    } else if (args.length > 1) {
      this.f = path.resolve(...args);
    }
  }

  get path(): FilePath {
    return this.f;
  }

  /**
   * Returns 'file.name' portion of /path/to/file.name.html'. Unlike
   * path.basename, this does NOT include the extension.
   */
  get basename(): string {
    return path.basename(this.f).replace(/\.[^\.]*$/, '');
  }

  /**
   * Returns '/path/to' portion of /path/to/file.name.html'
   */
  get dirname(): string {
    return path.dirname(this.f);
  }

  /**
   * Returns 'html' portion of /path/to/file.name.html'
   */
  get extname(): string {
    return path.extname(this.f);
  }

  isType(...type: (RegExp | string)[]): boolean {
    const lowerCaseExt = this.extname.toLowerCase().replace(/^\./, '');
    for (const entry of type) {
      if (isRegExp(entry)) {
        if (entry.test(lowerCaseExt)) {
          return true;
        }
      } else if (isString(entry)) {
        if (entry.toLowerCase() === lowerCaseExt) {
          return true;
        }
      }
    }
    return false;
  }

  isPdf(): boolean {
    return REG.pdf.test(this.extname);
  }

  isXml(): boolean {
    return REG.xml.test(this.extname);
  }
  isTxt(): boolean {
    return REG.txt.test(this.extname);
  }
  isJson(): boolean {
    return REG.json.test(this.extname);
  }

  setExt(ext: string): this {
    const e = this.extname;
    if (ext !== e) {
      this.f = path.format({ ...path.parse(this.f), base: '', ext: '.' + ext });
    }
    return this;
  }

  isNamed(name: string): boolean {
    return name === this.basename;
  }

  async ensureDir(options?: fx.EnsureDirOptions | number): Promise<unknown> {
    return fx.ensureDir(this.f, options);
  }

  ensureDirSync(options?: fx.EnsureDirOptions | number): this {
    fx.ensureDirSync(this.f, options);
    return this;
  }

  async remove(): Promise<void> {
    return fx.remove(this.f);
  }

  async copyTo(dest: FilePath, options?: fx.CopyOptions): Promise<void> {
    return fx.copy(this.f, dest, options);
  }

  copySync(dest: FilePath, options?: fx.CopyOptionsSync): this {
    fx.copySync(this.f, dest, options);
    return this;
  }

  async moveTo(dest: FilePath, options?: fx.MoveOptions): Promise<void> {
    return fx.move(this.f, dest, options);
  }

  /**
   * Retrieve the list of matching files in dir. Does not return the full path.
   * @param regex (optional) Use to constrain results
   */
  async getFiles(regex?: RegExp): Promise<FolderPath[]> {
    const results: FolderPath[] = [];
    return fs.promises
      .readdir(this.f)
      .then((entries) => {
        const jobs = [];
        for (const entry of entries) {
          const fullPath: FolderPath = path.resolve(this.f, entry);
          const job = fsutil(fullPath)
            .isFile()
            .then((bIsFile) => {
              if (bIsFile && (!regex || regex.test(entry))) {
                results.push(entry);
              }
            });
          jobs.push(job);
        }
        return Promise.all(jobs);
      })
      .then((resp) => {
        return Promise.resolve(results);
      });
  }

  /**
   * Retrieve the list of matching folders in dir. Does not return the full
   * path.
   * @param regex (optional) Use to constrain results
   */
  async getFolders(regex?: RegExp): Promise<FolderPath[]> {
    const results: FolderPath[] = [];
    return fs.promises
      .readdir(this.f)
      .then((entries) => {
        const jobs = [];
        for (const entry of entries) {
          const fullPath: FolderPath = path.resolve(this.f, entry);
          const job = fsutil(fullPath)
            .isDir()
            .then((bIsDir) => {
              if (bIsDir && (!regex || regex.test(entry))) {
                results.push(entry);
              }
            });
          jobs.push(job);
        }
        return Promise.all(jobs);
      })
      .then((resp) => {
        return Promise.resolve(results);
      });
  }

  /**
   * Get the Creation Date of a PDF file by reading it's metadata.
   * @param file
   */
  async getPdfDate(): Promise<Date | undefined> {
    return new Promise((resolve, reject) => {
      const pdfParser = new Pdfparser();
      pdfParser.on('readable', (resp) => {
        if (resp && resp.Meta && resp.Meta.CreationDate) {
          // const d = new Date(p[1], p[2], p[3], p[4], p[5], p[6]);
          // d.tim;
          const d = DateUtil.fromPdfDate(resp.Meta.CreationDate);
          resolve(d ? d.date : undefined);
        }
        resolve(new Date(0));
      });
      pdfParser.on('pdfParser_dataError', (err) => {
        reject(this.newError(err));
      });
      pdfParser.loadPDF(this.f);
    });
  }

  /**
   * Calculate the checksum of a file
   * @param file
   */
  async checksum() {
    return new Promise((resolve, reject) => {
      // @ts-ignore
      checksum.file(this.f, (err, sum) => {
        if (err) {
          reject(this.newError(err));
        } else {
          resolve(sum);
        }
      });
    });
  }

  /**
   * Use checksums to test if two files are equal
   * @param path1
   * @param path2
   */
  async filesEqual(path2: FilePath): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const job1 = this.isFile();
      const job2 = fsutil(path2).isFile();
      return Promise.all([job1, job2]).then((resps) => {
        if (resps && resps.length === 2 && resps[0] === true && resps[1] === true) {
          const job3 = this.checksum();
          const job4 = new FSUtil(path2).checksum();
          return Promise.all([job3, job4]).then((resps) => {
            if (resps && resps.length === 2 && resps[0] === resps[1]) {
              resolve(true);
            } else {
              resolve(false);
            }
          });
        } else {
          resolve(false);
        }
      });
    });
  }

  async readAsString(): Promise<any> {
    return new Promise((resolve, reject) => {
      fs.readFile(this.f, 'utf8', (err, data) => {
        if (err) {
          reject(this.newError(err));
        } else {
          resolve(data.toString());
        }
      });
    });
  }

  async readJson(): Promise<any> {
    return new Promise((resolve, reject) => {
      fs.readFile(this.f, 'utf8', (err, data) => {
        if (err) {
          reject(this.newError(err));
        } else {
          try {
            const json = JSON.parse(data.toString());
            resolve(json);
          } catch (error) {
            reject(this.newError(error));
          }
        }
      });
    });
  }

  async deepReadJson(opts: FsDeepCopyOpts = {}): Promise<any> {
    return this.readJson().then((resp) => {
      return this.deepCopy(resp, opts);
    });
  }

  private async deepCopy(a: any, options?: FsDeepCopyOpts): Promise<any> {
    let opts: FsDeepCopyOpts = deepCopySetDefaultOpts(options);
    const urlTest = new RegExp(`^${opts.pre}(file|http|https):\/\/(.+)${opts.post}$`, 'i');
    if (opts.includeUrl && isNonEmptyString(a) && urlTest.test(a)) {
      const p = a.match(urlTest);
      if (isNonEmptyArray(p) && isFilePath(p[2])) {
        const fs = new FSUtil(this.dirname, p[2]);
        return fs.deepReadJson(opts).then((resp) => {
          return Promise.resolve(resp);
        });
      } else {
        return Promise.resolve(a);
      }
    } else if (isObject(a)) {
      // @ts-ignore
      const re: RegExp = opts && opts.detectRegExp ? asRegExp(a) : undefined;
      if (re) {
        return Promise.resolve(re);
      } else {
        const jobs: any[] = [];
        const result2: Dict = {};
        Object.keys(a).forEach((key) => {
          let job = this.deepCopy(a[key], opts).then((resp) => {
            result2[key] = resp;
          });
          jobs.push(job);
        });
        return Promise.all(jobs).then((resp) => {
          return Promise.resolve(result2);
        });
      }
    } else {
      return Promise.resolve(deepCopy(a, opts));
    }
  }

  async writeJson(data: any): Promise<void> {
    const buf = Buffer.from(JSON.stringify(data, null, '  '));
    return fs.promises.writeFile(this.f, buf);
  }

  async writeBase64(data: string): Promise<void> {
    const buf = Buffer.from(data, 'base64');
    return fs.promises.writeFile(this.f, buf);
  }

  async isDir(): Promise<boolean> {
    return this.dirExists();
  }

  async isFile(): Promise<boolean> {
    return this.fileExists();
  }

  async exists(): Promise<boolean> {
    try {
      const resp: fs.Stats = await fs.promises.stat(this.f);
      return resp.isDirectory() || resp.isFile();
    } catch (err) {
      return Promise.resolve(false);
    }
  }

  async dirExists(): Promise<boolean> {
    try {
      const resp: fs.Stats = await fs.promises.stat(this.f);
      return resp.isDirectory();
    } catch (err) {
      return Promise.resolve(false);
    }
  }

  async fileExists(): Promise<boolean> {
    return fs.promises
      .stat(this.f)
      .then((resp: fs.Stats) => {
        return resp.isFile();
      })
      .catch((err) => {
        return Promise.resolve(false);
      });
  }

  async createdAt(p: FilePath): Promise<Date> {
    return fs.promises
      .stat(this.f)
      .then((stats: fs.Stats) => {
        // const birthTime: Stats.birthtimeMs = stats.birthtime;
        return new Date(stats.birthtime || stats.mtime);
      })
      .catch((err) => {
        return Promise.reject(this.newError(err));
      });
  }

  /**
   * Copy a file or directory.
   * @param srcFile
   * @param destFile
   * @param opts
   * @returns True if file was copied or moved, false otherwise
   */
  async safeCopy(destFile: FilePath, opts: SafeCopyOpts = {}): Promise<boolean | undefined> {
    return Promise.reject(new Error('The safeCopy function has not yet been implemented'));
    return this.fileExists().then((sourceExists) => {
      let destFileExists: boolean;
      let destPath: FilePath = destFile;
      const destDir: FolderPath = path.dirname(destFile);
      if (sourceExists) {
        return fsutil(destFile)
          .fileExists()
          .then((resp) => {
            destFileExists = resp;
            if (opts.ensureDir) {
              return fsutil(destDir).ensureDir();
            }
          })
          .then(() => {
            return fsutil(destDir).dirExists();
          })
          .then((destDirExists) => {
            if (destFileExists) {
              if (opts.backup) {
                const bakDest: FilePath = destFile + '~';
                return fsutil(destFile)
                  .moveTo(bakDest, { overwrite: true })
                  .then((resp) => {
                    return Promise.resolve(true);
                  });
              } else if (opts.index) {
                let count = 0;
                const parts = path.parse(destFile);
                destPath = path.resolve(parts.dir, parts.name + '-' + ++count + parts.ext);
                while (fs.existsSync(destPath) && count < 10) {
                  destPath = path.resolve(parts.dir, parts.name + '-' + ++count + parts.ext);
                }
                if (count >= 10) {
                  if (opts.errorOnExist) {
                    throw this.newError('EEXIST', 'File exists');
                  }
                  return Promise.resolve(false);
                }
              } else if (!opts.overwrite) {
                if (opts.errorOnExist) {
                  throw this.newError('EEXIST', 'File exists');
                } else {
                  return Promise.resolve(false);
                }
              }
              return Promise.resolve(true);
            } else if (destDirExists) {
              return Promise.resolve(true);
            } else {
              return Promise.resolve(false);
            }
          })
          .then((doIt: boolean) => {
            if (doIt) {
              if (opts.move) {
                if (opts.test) {
                  // console.log(`  Skipped move ${srcFile} to ${destPath}`);
                } else {
                  return this.moveTo(destPath, { overwrite: true }).then((resp) => {
                    // console.log(`  Moved ${srcFile} to ${destPath}`);
                    return Promise.resolve(true);
                  });
                }
              } else {
                if (opts.test) {
                  // console.log(`  Skipped copy ${srcFile} to ${destPath}`);
                } else {
                  return this.copyTo(destPath, { overwrite: true }).then((resp) => {
                    // console.log(`  Copied ${srcFile} to ${destPath}`);
                    return Promise.resolve(true);
                  });
                }
              }
            }
            return Promise.resolve(false);
          });
      } else {
        if (opts.errorOnNoSource) {
          throw this.newError('ENOENT', 'File does not exist');
        }
      }
    });
  }

  newError(code: any, message?: string): Error {
    if (isError(code)) {
      code.message = `${code.message}: ${this.f}`;
      return code;
    }
    let err: Error = new Error(`${message}: ${this.f}`);
    // @ts-ignore
    err.code = code;
    return err;
  }
}
