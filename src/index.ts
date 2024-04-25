import { isArray } from 'epdoc-util';
// import * as checksum from 'checksum';
import { DateUtil } from '@epdoc/timeutil';
import {
  DeepCopyOpts,
  Dict,
  Integer,
  asInt,
  compareDictValue,
  deepCopy,
  deepCopySetDefaultOpts,
  isBoolean,
  isError,
  isNonEmptyArray,
  isNonEmptyString,
  isNumber,
  isObject,
  isRegExp,
  isString,
  pad
} from '@epdoc/typeutil';
import checksum from 'checksum';
import * as fx from 'fs-extra';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import Pdfparser from 'pdf2json';

const REG = {
  pdf: /\.pdf$/i,
  xml: /\.xml$/i,
  json: /\.json$/i,
  txt: /\.txt$/i,
  leadingDot: new RegExp(/^\./)
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
  // Set to true to move the file rather than copy the file
  move: boolean;
  ensureDir: boolean; // Ensure the parent dest folder exists
  // if backup and index are not set, and this is set, then overwrite the old file
  overwrite: boolean;
  // backup dest as dest~, will overwrite previous backups
  backup: boolean;
  // add a count to the filename until we find one that isn't taken. If an integer, only allow this many counts to be tried.
  index: boolean | Integer;
  // don't actually move or copy the file, just execute the logic around it
  test: boolean;
}>;

export type FSUtilCallback = (fs: FSUtil) => Promise<any>;

export type GetChildrenOpts = {
  match: RegExp | string | undefined;
  levels: Integer;
  callback?: FSUtilCallback;
};

export function fsutil(...args: FSUtil[] | FilePath[] | FolderPath[]): FSUtil {
  return new FSUtil(...args);
}

export class FSStats {
  protected _isFSStats = true;
  public _stats: any;

  constructor(stats?: any) {
    if (stats) {
      this._stats = stats;
    }
  }

  static isInstance(val: any): val is FSStats {
    return val && val._isFSStats === true;
  }

  isInitialized(): boolean {
    return this._stats ? true : false;
  }

  clear(): this {
    this._stats = undefined;
    return this;
  }

  exists(): boolean {
    if (this._stats) {
      return this._stats.isDirectory() === true || this._stats.isFile() === true;
    }
    return false;
  }

  isDirectory(): boolean {
    if (this._stats) {
      return this._stats.isDirectory() === true;
    }
    return false;
  }

  isFile(): boolean {
    if (this._stats) {
      return this._stats.isFile() === true;
    }
    return false;
  }

  createdAt(): Date | undefined {
    if (this._stats) {
      return new Date(this._stats.birthtime || this._stats.mtime);
    }
  }

  modifiedAt(): Date | undefined {
    if (this._stats) {
      return new Date(this._stats.mtime);
    }
  }

  get size(): Integer {
    return this._stats ? this._stats.size : -1;
  }
}

export class FSUtil {
  protected _isFSUtil = true;
  // @ts-ignore
  protected f: FilePath | FolderPath;
  // @ts-ignore
  protected _stats: FSStats = new FSStats();
  protected _folders: FSUtil[] = [];
  protected _files: FSUtil[] = [];
  protected _args: (FilePath | FolderPath)[] = [];

  constructor(...args: FSUtil[] | FilePath[] | FolderPath[]) {
    if (args.length === 1) {
      if (FSUtil.isInstance(args[0])) {
        this.f = args[0].f;
        this._args = [args[0].f];
      } else if (isArray(args[0])) {
        this.f = path.resolve(args[0]);
        this._args = args[0];
      } else {
        this.f = args[0];
        this._args = [args[0]];
      }
    } else if (args.length > 1) {
      args.forEach((arg) => {
        if (FSUtil.isInstance(arg)) {
          throw new Error('Invalid parameter');
        }
        this._args.push(arg);
      });
      this.f = path.resolve(...(args as string[]));
    }
  }

  static isInstance(val: any): val is FSUtil {
    return val && val._isFSUtil === true;
  }

  add(...args: FilePath[] | FolderPath[]): this {
    if (args.length === 1) {
      if (isArray(args[0])) {
        this.f = path.resolve(this.f, ...args[0]);
        args[0].forEach((arg) => {
          this._args.push(arg);
        });
      } else {
        this.f = path.resolve(this.f, args[0]);
        this._args.push(args[0]);
      }
    } else if (args.length > 1) {
      this.f = path.resolve(this.f, ...args);
      args.forEach((arg) => {
        this._args.push(arg);
      });
    }
    return this;
  }

  /**
   * Set the path to the home dir
   */
  home(...args: FilePath[] | FolderPath[]): this {
    this.f = os.userInfo().homedir;
    this._args = [this.f];
    if (args) {
      this.add(...args);
    }
    return this;
  }

  get path(): FilePath {
    return this.f;
  }

