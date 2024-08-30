import { FILE_HEADERS, FileCategory, FileType } from './fsheaders';

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
   * Determines the file type based on the file header.
   *
   * @returns {FileType | null} The file type, or null if it cannot be determined.
   */
  getType(): FileType | null {
    for (const [type, fileHeader] of FILE_HEADERS) {
      if (this.matchesHeader(fileHeader.buffer)) {
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

  private matchesHeader(headerBuffer: Buffer | Buffer[]): boolean {
    if (Array.isArray(headerBuffer)) {
      return headerBuffer.some((buffer) => this.startsWith(buffer));
    } else {
      return this.startsWith(headerBuffer);
    }
  }

  private startsWith(buffer: Buffer): boolean {
    return this._buffer.subarray(0, buffer.length).equals(buffer);
  }

  private getJPEG2000Type(): FileType {
    const ftypBox = this._buffer.subarray(20, 24).toString('ascii');
    switch (ftypBox) {
      case 'jp2 ':
        return 'jp2';
      case 'jpx ':
        return 'jpf';
      default:
        return 'j2k'; // Default to j2k if we can't determine the specific type
    }
  }

  private getJPEGType(): FileType | null {
    const exifMarker = this._buffer.subarray(2, 4).toString('hex');
    return exifMarker === 'ffe1' ? 'jpg' : 'jpeg';
  }

  private getMP4Type(): FileType | null {
    const ftypStart = this._buffer.indexOf(Buffer.from('ftyp'));
    if (ftypStart > 0 && ftypStart < 8) {
      return 'mp4';
    }
    return null;
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

  /**
   * Determines the file category based on the file header.
   *
   * @returns {FileCategory | null} The file category, or null if it cannot be determined.
   */
  getCategory(): FileCategory | null {
    const type = this.getType();
    if (type) {
      const fileHeader = FILE_HEADERS.get(type);
      if (fileHeader) {
        return fileHeader.category;
      }
    }
    return null;
  }
}
