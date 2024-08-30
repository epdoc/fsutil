import fs from 'fs';
import path from 'path';
import { FSBytes } from '../src/fsbytes';
import { FileCategory, FileType } from '../src/fsheaders';

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

  test('detects JSON correctly', () => {
    const jsonTests = [
      { content: '{}', expected: true },
      { content: '[]', expected: true },
      { content: '"string"', expected: true },
      { content: '123', expected: true },
      { content: 'true', expected: true },
      { content: 'false', expected: true },
      { content: 'null', expected: true },
      { content: '{"key": "value"}', expected: true },
      { content: '[1, 2, 3]', expected: true },
      { content: 'not json', expected: false },
      { content: '{invalid: json}', expected: false }
    ];

    jsonTests.forEach(({ content, expected }) => {
      const buffer = Buffer.from(content.padEnd(24, ' '));
      const fsBytes = new FSBytes(buffer);
      expect(fsBytes.getType()).toBe(expected ? 'json' : null);
      expect(fsBytes.getCategory()).toBe(expected ? 'data' : null);
    });
  });

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

  describe('JPEG 2000 file types', () => {
    const jp2000Header = Buffer.from([0x00, 0x00, 0x00, 0x0c, 0x6a, 0x50, 0x20, 0x20]);

    test('detects JP2 file', () => {
      const buffer = Buffer.concat([jp2000Header, Buffer.from('0D0A870A00000014667479706A7032 ', 'hex')]);
      const fsBytes = new FSBytes(buffer);
      expect(fsBytes.getType()).toBe('jp2');
    });

    test('detects JPF file', () => {
      const buffer = Buffer.concat([jp2000Header, Buffer.from('0D0A870A00000014667479706A7078 ', 'hex')]);
      const fsBytes = new FSBytes(buffer);
      expect(fsBytes.getType()).toBe('jpf');
    });

    test('detects J2K file', () => {
      const buffer = Buffer.concat([jp2000Header, Buffer.from('0D0A870A00000014667479706A3232 ', 'hex')]);
      const fsBytes = new FSBytes(buffer);
      expect(fsBytes.getType()).toBe('j2k');
    });
  });
});