  /**
   * Return the original parts that were used to make this.f. The value may
   * become out of sync with the actual value of this.f if too many operations
   * were performed on the path.
   */
  get parts(): string[] {
    return this._args;
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

  /**
   * Returns file.name.html portion of /path/to/file.name.html'
   */
  get filename(): string {
    return path.basename(this.f);
  }

  get files(): FSUtil[] {
    return this._files;
  }

  get folders(): FSUtil[] {
    return this._folders;
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
    if (!REG.leadingDot.test(ext)) {
      ext = '.' + ext;
    }
    if (ext !== this.extname) {
      this.f = path.format({ ...path.parse(this.f), base: '', ext: ext });
      this._stats.clear();
    }
    return this;
  }

  public getStats(force = false): Promise<FSStats> {
    if (force || !this._stats.isInitialized()) {
      return fs.promises
        .stat(this.f)
        .then((resp: fs.Stats) => {
          this._stats = new FSStats(resp);
          return Promise.resolve(this._stats);
        })
        .catch((err) => {
          this._stats = new FSStats();
          return Promise.resolve(this._stats);
        });
    } else {
      return Promise.resolve(this._stats);
    }
  }

  get stats(): FSStats {
    return this._stats;
  }

  async isDir(): Promise<boolean> {
    return this.getStats().then((resp) => {
      return this._stats.isDirectory();
    });
  }

  async isFile(): Promise<boolean> {
    return this.getStats().then((resp) => {
      return this._stats.isFile();
    });
  }

  async exists(): Promise<boolean> {
    return this.getStats().then((resp) => {
      return this._stats.isDirectory() || this._stats.isFile();
    });
  }

  async dirExists(): Promise<boolean> {
    return this.getStats().then((resp) => {
      return this._stats.isDirectory();
    });
  }

  async fileExists(): Promise<boolean> {
    return this.getStats().then((resp) => {
      return this._stats.isFile();
    });
  }

  async createdAt(): Promise<Date | undefined> {
    return this.getStats().then((resp) => {
      return this._stats.createdAt();
    });
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

  async copyTo(dest: FilePath | FSUtil, options?: fx.CopyOptions): Promise<void> {
    const p: FilePath = FSUtil.isInstance(dest) ? dest.path : dest;
    return fx.copy(this.f, p, options);
  }

  copySync(dest: FilePath | FSUtil, options?: fx.CopyOptionsSync): this {
    const p: FilePath = FSUtil.isInstance(dest) ? dest.path : dest;
    fx.copySync(this.f, p, options);
    return this;
  }

  async moveTo(dest: FilePath | FSUtil, options?: fx.MoveOptions): Promise<void> {
    const p: FilePath = FSUtil.isInstance(dest) ? dest.path : dest;
    return fx.move(this.f, p, options);
  }

  /**
   * Retrieve the list of matching files in dir. Returns just the filename, not
   * the full path.
   * @param regex (optional) Use to constrain results
   */
  async getFiles(regex?: RegExp): Promise<FileName[]> {
    return this.getChildren({ match: regex }).then(() => {
      const paths = this._files.map((fs) => {
        return fs.filename;
      });
      return Promise.resolve(paths);
    });
  }

  /**
   * Retrieve the list of matching folders in dir. Does not return the full
   * path.
   * @param regex (optional) Use to constrain results
   */
  async getFolders(regex?: RegExp): Promise<FolderPath[]> {
    return this.getChildren({ match: regex }).then(() => {
      const paths = this._folders.map((fs) => {
        return fs.path;
      });
      return Promise.resolve(paths);
    });
  }

  /**
   * Build the list of matching files and folders in the folder.
   * @param opts.match File or folder names must match this string or RegExp. If
   * not specified then file and folder names are not filtered.
   */
  async getChildren(options: Partial<GetChildrenOpts> = { levels: 1 }): Promise<this> {
    const opts: GetChildrenOpts = {
      match: options.match,
      levels: isNumber(options.levels) ? options.levels - 1 : 0,
      callback: options.callback
    };
    this._folders = [];
    this._files = [];
    return fs.promises
      .readdir(this.f)
      .then((entries) => {
        const jobs = [];
        for (const entry of entries) {
          const fs = fsutil(this.f, entry);
          let bMatch = false;
          if (opts.match) {
            if (isString(opts.match) && entry === opts.match) {
              bMatch = true;
            } else if (isRegExp(opts.match) && opts.match.test(entry)) {
              bMatch = true;
            }
          } else {
            bMatch = true;
          }
          if (bMatch) {
            const job = fs.getStats().then((stat: FSStats) => {
              if (opts.callback) {
                const job1 = opts.callback(fs);
                jobs.push(job1);
              }
              if (stat.isDirectory()) {
                this._folders.push(fs);
                if (opts.levels > 0) {
                  const job2 = fs.getChildren(opts);
                  jobs.push(job2);
                }
              } else if (stat.isFile()) {
                this._files.push(fs);
              }
            });
            jobs.push(job);
          }
        }
        return Promise.all(jobs);
      })
      .then((resp) => {
        return Promise.resolve(this);
      });
  }

  public sortFolders(): this {
    this.folders.sort((a, b) => {
      return compareDictValue(a, b, 'filename');
    });
    return this;
  }

  public sortFiles(): this {
    this.folders.sort((a, b) => {
      return compareDictValue(a, b, 'filename');
    });
    return this;
  }
  public sortFilesBySize(): this {
    this.folders.sort((a, b) => {
      return compareDictValue(a, b, 'size');
    });
    return this;
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
   * Get the Creation Date of a PDF file by reading it's metadata.
   * @param file
   */
  async getPdfDate(): Promise<Date | undefined> {
    return new Promise((resolve, reject) => {
      const pdfParser = new Pdfparser();
      pdfParser.on('readable', (resp: any) => {
        if (resp && resp.Meta && resp.Meta.CreationDate) {
          // const d = new Date(p[1], p[2], p[3], p[4], p[5], p[6]);
          // d.tim;
          const d = DateUtil.fromPdfDate(resp.Meta.CreationDate);
          resolve(d ? d.date : undefined);
        }
        resolve(new Date(0));
      });
      pdfParser.on('pdfParser_dataError', (errMsg: string) => {
        reject(this.newError(errMsg));
      });
      pdfParser.loadPDF(this.f);
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
    const buf = Buffer.from(JSON.stringify(data, null, 2), 'utf8');
    return fs.promises.writeFile(this.f, buf);
  }

  async writeBase64(data: string): Promise<void> {
    return this.write(data, 'base64');
  }

  async write(data: string | string[], type: BufferEncoding = 'utf8'): Promise<void> {
    if (isArray(data)) {
      data = data.join('\n');
    }
    const buf = Buffer.from(data, type);
    return fs.promises.writeFile(this.f, buf);
  }

  /**
   * Backup the file
   * @param opts
   * @returns Path to file if file was backed up, or true if the file doesn't exist
   */
  async backup(opts: SafeCopyOpts = {}): Promise<FilePath | boolean> {
    await this.getStats();

    if (this._stats && this._stats.exists()) {
      // this file already exists. Deal with it by renaming it.
      let newPath: FilePath | undefined = undefined;
      if (opts.backup) {
        newPath = this.path + '~';
      } else if (opts.index) {
        const limit = isBoolean(opts.index) ? 32 : asInt(opts.index);
        let newFsDest: FSUtil;
        let count = 0;
        let looking = true;
        while (looking) {
          newFsDest = fsutil(this.dirname, this.basename + '-' + pad(++count, 2) + this.extname);
          looking = await newFsDest.exists();
        }
        // @ts-ignore
        if (!looking && newFsDest) {
          newPath = newFsDest.path;
        } else {
          if (opts.errorOnExist) {
            throw this.newError('EEXIST', 'File exists');
          }
        }
      } else if (!opts.overwrite) {
        if (opts.errorOnExist) {
          throw this.newError('EEXIST', 'File exists');
        }
      }
      if (newPath) {
        return this.moveTo(newPath, { overwrite: true })
          .then((resp) => {
            return Promise.resolve(newPath as FilePath);
          })
          .catch((err) => {
            throw this.newError('ENOENT', 'File could not be renamed');
          });
      }
    } else if (opts.errorOnNoSource) {
      throw this.newError('ENOENT', 'File does not exist');
    }
    return Promise.resolve(true);
  }

  /**
   * Copy a file or directory. Optionally creates a backup if there is an existing file or directory at `destFile`.
   * @param srcFile
   * @param destFile
   * @param opts
   * @returns True if file was copied or moved, false otherwise
   */
  async safeCopy(destFile: FilePath | FSUtil, opts: SafeCopyOpts = {}): Promise<boolean | undefined> {
    await this.getStats();

    if (this._stats && this._stats.exists()) {
      const fsDest = FSUtil.isInstance(destFile) ? destFile : fsutil(destFile);
      await fsDest.getStats();

      let bGoAhead: FilePath | boolean = true;
      if (fsDest._stats.exists()) {
        bGoAhead = false;
        // The dest already exists. Deal with it
        bGoAhead = await fsDest.backup(opts);
      }

      if (bGoAhead) {
        if (opts.move) {
          return this.moveTo(fsDest.path, { overwrite: true }).then((resp) => {
            // console.log(`  Moved ${srcFile} to ${destPath}`);
            return Promise.resolve(true);
          });
        } else {
          return this.copyTo(fsDest.path, { overwrite: true }).then((resp) => {
            // console.log(`  Copied ${srcFile} to ${destPath}`);
            return Promise.resolve(true);
          });
        }
      } else {
        return Promise.resolve(false);
      }
    } else {
      if (opts.errorOnNoSource) {
        throw this.newError('ENOENT', 'File does not exist');
      }
    }

    return Promise.resolve(false);
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
