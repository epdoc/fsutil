/**
 * A class representing the bytes in a file.
 */
export class FSBytes {
  /**
   * The buffer containing the file's first 12 bytes.
   */
  private _buffer: Buffer;

  /**
   * A map of file extensions to their corresponding headers.
   */
  protected static fileHeaders: Map<string, Buffer> = new Map([
    ['pdf', Buffer.from('PDF-')],
    ['jpeg', Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x0f, 0x4a, 0x46, 0x49, 0x46, 0x00])],
    ['gif', Buffer.from('GIF87a')],
    ['png', Buffer.from('\x89PNG\x0D\x0A\x1A\x0A')],
    ['webp', Buffer.from([0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50])],
    ['heif', Buffer.from([0x00, 0x00, 0x00, 0x0c, 0x6a, 0x50, 0x20, 0x20, 0x0d, 0x0a, 0x00, 0x00])],
    ['mp4', Buffer.from('mp42')],
    ['avi', Buffer.from('RIFF')],
    ['mov', Buffer.from('moov')],
    ['docx', Buffer.from([0x50, 0x4b, 0x03, 0x04])],
    ['odt', Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00])],
    ['rtf', Buffer.from([0x7b, 0x5c, 0x72, 0x74, 0x66])],
    ['xlsx', Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00])],
    ['ods', Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00])],
    ['pptx', Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00])],
    ['odp', Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00])],
    ['sqlite', Buffer.from([0x53, 0x51, 0x4c, 0x69, 0x74, 0x65, 0x33, 0x00])],
    ['zip', Buffer.from([0x50, 0x4b, 0x03, 0x04])],
    ['rar', Buffer.from([0x52, 0x41, 0x52, 0x20])],
    ['tar', Buffer.from([0x75, 0x73, 0x74, 0x61, 0x72])],
    ['mp3', Buffer.from([0x49, 0x44, 0x33])],
    ['wav', Buffer.from([0x52, 0x49, 0x46, 0x46])],
    ['flac', Buffer.from([0x46, 0x4c, 0x41, 0x43])],
    ['aac', Buffer.from([0x00, 0x00, 0xff, 0xf1])]
  ]);
  /**
   * Creates a new File instance with a provided buffer.
   *
   * @param {Buffer} buffer The buffer containing the file's contents. MUST contain at least the first 12 bytes of the file.
   */
  constructor(buffer: Buffer) {
    this._buffer = buffer;
  }

  /**
   * Determines if the file is of the specified type.
   *
   * @param {string} type The file type to check (e.g., 'pdf', 'jpeg', 'gif').
   * @returns {boolean} True if the file is of the specified type, false otherwise.
   */
  isType(type: string): boolean {
    const header = FSBytes.fileHeaders.get(type.toLowerCase());
    if (!header) {
      throw new Error(`Unsupported file type: ${type}`);
    }
    return this._buffer.subarray(0, header.length).equals(header);
  }
}
