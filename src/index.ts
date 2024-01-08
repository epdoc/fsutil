// import * as checksum from 'checksum';
import checksum from 'checksum';
import { isString } from 'epdoc-util';
import fs from 'fs';
import * as fx from 'fs-extra';
import path from 'path';
import * as pdf from 'pdf-parse';

export type FilePath = string;
export type FolderPath = string;
export type FileName = string;
export type FileExt = string; // includes '.'

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
  private f: FilePath | FolderPath;

  constructor(...args: FilePath[] | FolderPath[]) {
    if (args.length === 1) {
      this.f = args[0];
    } else {
      this.f = path.resolve(...args);
    }
  }

  get path(): FilePath {
    return this.f;
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
   * Retrieve the list of matching folders in dir.
   * @param dir
   * @param regex
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
                results.push(fullPath);
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
    return fs.promises
      .readFile(this.f)
      .then((dataBuffer) => {
        // @ts-ignore
        return pdf.default(dataBuffer);
      })
      .then((data) => {
        if (data && data.info && isString(data.info.CreationDate)) {
          let ds = data.info.CreationDate;
          ds = ds.replace(/^D:/, '');
          const d: Date = new Date(
            parseInt(ds.slice(0, 4), 10),
            parseInt(ds.slice(4, 6), 10) - 1,
            parseInt(ds.slice(6, 8), 10)
          );
          // console.log(d.toString());
          return Promise.resolve(d);
        }
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
          reject(err);
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
          reject(err);
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
          reject(err);
        } else {
          try {
            const json = JSON.parse(data.toString());
            resolve(json);
          } catch (error) {
            reject(error);
          }
        }
      });
    });
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
        return Promise.reject(err);
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

  newError(code: string, message: string): Error {
    let err: Error = new Error(`${message}: ${this.f}`);
    // @ts-ignore
    err.code = code;
    return err;
  }
}
