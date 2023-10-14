import { expect, test } from 'bun:test';
import { isArray } from 'epdoc-util';
import { fsGetFolders } from '../dist';

test('isDir', () => {
  return isDir('./files').then((resp) => {
    expect(resp).toBe(true);
  });
});
test('fsGetFolders', () => {
  return fsGetFolders('.').then((resp) => {
    expect(isArray(resp)).toBe(true);
  });
});
