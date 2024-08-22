/**
 * A class representing the bytes in a file.
 */
export class FSBytes {
  /**
   * The buffer containing the file's first 12 bytes.
   */
  private _buffer: Buffer;

  /**
   * Creates a new File instance with a provided buffer.
   *
   * @param {Buffer} buffer The buffer containing the file's contents. MUST contain at least the first 12 bytes of the file.
   */
  constructor(buffer: Buffer) {
    this._buffer = buffer;
  }

  /**
   * Determines if the file is a PDF file.
   *
   * @returns {boolean} True if the file is a PDF, false otherwise.
   */
  isPdf(): boolean {
    const pdfHeader = Buffer.from('PDF-');
    return this._buffer.subarray(0, 4).equals(pdfHeader);
  }

  /**
   * Determines if the file is a JPEG file.
   *
   * @returns {boolean} True if the file is a JPEG, false otherwise.
   */
  isJPEG(): boolean {
    const jpegHeader = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x0f, 0x4a, 0x46, 0x49, 0x46, 0x00]);
    return this._buffer.subarray(0, 11).equals(jpegHeader);
  }

  /**
   * Determines if the file is a GIF file.
   *
   * @returns {boolean} True if the file is a GIF, false otherwise.
   */
  isGIF(): boolean {
    const gifHeader = Buffer.from('GIF87a');
    return this._buffer.subarray(0, 6).equals(gifHeader);
  }

  /**
   * Determines if the file is a PNG file.
   *
   * @returns {boolean} True if the file is a PNG, false otherwise.
   */
  isPNG(): boolean {
    const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    return this._buffer.subarray(0, 8).equals(pngHeader);
  }

  /**
   * Determines if the file is a WebP file.
   *
   * @returns {boolean} True if the file is a WebP, false otherwise.
   */
  isWebP(): boolean {
    const webPHeader = Buffer.from([0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50]);
    return this._buffer.subarray(0, 12).equals(webPHeader);
  }

  /**
   * Determines if the file is a HEIF file.
   *
   * @returns {boolean} True if the file is a HEIF, false otherwise.
   */
  isHEIF(): boolean {
    const heifHeader = Buffer.from([0x00, 0x00, 0x00, 0x0c, 0x6a, 0x50, 0x20, 0x20, 0x0d, 0x0a, 0x00, 0x00]);
    return this._buffer.subarray(0, 12).equals(heifHeader);
  }

  /**
   * Determines if the file is an MP4 file.
   *
   * @returns {boolean} True if the file is an MP4, false otherwise.
   */
  isMP4(): boolean {
    const mp4Header = Buffer.from('mp42');
    return this._buffer.subarray(0, 4).equals(mp4Header);
  }

  /**
   * Determines if the file is an AVI file.
   *
   * @returns {boolean} True if the file is an AVI, false otherwise.
   */
  isAVI(): boolean {
    const aviHeader = Buffer.from('RIFF');
    return this._buffer.subarray(0, 4).equals(aviHeader);
  }

  /**
   * Determines if the file is a MOV file.
   *
   * @returns {boolean} True if the file is a MOV, false otherwise.
   */
  isMOV(): boolean {
    const movHeader = Buffer.from('moov');
    return this._buffer.subarray(0, 4).equals(movHeader);
  }

  /**
   * Determines if the file is a DOCX file.
   *
   * @returns {boolean} True if the file is a DOCX, false otherwise.
   */
  isDOCX(): boolean {
    const docxHeader = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
    return this._buffer.subarray(0, 4).equals(docxHeader);
  }

  /**
   * Determines if the file is an ODT file.
   *
   * @returns {boolean} True if the file is an ODT, false otherwise.
   */
  isODT(): boolean {
    const odtHeader = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00]);
    return this._buffer.subarray(0, 8).equals(odtHeader);
  }

  /**
   * Determines if the file is an RTF file.
   *
   * @returns {boolean} True if the file is an RTF, false otherwise.
   */
  isRTF(): boolean {
    const rtfHeader = Buffer.from([0x7b, 0x5c, 0x72, 0x74, 0x66]);
    return this._buffer.subarray(0, 5).equals(rtfHeader);
  }

  /**
   * Determines if the file is an XLSX file.
   *
   * @returns {boolean} True if the file is an XLSX, false otherwise.
   */
  isXLSX(): boolean {
    const xlsxHeader = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00]);
    return this._buffer.subarray(0, 8).equals(xlsxHeader);
  }

  /**
   * Determines if the file is an ODS file.
   *
   * @returns {boolean} True if the file is an ODS, false otherwise.
   */
  isODS(): boolean {
    const odsHeader = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00]);
    return this._buffer.subarray(0, 8).equals(odsHeader);
  }

  /**
   * Determines if the file is a PPTX file.
   *
   * @returns {boolean} True if the file is a PPTX, false otherwise.
   */
  isPPTX(): boolean {
    const pptxHeader = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00]);
    return this._buffer.subarray(0, 8).equals(pptxHeader);
  }

  /**
   * Determines if the file is an ODP file.
   *
   * @returns {boolean} True if the file is an ODP, false otherwise.
   */
  isODP(): boolean {
    const odpHeader = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00]);
    return this._buffer.subarray(0, 8).equals(odpHeader);
  }

  /**
   * Determines if the file is a SQLITE file.
   *
   * @returns {boolean} True if the file is a SQLITE, false otherwise.
   */
  isSQLITE(): boolean {
    const sqliteHeader = Buffer.from([0x53, 0x51, 0x4c, 0x69, 0x74, 0x65, 0x33, 0x00]);
    return this._buffer.subarray(0, 8).equals(sqliteHeader);
  }

  /**
   * Determines if the file is a ZIP file.
   *
   * @returns {boolean} True if the file is a ZIP, false otherwise.
   */
  isZIP(): boolean {
    const zipHeader = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
    return this._buffer.subarray(0, 4).equals(zipHeader);
  }

  /**
   * Determines if the file is a RAR file.
   *
   * @returns {boolean} True if the file is a RAR, false otherwise.
   */
  isRAR(): boolean {
    const rarHeader = Buffer.from([0x52, 0x41, 0x52, 0x20]);
    return this._buffer.subarray(0, 4).equals(rarHeader);
  }

  /**
   * Determines if the file is a TAR file.
   *
   * @returns {boolean} True if the file is a TAR, false otherwise.
   */
  isTAR(): boolean {
    const tarHeader = Buffer.from([0x75, 0x73, 0x74, 0x61, 0x72]);
    return this._buffer.subarray(0, 5).equals(tarHeader);
  }

  /**
   * Determines if the file is an MP3 file.
   *
   * @returns {boolean} True if the file is an MP3, false otherwise.
   */
  isMP3(): boolean {
    const mp3Header = Buffer.from([0x49, 0x44, 0x33]);
    return this._buffer.subarray(0, 3).equals(mp3Header);
  }

  /**
   * Determines if the file is a WAV file.
   *
   * @returns {boolean} True if the file is a WAV, false otherwise.
   */
  isWAV(): boolean {
    const wavHeader = Buffer.from([0x52, 0x49, 0x46, 0x46]);
    return this._buffer.subarray(0, 4).equals(wavHeader);
  }

  /**
   * Determines if the file is a FLAC file.
   *
   * @returns {boolean} True if the file is a FLAC, false otherwise.
   */
  isFLAC(): boolean {
    const flacHeader = Buffer.from([0x46, 0x4c, 0x41, 0x43]);
    return this._buffer.subarray(0, 4).equals(flacHeader);
  }

  /**
   * Determines if the file is an AAC file.
   *
   * @returns {boolean} True if the file is an AAC, false otherwise.
   */
  isAAC(): boolean {
    const aacHeader = Buffer.from([0x00, 0x00, 0xff, 0xf1]);
    return this._buffer.subarray(0, 4).equals(aacHeader);
  }
}
