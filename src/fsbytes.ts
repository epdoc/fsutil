import { Buffer } from 'node:buffer';
import { FILE_HEADERS, type FileCategory, type FileHeaderEntry, type FileType } from './fsheaders.ts';

/**
 * A class representing the bytes in a file.
 */
export class FSBytes {
  /**
   * The buffer containing the file's first 24 bytes.
   */
  private _buffer: Buffer;

  /**
   * Creates a new FSBytes instance with a provided buffer.
   *
   * @param {Buffer} buffer The buffer containing the file's contents. MUST contain at least the first 24 bytes of the file.
   */
  constructor(buffer: Buffer) {
    if (buffer.length < 24) {
      throw new Error('Buffer must contain at least 24 bytes');
    }
    this._buffer = buffer.subarray(0, 24);
  }

  /**
   * Determines both the file type and category based on the file header.
   * @returns {[FileType | null, FileCategory | null]} A tuple containing the file type and category, or null if either cannot be determined.
   */
  public getTypeAndCategory(): [FileType | null, FileCategory | null] {
    const type = this.getType();
    if (type) {
      const fileHeader = FILE_HEADERS.get(type);
      if (fileHeader) {
        return [type, fileHeader.category];
      }
    }
    return [null, null];
  }

  /**
   * Determines the file type based on the file header.
   *
   * @returns {FileType | null} The file type, or null if it cannot be determined.
   */
  public getType(): FileType | null {
    for (const [type, fileHeader] of FILE_HEADERS) {
      if (this.matchesHeader(fileHeader as FileHeaderEntry)) {
        switch (type) {
          case 'jpg':
          case 'jpeg':
            return this.getJPEGType();
          case 'jp2':
          case 'j2k':
          case 'jpf':
            return this.getJPEG2000Type();
          case 'wav':
          case 'avi':
            return this.getWavOrAviType();
          case 'mp4':
            return this.getMP4Type();
          case 'webp':
            return this.getWebPType();
          default:
            return type;
        }
      }
    }
    return null;
  }

  /**
   * Determines the file category based on the file header.
   *
   * @returns {FileCategory | null} The file category, or null if it cannot be determined.
   */
  public getCategory(): FileCategory | null {
    const type = this.getType();
    if (type) {
      const fileHeader = FILE_HEADERS.get(type);
      if (fileHeader) {
        return fileHeader.category;
      }
    }
    return null;
  }

  private matchesHeader(fileHeader: FileHeaderEntry): boolean {
    const { buffer, offset = 0 } = fileHeader;
    if (Array.isArray(buffer)) {
      return buffer.some((buf) => this.startsWith(buf, offset));
    } else {
      return this.startsWith(buffer, offset);
    }
  }

  private startsWith(buffer: Buffer, offset: number): boolean {
    return this._buffer.subarray(offset, offset + buffer.length).equals(buffer);
  }

  private getJPEG2000Type(): FileType {
    const ftypBox = this._buffer.subarray(20, 24).toString('ascii');
    switch (ftypBox) {
      case 'jp2 ':
        return 'jp2';
      case 'jpx ':
        return 'jpf';
      case 'jpm ':
        return 'jpm';
      default:
        return 'j2k'; // Default to j2k if we can't determine the specific type
    }
  }

  private getJPEGType(): FileType | null {
    const exifMarker = this._buffer.subarray(2, 4).toString('hex');
    return exifMarker === 'ffe1' ? 'jpg' : 'jpeg';
  }

  private getMP4Type(): FileType {
    const ftypStart = this._buffer.indexOf(Buffer.from('ftyp'));
    if (ftypStart >= 4 && ftypStart <= 8) {
      const brand = this._buffer.subarray(ftypStart + 4, ftypStart + 8).toString();
      switch (brand) {
        case 'mp41':
        case 'mp42':
        case 'isom':
        case 'iso2':
        case 'avc1':
        case 'mmp4':
          return 'mp4';
        case 'M4V ':
          return 'm4v';
        case 'M4A ':
          return 'm4a';
        default:
          return 'mp4';
      }
    }
    return 'mp4';
  }

  private getWebPType(): FileType | null {
    if (this._buffer.subarray(8, 12).toString() === 'WEBP') {
      return 'webp';
    }
    return null;
  }

  private getWavOrAviType(): FileType | null {
    if (
      this._buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      this._buffer.subarray(8, 12).toString('ascii') === 'WAVE'
    ) {
      return 'wav';
    } else if (
      this._buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      this._buffer.subarray(8, 12).toString('ascii') === 'AVI '
    ) {
      return 'avi';
    }
    return null;
  }
}
