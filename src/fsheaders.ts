import { Integer } from '@epdoc/typeutil';
import { Buffer } from 'buffer';

export type FileCategory =
  | 'image'
  | 'video'
  | 'audio'
  | 'document'
  | 'spreadsheet'
  | 'presentation'
  | 'database'
  | 'archive'
  | 'executable'
  | 'font'
  | 'script'
  | 'data';

export type FileType = string;

export type FileHeaderEntry = {
  type: FileType;
  category: FileCategory;
  buffer: Buffer | Buffer[];
  offset?: Integer;
  name?: string;
};

export const FILE_HEADERS: ReadonlyMap<string, FileHeaderEntry> = new Map([
  ['pdf', { type: 'pdf', category: 'document', buffer: Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d]) }],
  [
    'jpg',
    {
      type: 'jpg',
      category: 'image',
      buffer: Buffer.from([0xff, 0xd8, 0xff])
    }
  ],
  [
    'j2k',
    {
      type: 'j2k',
      category: 'image',
      buffer: Buffer.from([0x00, 0x00, 0x00, 0x0c, 0x6a, 0x50, 0x20, 0x20]),
      name: 'JPEG 2000 Code Stream'
    }
  ],
  [
    'jp2',
    {
      type: 'jp2',
      category: 'image',
      buffer: Buffer.from([0x00, 0x00, 0x00, 0x0c, 0x6a, 0x50, 0x20, 0x20]),
      name: 'JPEG 2000 Part 1'
    }
  ],
  [
    'jpf',
    {
      type: 'jpf',
      category: 'image',
      buffer: Buffer.from([0x00, 0x00, 0x00, 0x0c, 0x6a, 0x50, 0x20, 0x20]),
      name: 'JPEG 2000 Part 2'
    }
  ],
  [
    'jpm',
    {
      type: 'jpm',
      category: 'image',
      buffer: Buffer.from([0x00, 0x00, 0x00, 0x0c, 0x6a, 0x50, 0x20, 0x20]),
      name: 'JPEG 2000 Part 6'
    }
  ],
  // [
  //   'mj2',
  //   {
  //     type: 'mj2',
  //     category: 'video',
  //     buffer: Buffer.from([0x00, 0x00, 0x00, 0x0c, 0x6a, 0x50, 0x20, 0x20]),
  //     name: 'JPEG 2000 Part 3'
  //   }
  // ],
  [
    'jpx',
    {
      type: 'jpx',
      category: 'image',
      buffer: Buffer.from([0x00, 0x00, 0x00, 0x0c, 0x6a, 0x50, 0x20, 0x20]),
      name: 'JPEG 2000 Part 4'
    }
  ],
  ['jxr', { type: 'jxr', category: 'image', buffer: Buffer.from([0xff, 0x52, 0x49, 0x46, 0x46]) }],
  ['gif', { type: 'gif', category: 'image', buffer: [Buffer.from('GIF87a'), Buffer.from('GIF89a')] }],
  ['png', { type: 'png', category: 'image', buffer: Buffer.from('\x89PNG\x0D\x0A\x1A\x0A') }],
  [
    'webp',
    {
      type: 'webp',
      category: 'image',
      buffer: Buffer.from([0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50])
    }
  ],
  [
    'heif',
    {
      type: 'heif',
      category: 'image',
      buffer: Buffer.from([0x00, 0x00, 0x00, 0x0c, 0x6a, 0x50, 0x20, 0x20, 0x0d, 0x0a, 0x00, 0x00])
    }
  ],
  ['bmp', { type: 'bmp', category: 'image', buffer: Buffer.from('BM') }],
  ['tiff', { type: 'tiff', category: 'image', buffer: Buffer.from([0x49, 0x49, 0x2a, 0x00]) }],
  ['avif', { type: 'avif', category: 'image', buffer: Buffer.from([0x41, 0x56, 0x49, 0x46]) }],
  ['mp4', { type: 'mp4', category: 'video', buffer: Buffer.from('ftyp'), offset: 4 }],
  ['avi', { type: 'avi', category: 'video', buffer: Buffer.from('RIFF') }],
  ['mov', { type: 'mov', category: 'video', buffer: Buffer.from('moov') }],
  ['flv', { type: 'flv', category: 'video', buffer: Buffer.from('FLV\x01') }],
  ['wmv', { type: 'wmv', category: 'video', buffer: Buffer.from('30303031') }],
  ['mkv', { type: 'mkv', category: 'video', buffer: Buffer.from('1a45df53') }],
  ['ogg', { type: 'ogg', category: 'video', buffer: Buffer.from('OggS') }],
  ['webm', { type: 'webm', category: 'video', buffer: Buffer.from('1a45df53') }],
  ['mpeg1', { type: 'mpeg1', category: 'video', buffer: Buffer.from([0x00, 0x00, 0x01, 0xba]) }],
  ['mpeg2', { type: 'mpeg2', category: 'video', buffer: Buffer.from([0x00, 0x00, 0x01, 0xb3]) }],
  ['rtf', { type: 'rtf', category: 'document', buffer: Buffer.from([0x7b, 0x5c, 0x72, 0x74, 0x66]) }],
  [
    'sqlite',
    { type: 'sqlite', category: 'database', buffer: Buffer.from([0x53, 0x51, 0x4c, 0x69, 0x74, 0x65, 0x33, 0x00]) }
  ],
  ['zip', { type: 'zip', category: 'archive', buffer: Buffer.from([0x50, 0x4b, 0x03, 0x04]) }],
  ['rar', { type: 'rar', category: 'archive', buffer: Buffer.from([0x52, 0x41, 0x52, 0x20]) }],
  ['tar', { type: 'tar', category: 'archive', buffer: Buffer.from([0x75, 0x73, 0x74, 0x61, 0x72]) }],
  ['mp3', { type: 'mp3', category: 'audio', buffer: Buffer.from([0x49, 0x44, 0x33]) }],
  ['wav', { type: 'wav', category: 'audio', buffer: Buffer.from([0x52, 0x49, 0x46, 0x46]) }],
  ['flac', { type: 'flac', category: 'audio', buffer: Buffer.from([0x46, 0x4c, 0x41, 0x43]) }],
  ['aac', { type: 'aac', category: 'audio', buffer: Buffer.from([0x00, 0x00, 0xff, 0xf1]) }],
  ['ai', { type: 'ai', category: 'image', buffer: Buffer.from([0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]) }],
  ['psd', { type: 'psd', category: 'image', buffer: Buffer.from([0x38, 0x42, 0x50, 0x53]) }],
  ['dylib', { type: 'dylib', category: 'executable', buffer: Buffer.from([0xce, 0xfa, 0xed, 0xfe]) }],
  ['ttf', { category: 'font', type: 'ttf', buffer: Buffer.from([0x00, 0x01, 0x00, 0x00]) }],
  ['otf', { category: 'font', type: 'otf', buffer: Buffer.from([0x00, 0x01, 0x00, 0x00]) }],
  ['woff', { category: 'font', type: 'woff', buffer: Buffer.from([0x77, 0x4f, 0x46, 0x46]) }],
  ['woff2', { category: 'font', type: 'woff2', buffer: Buffer.from([0x77, 0x4f, 0x46, 0x32]) }],
  ['eot', { category: 'font', type: 'eot', buffer: Buffer.from([0x45, 0x4f, 0x54, 0x54]) }],
  ['ttc', { category: 'font', type: 'ttc', buffer: Buffer.from([0x00, 0x01, 0x00, 0x00]) }]
]);
