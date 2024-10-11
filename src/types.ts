import { type DeepCopyOpts, type Integer, isNonEmptyString } from '@epdoc/typeutil';
import * as dfs from '@std/fs';
import type { FSItem } from './fsitem.ts';

/**
 * Represents a file path.
 */
export type FilePath = string;

/**
 * Represents a folder path.
 */
export type FolderPath = string;

/**
 * Represents a file name including it's extension.
 */
export type FileName = string;

/**
 * Represents a file extension, excluding the leading dot (e.g., 'txt').
 */
export type FileExt = string;

/**
 * Represents a folder name.
 */
export type FolderName = string;

/**
 * Type guard checks if the given value is a valid file name.
 *
 * @param {unknown} val The value to check.
 * @returns True if the value is a non-empty string, false otherwise.
 */
export function isFilename(val: unknown): val is FileName {
  return isNonEmptyString(val);
}

/**
 * Type guard checks if the given value is a valid folder path.
 *
 * @param val The value to check.
 * @returns True if the value is a non-empty string, false otherwise.
 */
export function isFolderPath(val: unknown): val is FolderPath {
  return isNonEmptyString(val);
}

/**
 * Type guard checks if the given value is a valid file path.
 *
 * @param val The value to check.
 * @returns True if the value is a non-empty string, false otherwise.
 */
export function isFilePath(val: unknown): val is FilePath {
  return isNonEmptyString(val);
}

export type FsDeepCopyOpts = DeepCopyOpts & {
  includeUrl?: unknown;
};

/**
 * Represents the possible conflict resolution strategies for a file.
 */
export type FileConflictStrategy =
  | { type: 'renameWithTilde'; errorIfExists?: boolean }
  | { type: 'renameWithNumber'; separator?: string; limit?: Integer; errorIfExists?: boolean }
  | { type: 'overwrite'; errorIfExists?: boolean }
  | { type: 'error'; errorIfExists?: boolean };

/**
 * A mapping of conflict strategy types to their string representations.
 */
export const fileConflictStrategyType = {
  renameWithTilde: 'renameWithTilde',
  renameWithNumber: 'renameWithNumber',
  overwrite: 'overwrite',
  error: 'error',
} as const;

/**
 * Type representing the possible conflict strategy types.
 * This type is derived from the keys of the `fileConflictStrategyType` object.
 */
export type FileConflictStrategyType =
  (typeof fileConflictStrategyType)[keyof typeof fileConflictStrategyType];

/**
 * Checks if a given value is a valid FileConflictStrategyType.
 *
 * @param value The value to check.
 * @returns True if the value is a valid FileConflictStrategyType, false otherwise.
 */
export function isFileConflictStrategyType(value: unknown): value is FileConflictStrategyType {
  return typeof value === 'string' && value in Object.keys(fileConflictStrategyType);
}

// export type BackupOpts = Partial<{
//   /** Do a simple backup by renaming the file with a `~` appended, overwriting unknown previous backups with this same name. If a string then append this string. */
//   backup: boolean | string;
//   /** If set and backup is not set, do a backup by renaming the file with a count appended to it's `basename`. If an integer, only allow this many counts to be tried. */
//   index: boolean | Integer;
//   /** Separator to uses before the index */
//   sep: string;
//   /** if backup and index are not set, and this is set, then overwrite the old file */
//   overwrite: boolean;
//   /** If true then throw an error if this file does not exist */
//   errorOnNoSource: boolean;
//   /** If true then throw an error if a backup could not be completed because this filename is taken. */
//   errorOnExist: boolean;
// }>;

// export type SafeCopyOpts2 = BackupOpts &
//   Partial<{
//     /** Set to true to move the file rather than copy the file */
//     move: boolean;
//     /** Ensure the parent dest folder exists. Not used with #backup method. */
//     ensureDir: boolean;
//     /** don't actually move or copy the file, just execute the logic around it */
//     test: boolean;
//   }>;

/**
 * Represents the options for the safeCopy method.
 */
export type SafeCopyOpts = {
  /**
   * Whether to move or copy the file.
   */
  move?: boolean;
  /**
   * The strategy to use when a file with the same name already exists.
   */
  conflictStrategy?: FileConflictStrategy;
  /**
   * Whether to ensure the parent directories exist before the operation.
   */
  ensureParentDirs?: boolean;
  /**
   * Don't actually move or copy the file, just execute the logic around it
   */
  test?: boolean;
};

export type FSSortOpts = {
  type?: 'alphabetical' | 'size';
  direction?: 'ascending' | 'descending';
};

export type FSItemCallback = (fs: FSItem) => Promise<unknown>;
export type WalkOptions = dfs.WalkOptions &
  Partial<{
    sort?: FSSortOpts;
    callback?: FSItemCallback;
  }>;

// export type RemoveOpts = Partial<{
//   maxRetries: Integer;
//   recursive: boolean;
//   retryDelay: Integer;
// }>;
