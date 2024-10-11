import { expect } from 'jsr:@std/expect';
import { describe, test } from 'jsr:@std/testing/bdd';
import { Buffer } from 'node:buffer';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { type FileCategory, type FileType, FSBytes } from '../mod.ts';

describe('FSBytes', () => {
  const testFilesDir = path.join(__dirname, 'data', 'test-files');

  const testFile = (filename: string, expectedType: FileType, expectedCategory: FileCategory) => {
    test(`detects ${filename} correctly`, () => {
      const filePath = path.join(testFilesDir, filename);
      const buffer = fs.readFileSync(filePath);
      const fsBytes = new FSBytes(buffer);

      expect(fsBytes.getType()).toBe(expectedType);
      expect(fsBytes.getCategory()).toBe(expectedCategory);
    });
  };

  testFile('sample.pdf', 'pdf', 'document');
  testFile('image.jpg', 'jpg', 'image');
  testFile('image.gif', 'gif', 'image');
  testFile('image2.gif', 'gif', 'image');
  testFile('audio.mp3', 'mp3', 'audio');
  testFile('video.mp4', 'mp4', 'video');
  testFile('archive.zip', 'zip', 'archive');
  testFile('font.ttf', 'ttf', 'font');
  // testFile('balloon.j2c', 'j2c', 'image');
  testFile('balloon.jp2', 'jp2', 'image');
  testFile('balloon.jpf', 'jpf', 'image');
  testFile('balloon.jpm', 'jpm', 'image');
  // testFile('Speedway.mj2', 'mj2', 'image');

  test('throws error for buffer smaller than 24 bytes', () => {
    const buffer = Buffer.from('too small');
    expect(() => new FSBytes(buffer)).toThrow('Buffer must contain at least 24 bytes');
  });

  test('handles unknown file types', () => {
    const buffer = Buffer.alloc(24).fill('unknown content');
    const fsBytes = new FSBytes(buffer);
    expect(fsBytes.getType()).toBeNull();
    expect(fsBytes.getCategory()).toBeNull();
  });
});
