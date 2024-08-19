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
  isArray,
  isBoolean,
  isDict,
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
import { readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import Pdfparser from 'pdf2json';
import { FSStats } from './fsstats';

const REG = {
  pdf: /\.pdf$/i,
  xml: /\.xml$/i,
  json: /\.json$/i,
  txt: /\.(txt|text)$/i,
  leadingDot: new RegExp(/^\./),
  BOM: new RegExp(/^\uFEFF/)
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

export type BackupOpts = Partial<{
  /** Do a simple backup by renaming the file with a `~` appended, overwriting any previous backups with this same name. If a string then append this string. */
  backup: boolean | string;
  /** If set and backup is not set, do a backup by renaming the file with a count appended to it's `basename`. If an integer, only allow this many counts to be tried. */
  index: boolean | Integer;
  /** Separator to uses before the index */
  sep: string;
  /** if backup and index are not set, and this is set, then overwrite the old file */
  overwrite: boolean;
  /** If true then throw an error if this file does not exist */
  errorOnNoSource: boolean;
  /** If true then throw an error if a backup could not be completed because this filename is taken. */
  errorOnExist: boolean;
}>;

export type SafeCopyOpts = BackupOpts &
  Partial<{
    /** Set to true to move the file rather than copy the file */
    move: boolean;
    /** Ensure the parent dest folder exists. Not used with #backup method. */
    ensureDir: boolean;
    /** don't actually move or copy the file, just execute the logic around it */
    test: boolean;
  }>;

export type FSSortOpts = {
  type?: 'alphabetical' | 'size';
  direction?: 'ascending' | 'descending';
};

export type FSItemCallback = (fs: FSItem) => Promise<any>;
export type GetChildrenOpts = FSSortOpts & {
  match: RegExp | string | undefined;
  levels: Integer;
  sort?: FSSortOpts;
  callback?: FSItemCallback;
};

/**
 * Create a new FSItem object.
 * @param {(FSItem | FolderPath | FilePath)[])} args - An FSItem, a path, or a spread of paths to be used with path.resolve
 * @returns {FSItem} - A new FSItem object
 */
export function fsitem(...args: (FSItem | FolderPath | FilePath)[]): FSItem {
  return new FSItem(...args);
}

/**
 * An object representing a file system entry, which may be either a file or a
 * folder.
 *
 * Has methods to:
 *  - Retrieve properties of an existing file or folder.
 *  - Manipulate file paths.
 *  - Recursive support for reading the contents of folders
 *  - Safe copy and backup methods for an existing file or folder
 *  - Reading and writing files
 *  - Getting the creation dates of files, including using the metadata of some file formats
 *  - Testing files for equality
 */
export class FSItem {
  protected _isFSItem = true;
  // @ts-ignore
  protected _f: FilePath | FolderPath;
  // @ts-ignore
  protected _stats: FSStats = new FSStats();
  // Test to see if _folders and _files have been read
  protected _haveReadFolderContents: boolean = false;
  // If this is a folder, contains a filtered list of folders within this folder
  protected _folders: FSItem[] = [];
  // If this is a folder, contains a filtered list of files within this folder
  protected _files: FSItem[] = [];
  // Stores the strings that were used to create the path. This property may be deprecated at any time.
  protected _args: (FilePath | FolderPath)[] = [];

  /**
   * Create a new FSItem object from an existing FSItem object, a file path or
   * an array of file path parts that can be merged using node:path#resolve.
   * @param {(FSItem | FolderPath | FilePath)[])} args - An FSItem, a path, or a spread of paths to be used with path.resolve
   */
  constructor(...args: (FSItem | FolderPath | FilePath)[]) {
    if (args.length === 1) {
      const arg = args[0];
      if (FSItem.isInstance(arg)) {
        this._f = arg._f;
        this._args = arg._args.map((item) => {
          return item;
        });
        this._stats = arg._stats.copy();
        this._haveReadFolderContents = arg._haveReadFolderContents;
        this._folders = arg._folders.map((item) => {
          return item.copy();
        });
        this._files = arg._files.map((item) => {
          return item.copy();
        });
      } else if (isArray(arg)) {
        if (
          arg.find((item) => {
            return !isString(item);
          })
        ) {
          throw new Error('Invalid parameter');
        } else {
          this._f = path.resolve(arg);
          this._args = arg;
        }
      } else if (isString(arg)) {
        this._f = arg;
        this._args = [arg];
      }
    } else if (args.length > 1) {
      args.forEach((arg) => {
        if (isString(arg)) {
          this._args.push(arg);
        } else {
          throw new Error('Invalid parameter');
        }
      });
      this._f = path.resolve(...(args as string[]));
    }
  }

  /**
   * Return a copy of this object. Does not copy the file.
   * @see FSItem#copyTo
   */
  copy(): FSItem {
    return new FSItem(this);
  }

  /**
   * Test if val is an FSItem object. Can be used as a typescript type gate.
   * @param val Any object
   * @returns
   */
  static isInstance(val: any): val is FSItem {
    return isDict(val) && val._isFSItem === true;
  }

  /**
   * Append a file or folder name to this.f.
   * @param args A file name or array of file names.
   * @returns This
   */
  add(...args: FilePath[] | FolderPath[]): this {
    if (args.length === 1) {
      if (isArray(args[0])) {
        this._f = path.resolve(this._f, ...args[0]);
        args[0].forEach((arg) => {
          this._args.push(arg);
        });
      } else {
        this._f = path.resolve(this._f, args[0]);
        this._args.push(args[0]);
      }
    } else if (args.length > 1) {
      this._f = path.resolve(this._f, ...args);
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
    this._f = os.userInfo().homedir;
    this._args = [this._f];
    if (args) {
      this.add(...args);
    }
    return this;
  }

  get path(): FilePath {
    return this._f;
  }

  /**
   * Return the original parts that were used to make this.f. The value may
   * become out of sync with the actual value of this.f if too many operations
   * were performed on the path.
   * Use with caution. This may be deprecated.
   */
  get parts(): string[] {
    return this._args;
  }

  /**
   * Returns 'file.name' portion of /path/to/file.name.html'. Unlike
   * path.basename, this does NOT include the extension.
   */
  get basename(): string {
    return path.basename(this._f).replace(/\.[^\.]*$/, '');
  }

  /**
   * Returns '/path/to' portion of /path/to/file.name.html'
   */
  get dirname(): string {
    return path.dirname(this._f);
  }

  /**
   * Returns 'html' portion of /path/to/file.name.html'
   */
  get extname(): string {
    return path.extname(this._f);
  }

  /**
   * Returns file.name.html portion of /path/to/file.name.html'
   */
  get filename(): string {
    return path.basename(this._f);
  }

  /**
   * For folders, indicates if we have read the folder's contents.
   * @returns
   */
  haveReadFolderContents(): boolean {
    return this._haveReadFolderContents;
  }

  /**
   * Get the list of FSItem files that matched a previous call to getFiles() or
   * getChildren().
   */
  get files(): FSItem[] {
    return this._files;
  }

  /**
   * Get the list of filenames that matched a previous call to getFolders() or
   * getChildren().
   */
  get filenames(): FileName[] {
    return this._files.map((fs) => {
      return fs.filename;
    });
  }

  /**
   * Get the list of FSItem folders that matched a previous call to getFolders() or
   * getChildren().
   */
  get folders(): FSItem[] {
    return this._folders;
  }

  /**
   * Get the list of folder names that matched a previous call to getFolders() or
   * getChildren().
   */
  get folderNames(): FileName[] {
    return this._folders.map((fs) => {
      return fs.filename;
    });
  }

  /**
   * Looks at the extension of the filename to determine if it is one of the
   * listed types.
   * @param type List of types (eg. 'jpg', 'png')
   * @returns
   */
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

  /**
   * Tests the extension to see if this is a PDF file.
   * @returns True if the extension indicates this is a PDF file.
   */
  isPdf(): boolean {
    return REG.pdf.test(this.extname);
  }

  /**
   * Tests the extension to see if this is an XML file.
   * @returns True if the extension indicates this is an XML file.
   */
  isXml(): boolean {
    return REG.xml.test(this.extname);
  }

  /**
   * Tests the extension to see if this is a text file.
   * @returns True if the extension indicates this is a text file.
   */
  isTxt(): boolean {
    return REG.txt.test(this.extname);
  }

  /**
   * Tests the extension to see if this is a JSON file.
   * @returns True if the extension indicates this is a JSON file.
   */

  isJson(): boolean {
    return REG.json.test(this.extname);
  }

  /**
   * Set or change the extension of this file. `This` must be a file.
   * @param ext The extension. The string may or may include a leading '.'.
   * @returns
   */
  setExt(ext: string): this {
    if (!REG.leadingDot.test(ext)) {
      ext = '.' + ext;
    }
    if (ext !== this.extname) {
      this._f = path.format({ ...path.parse(this._f), base: '', ext: ext });
      this._stats.clear();
    }
    return this;
  }

  /**
   * Set or change the basename of this file. `This` must be a file.
   * @param val The extension. The string may or may include a leading '.'.
   * @returns
   */
  setBasename(val: string): this {
    if (val !== this.basename) {
      this._f = path.format({ dir: this.dirname, name: val, ext: this.extname });
      this._stats.clear();
    }
    return this;
  }

  /**
   * Return the FSSTATS for this file, retrieving the stats and referencing them
   * with this._stats if they have not been previously read. FSSTATS can become
   * stale and should be reread if a file is manipulated.
   *
   * Example `fsutil('mypath/file.txt').getStats().isFile()`.
   *
   * @param {boolean} force Force retrieval of the states, even if they have
   * already been retrieved.
   * @returns {Promise<FSStats>} A promise with an FSStats object
   */
  public getStats(force = false): Promise<FSStats> {
    if (force || !this._stats.isInitialized()) {
      return fs.promises
        .stat(this._f)
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

  /**
   * Getter returns the FSStats object associated with this file. A previous
   * call to getStats() is needed in order to read stats from disk.
   * @return {FSStats} - The FSStats for this file, if they have been read.
   */
  get stats(): FSStats {
    return this._stats;
  }

  /**
   * Is this a folder? Will retrieve the FSStats for the file system entry if
   * they haven't been previously read.
   * @returns a promise with value true if this is a folder.
   */
  async isDirectory(): Promise<boolean> {
    return this.getStats().then((resp) => {
      return this._stats.isDirectory();
    });
  }

  /**
   * Calls the FSItem#isDirectory method.
   * @returns {Prommise<boolean>}
   * @see FSItem#isDirectory
   */
  async isDir(): Promise<boolean> {
    return this.isDirectory();
  }

  /**
   * Calls the FSItem#isDirectory method.
   * @returns {Prommise<boolean>}
   * @see FSItem#isDirectory
   */
  async isFolder(): Promise<boolean> {
    return this.isDirectory();
  }

  /**
   * Is this a file? Will retrieve the FSStats for the file system entry if they
   * haven't been previously read.
   * @returns a promise with value true if this is a file.
   */
  async isFile(): Promise<boolean> {
    return this.getStats().then((resp) => {
      return this._stats.isFile();
    });
  }

  /**
   * Does this file or folder exist? Will retrieve the FSStats for the file
   * system entry if they haven't been previously read.
   * @returns a promise with value true if this exists.
   */
  async exists(): Promise<boolean> {
    return this.getStats().then((resp) => {
      return this._stats.isDirectory() || this._stats.isFile();
    });
  }

  /**
   * Is this a folder? Will retrieve the FSStats for the file system entry if
   * they haven't been previously read.
   * @returns a promise with value true if this is a folder.
   * @deprecated Use isDir() method instead.
   */
  async dirExists(): Promise<boolean> {
    return this.isDir();
  }

  /**
   * Is this a file? Will retrieve the FSStats for the file system entry if they
   * haven't been previously read.
   * @returns a promise with value true if this is a file.
   * @deprecated Use isFile() method instead.
   */
  async fileExists(): Promise<boolean> {
    return this.isFile();
  }

  /**
   * When was this file system entry created? Will retrieve the FSStats for the
   * file system entry if they haven't been previously read.
   * @returns a promise with the Date this file was created.
   * @deprecated Use isFile() method instead.
   */
  async createdAt(): Promise<Date | undefined> {
    return this.getStats().then((resp) => {
      return this._stats.createdAt();
    });
  }

  /**
   * Test for equality with the basename of this file.
   * @param {string} name
   * @returns {boolean} True if equal
   */
  isNamed(name: string): boolean {
    return name === this.basename;
  }

  /**
   * Ensures there is a folder with this path.
   * @param options
   * @returns
   */
  async ensureDir(options?: fx.EnsureDirOptions | number): Promise<unknown> {
    return fx.ensureDir(this._f, options);
  }

  /**
   * Syncronous version of `ensureDir`.
   * @param options
   * @returns
   */
  ensureDirSync(options?: fx.EnsureDirOptions | number): this {
    fx.ensureDirSync(this._f, options);
    return this;
  }

  /**
   * Removes this file or folder.
   * @returns
   */
  async remove(): Promise<void> {
    return fx.remove(this._f);
  }

  /**
   * Copy this file or folder to the location `dest`.
   * @param dest
   * @param options An fx.CopyOptions object
   * @returns
   */
  async copyTo(dest: FilePath | FSItem, options?: fx.CopyOptions): Promise<void> {
    const p: FilePath = FSItem.isInstance(dest) ? dest.path : dest;
    return fx.copy(this._f, p, options);
  }

  /**
   * Syncronous version of `copyTo` method.
   * @param dest
   * @param options An fx.CopyOptionsSync object
   * @returns
   */
  copySync(dest: FilePath | FSItem, options?: fx.CopyOptionsSync): this {
    const p: FilePath = FSItem.isInstance(dest) ? dest.path : dest;
    fx.copySync(this._f, p, options);
    return this;
  }

  /**
   * Move `this` file or folder to the location `dest`.
   * @param {FilePath | FSItem} dest - The new path for the file
   * @param {fx.MoveOptions} options - Options to `overwrite` and `dereference` symlinks.
   * @returns {Promise<void>}
   */
  async moveTo(dest: FilePath | FSItem, options?: fx.MoveOptions): Promise<void> {
    const p: FilePath = FSItem.isInstance(dest) ? dest.path : dest;
    return fx.move(this._f, p, options);
  }

  /**
   * If this is a folder, retrieves the list of matching files in this folder.
   * Repopulates this._files and this._folders in the process. Returns just the
   * filenames, not the full path.
   * @param regex (optional) Use to constrain results
   * @return Array of files within the folder
   */
  async getFiles(regex?: RegExp): Promise<FSItem[]> {
    return this.getChildren({ match: regex }).then(() => {
      return Promise.resolve(this._files);
    });
  }

  /**
   * If this is a folder, retrieves the list of matching folders in this folder.
   * Repopulates this._files and this._folders in the process. Returns just the
   * folder names, not the full path.
   * @param regex (optional) Use to constrain results
   * @return Array of folders with the folder
   */
  async getFolders(regex?: RegExp): Promise<FSItem[]> {
    return this.getChildren({ match: regex }).then(() => {
      return Promise.resolve(this._folders);
    });
  }

  /**
   * If this is a folder, retrieves the list of matching files and folders in
   * this folder and stores the lists as this._files and this._folders.
   * @param opts.match (Optional) File or folder names must match this string or
   * RegExp. If not specified then file and folder names are not filtered.
   * @return {Promise<FSItem[]> - Array of all files and folders within this folder
   */
  async getChildren(options: Partial<GetChildrenOpts> = { levels: 1 }): Promise<FSItem[]> {
    const opts: GetChildrenOpts = {
      match: options.match,
      levels: isNumber(options.levels) ? options.levels - 1 : 0,
      callback: options.callback,
      sort: isDict(options.sort) ? options.sort : {}
    };
    const all: FSItem[] = [];
    this._folders = [];
    this._files = [];
    this._haveReadFolderContents = false;
    return fs.promises
      .readdir(this._f)
      .then((entries) => {
        const jobs: Promise<any>[] = [];
        for (const entry of entries) {
          const fs = fsitem(this._f, entry);
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
              all.push(fs);
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
        this._haveReadFolderContents = true;
        if (isDict(opts.sort)) {
          this.sortChildren(opts.sort);
        }
        return Promise.resolve(all);
      });
  }

  public sortChildren(opts: FSSortOpts = {}) {
    this.sortFolders();
    if (opts.type === 'alphabetical') {
      this.sortFiles();
    } else if (opts.type === 'size') {
      this.sortFilesBySize();
    }
    if (opts.direction === 'descending') {
      this.folders.reverse();
      this.files.reverse();
    }
  }

  public sortFolders(): this {
    this.folders.sort((a, b) => {
      return compareDictValue(a, b, 'filename');
    });
    return this;
  }

  public sortFiles(): this {
    this.files.sort((a, b) => {
      return compareDictValue(a, b, 'filename');
    });
    return this;
  }
  public sortFilesBySize(): this {
    this.files.sort((a, b) => {
      return compareDictValue(a, b, 'size');
    });
    return this;
  }

  /**
   * For files, calculate the checksum of this file
   */
  async checksum() {
    return new Promise((resolve, reject) => {
      // @ts-ignore
      checksum.file(this._f, (err, sum) => {
        if (err) {
          reject(this.newError(err));
        } else {
          resolve(sum);
        }
      });
    });
  }

  /**
   * For PDF files, gets the Creation Date of this file file by reading it's
   * metadata.
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
      pdfParser.on('pdfParser_dataError', (errObj: Record<'parserError', Error>) => {
        reject(this.newError(errObj.parserError));
      });
      pdfParser.loadPDF(this._f);
    });
  }

  /**
   * Use checksums to test if this file is equal to path2
   * @param path2
   */
  async filesEqual(path2: FilePath): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const job1 = this.isFile();
      const job2 = fsitem(path2).isFile();
      return Promise.all([job1, job2]).then((resps) => {
        if (resps && resps.length === 2 && resps[0] === true && resps[1] === true) {
          const job3 = this.checksum();
          const job4 = new FSItem(path2).checksum();
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

  async readAsBuffer(): Promise<Buffer> {
    return readFile(this._f).catch((err) => {
      throw this.newError(err);
    });
  }

  async readAsString(): Promise<any> {
    return new Promise((resolve, reject) => {
      fs.readFile(this._f, 'utf8', (err, data) => {
        if (err) {
          reject(this.newError(err));
        } else {
          // Remove BOM, if present
          resolve(data.replace(REG.BOM, '').toString());
        }
      });
    });
  }

  async readJson(): Promise<any> {
    return new Promise((resolve, reject) => {
      fs.readFile(this._f, 'utf8', (err, data) => {
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
        const fs = new FSItem(this.dirname, p[2]);
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
    return fs.promises.writeFile(this._f, buf);
  }

  async writeBase64(data: string): Promise<void> {
    return this.write(data, 'base64');
  }

  async write(data: string | string[], type: BufferEncoding = 'utf8'): Promise<void> {
    if (isArray(data)) {
      data = data.join('\n');
    }
    const buf = Buffer.from(data, type);
    return fs.promises.writeFile(this._f, buf);
  }

  /**
   * 'Backup' a file by moving it to a new filename. Use when copying a file to
   * the same location or creating a new file at the same location.
   * @param {BackupOpts} opts
   * @returns {Promise<FilePath | boolean>} - Path to file if file was backed
   * up, or true if the file didn't exist
   */
  async backup(opts: BackupOpts = {}): Promise<FilePath | boolean> {
    await this.getStats();

    if (this._stats && this._stats.exists()) {
      // this file already exists. Deal with it by renaming it.
      let newPath: FilePath | undefined = undefined;
      if (opts.backup) {
        newPath = this.path + isNonEmptyString(opts.backup) ? (opts.backup as string) : '~';
      } else if (opts.index) {
        const limit = isBoolean(opts.index) ? 32 : asInt(opts.index);
        newPath = await this.findAvailableIndexFilename(limit, opts.sep);
        if (!newPath && opts.errorOnExist) {
          throw this.newError('EEXIST', 'File exists');
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
   * Finds the next available indexed filename. For example, for `filename.ext`,
   * tries `filename-01.ext`, `filename-02.ext`, etc until it finds a filename
   * that is not used.
   * @param {Integer} limit
   * @param {string} sep
   * @returns - Promise with an available file path, or undefined if not found
   */
  async findAvailableIndexFilename(limit: Integer = 32, sep: string = '-'): Promise<FilePath | undefined> {
    let newFsDest: FSItem | undefined;
    let count = 0;
    let looking = true;
    while (looking) {
      newFsDest = fsitem(this.dirname, this.basename + sep + pad(++count, 2) + this.extname);
      looking = await newFsDest.exists();
    }
    if (!looking && FSItem.isInstance(newFsDest)) {
      return newFsDest.path;
    }
  }

  /**
   * Copy an existing file or directory to a new location. Optionally creates a
   * backup if there is an existing file or directory at `destFile`.
   * @param srcFile
   * @param destFile
   * @param opts
   * @returns True if file was copied or moved, false otherwise
   */
  async safeCopy(destFile: FilePath | FSItem, opts: SafeCopyOpts = {}): Promise<boolean | undefined> {
    await this.getStats();

    if (this._stats && this._stats.exists()) {
      const fsDest = FSItem.isInstance(destFile) ? destFile : fsitem(destFile);
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
      code.message = `${code.message}: ${this._f}`;
      return code;
    }
    let err: Error = new Error(`${message}: ${this._f}`);
    // @ts-ignore
    err.code = code;
    return err;
  }
}
