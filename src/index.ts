// import * as checksum from 'checksum';
import { isString } from 'epdoc-util';
import fs from 'fs';
import * as fx from 'fs-extra';
import path from 'path';
import * as pdf from 'pdf-parse';

export type FilePath = string;
export type FolderPath = string;
export type FileName = string;
export type FileExt = string; // includes '.'

export function fsEnsureDir(dir: FolderPath, options?: fx.EnsureDirOptions | number): Promise<void> {
  return fx.ensureDir(dir, options);
}

export function fsEnsureDirSync(dir: FolderPath, options?: fx.EnsureDirOptions | number): void {
  return fx.ensureDirSync(dir, options);
}

export function fsRemove(dir: string): Promise<void> {
  return fx.remove(dir);
}

export function fsCopy(src: FilePath, dest: FilePath, options?: fx.CopyOptions): Promise<void> {
  return fx.copy(src, dest, options);
}

export function fsCopySync(src: FilePath, dest: FilePath, options?: fx.CopyOptionsSync): void {
  return fx.copySync(src, dest, options);
}

export function fsMove(src: FilePath, dest: FilePath, options?: fx.MoveOptions): Promise<void> {
  return fx.move(src, dest, options);
}

/**
 * Retrieve the list of matching folders in dir.
 * @param dir
 * @param regex
 */
export function fsGetFolders(dir: FolderPath, regex?: RegExp): Promise<FolderPath[]> {
  const results: FolderPath[] = [];
  return fs.promises
    .readdir(dir)
    .then((entries) => {
      const jobs = [];
      for (const entry of entries) {
        const fullPath: FolderPath = path.resolve(dir, entry);
        const job = isDir(fullPath).then((bIsDir) => {
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
export function fsGetPdfDate(file: FilePath): Promise<Date | undefined> {
  return fs.promises
    .readFile(file)
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
export function fsChecksum(file: FilePath) {
  return new Promise((resolve, reject) => {
    // @ts-ignore
    checksum.file(file, (err, sum) => {
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
export function fsEqual(path1: FilePath, path2: FilePath): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const job1 = fsChecksum(path1);
    const job2 = fsChecksum(path2);
    return Promise.all([job1, job2]).then((resps) => {
      if (resps && resps.length === 2 && resps[0] === resps[1]) {
        resolve(true);
      } else {
        resolve(false);
      }
    });
  });
}

export async function fsReadJson(file: FilePath): Promise<any> {
  return new Promise((resolve, reject) => {
    fs.readFile(file, 'utf8', (err, data) => {
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

export function fsWriteJson(file: FilePath, data: any): Promise<void> {
  const buf = Buffer.from(JSON.stringify(data, null, '  '));
  return fs.promises.writeFile(file, buf);
}

export async function fsWriteBase64(file: FilePath, data: string): Promise<void> {
  const buf = Buffer.from(data, 'base64');
  return fs.promises.writeFile(file, buf);
}

export async function isDir(p: FolderPath): Promise<boolean> {
  return fsDirExists(p);
}

export async function fsExists(p: FilePath | FolderPath): Promise<boolean> {
  try {
    const resp: fs.Stats = await fs.promises.stat(p);
    return resp.isDirectory() || resp.isFile();
  } catch (err) {
    return Promise.resolve(false);
  }
}

export async function fsDirExists(p: FolderPath): Promise<boolean> {
  try {
    const resp: fs.Stats = await fs.promises.stat(p);
    return resp.isDirectory();
  } catch (err) {
    return Promise.resolve(false);
  }
}

export async function fsFileExists(p: FilePath): Promise<boolean> {
  return fs.promises
    .stat(p)
    .then((resp: fs.Stats) => {
      return resp.isFile();
    })
    .catch((err) => {
      return Promise.resolve(false);
    });
}

export async function fsCreatedAt(p: FilePath): Promise<Date> {
  return fs.promises
    .stat(p)
    .then((stats: fs.Stats) => {
      // const birthTime: Stats.birthtimeMs = stats.birthtime;
      return new Date(stats.birthtime || stats.mtime);
    })
    .catch((err) => {
      return Promise.reject(err);
    });
}

export type FsSafeCopyOpts = Partial<{
  errorOnNoSource: boolean;
  errorOnExist: boolean;
  move: boolean; // Set to true to move the file rather than copy the file
  ensureDir: boolean; // Ensure the parent dest folder exists
  overwrite: boolean; // if backup and index are not set, and this is set, then overwrite the old file
  backup: boolean; // backup dest as dest~, will overwrite previous backups
  index: boolean; // add a count to the filename until we find one that isn't taken
  test: boolean; // don't actually move or copy the file, just execute the logic around it
}>;

/**
 * Copy a file or directory.
 * @param srcFile
 * @param destFile
 * @param opts
 * @returns True if file was copied or moved, false otherwise
 */
export async function fsSafeCopy(
  srcFile: FilePath,
  destFile: FilePath,
  opts: FsSafeCopyOpts = {}
): Promise<boolean | undefined> {
  return fsFileExists(srcFile).then((sourceExists) => {
    let destFileExists: boolean;
    let destPath: FilePath = destFile;
    const destDir: FolderPath = path.dirname(destFile);
    if (sourceExists) {
      return fsFileExists(destFile)
        .then((resp) => {
          destFileExists = resp;
          if (opts.ensureDir) {
            return fsEnsureDir(destDir);
          }
        })
        .then(() => {
          return fsDirExists(destDir);
        })
        .then((destDirExists) => {
          if (destFileExists) {
            if (opts.backup) {
              const bakDest: FilePath = destFile + '~';
              return fsMove(destFile, bakDest, { overwrite: true }).then((resp) => {
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
                  throw newError('EEXIST', 'File exists: ' + destFile);
                }
                return Promise.resolve(false);
              }
            } else if (!opts.overwrite) {
              if (opts.errorOnExist) {
                throw newError('EEXIST', 'File exists: ' + destFile);
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
                return fsMove(srcFile, destPath, { overwrite: true }).then((resp) => {
                  // console.log(`  Moved ${srcFile} to ${destPath}`);
                  return Promise.resolve(true);
                });
              }
            } else {
              if (opts.test) {
                // console.log(`  Skipped copy ${srcFile} to ${destPath}`);
              } else {
                return fsCopy(srcFile, destPath, { overwrite: true }).then((resp) => {
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
        throw newError('ENOENT', 'File does not exist: ' + srcFile);
      }
    }
  });
}

export function newError(code: string, message: string): Error {
  let err: Error = new Error(message);
  // @ts-ignore
  err.code = code;
  return err;
}
