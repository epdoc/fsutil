import { FSBytes } from '../src/fsbytes';

describe('FSBytes class', () => {
  // Helper function to create an FSBytes instance with a given buffer
  const createFSBytes = (buffer: Buffer) => {
    return new FSBytes(buffer);
  };

  describe('isPDF', () => {
    it('should return true for a PDF file', () => {
      const pdfBuffer = Buffer.from('PDF-');
      const fsBytes = createFSBytes(pdfBuffer);
      expect(fsBytes.isType('pdf')).toBe(true);
    });

    it('should return false for a non-PDF file', () => {
      const nonPDFBuffer = Buffer.from('ABC-');
      const fsBytes = createFSBytes(nonPDFBuffer);
      expect(fsBytes.isType('pdf')).toBe(false);
    });
  });

  describe('isJPEG', () => {
    it('should return true for a JPEG file', () => {
      const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x0f, 0x4a, 0x46, 0x49, 0x46, 0x00]);
      const fsBytes = createFSBytes(jpegBuffer);
      expect(fsBytes.isType('jpeg')).toBe(true);
    });

    it('should return false for a non-JPEG file', () => {
      const nonJPEGBuffer = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a]);
      const fsBytes = createFSBytes(nonJPEGBuffer);
      expect(fsBytes.isType('jpeg')).toBe(false);
    });
  });

  describe('isGIF', () => {
    it('should return true for a GIF file', () => {
      const gifBuffer = Buffer.from('GIF87a');
      const fsBytes = createFSBytes(gifBuffer);
      expect(fsBytes.isType('gif')).toBe(true);
    });

    it('should return false for a non-GIF file', () => {
      const nonGIFBuffer = Buffer.from('ABCDE');
      const fsBytes = createFSBytes(nonGIFBuffer);
      expect(fsBytes.isType('gif')).toBe(false);
    });
  });

  describe('isPNG', () => {
    it('should return true for a PNG file', () => {
      const pngBuffer = Buffer.from('\x89PNG\x0D\x0A\x1A\x0A');
      const fsBytes = createFSBytes(pngBuffer);
      expect(fsBytes.isType('png')).toBe(true);
    });

    it('should return false for a non-PNG file', () => {
      const nonPNGBuffer = Buffer.from('ABCDE');
      const fsBytes = createFSBytes(nonPNGBuffer);
      expect(fsBytes.isType('png')).toBe(false);
    });
  });

  describe('isWebP', () => {
    it('should return true for a WebP file', () => {
      const webPBuffer = Buffer.from([0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50]);
      const fsBytes = createFSBytes(webPBuffer);
      expect(fsBytes.isType('webp')).toBe(true);
    });

    it('should return false for a non-WebP file', () => {
      const nonWebPBuffer = Buffer.from('ABCDE');
      const fsBytes = createFSBytes(nonWebPBuffer);
      expect(fsBytes.isType('webp')).toBe(false);
    });
  });

  describe('isHEIF', () => {
    it('should return true for a HEIF file', () => {
      const heifBuffer = Buffer.from([0x00, 0x00, 0x00, 0x0c, 0x6a, 0x50, 0x20, 0x20, 0x0d, 0x0a, 0x00, 0x00]);
      const fsBytes = createFSBytes(heifBuffer);
      expect(fsBytes.isType('heif')).toBe(true);
    });

    it('should return false for a non-HEIF file', () => {
      const nonHEIFBuffer = Buffer.from('ABCDE');
      const fsBytes = createFSBytes(nonHEIFBuffer);
      expect(fsBytes.isType('heif')).toBe(false);
    });
  });

  describe('isMP4', () => {
    it('should return true for an MP4 file', () => {
      const mp4Buffer = Buffer.from('mp42');
      const fsBytes = createFSBytes(mp4Buffer);
      expect(fsBytes.isType('mp4')).toBe(true);
    });

    it('should return false for a non-MP4 file', () => {
      const nonMP4Buffer = Buffer.from('ABCDE');
      const fsBytes = createFSBytes(nonMP4Buffer);
      expect(fsBytes.isType('mp4')).toBe(false);
    });
  });

  describe('isAVI', () => {
    it('should return true for an AVI file', () => {
      const aviBuffer = Buffer.from('RIFF');
      const fsBytes = createFSBytes(aviBuffer);
      expect(fsBytes.isType('avi')).toBe(true);
    });

    it('should return false for a non-AVI file', () => {
      const nonAVIBuffer = Buffer.from('ABCDE');
      const fsBytes = createFSBytes(nonAVIBuffer);
      expect(fsBytes.isType('avi')).toBe(false);
    });
  });

  describe('isMOV', () => {
    it('should return true for a MOV file', () => {
      const movBuffer = Buffer.from('moov');
      const fsBytes = createFSBytes(movBuffer);
      expect(fsBytes.isType('mov')).toBe(true);
    });

    it('should return false for a non-MOV file', () => {
      const nonMOVBuffer = Buffer.from('ABCDE');
      const fsBytes = createFSBytes(nonMOVBuffer);
      expect(fsBytes.isType('mov')).toBe(false);
    });
  });

  describe('isDOCX', () => {
    it('should return true for a DOCX file', () => {
      const docxBuffer = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
      const fsBytes = createFSBytes(docxBuffer);
      expect(fsBytes.isType('docx')).toBe(true);
    });

    it('should return false for a non-DOCX file', () => {
      const nonDOCXBuffer = Buffer.from('ABCDE');
      const fsBytes = createFSBytes(nonDOCXBuffer);
      expect(fsBytes.isType('docx')).toBe(false);
    });
  });

  describe('isODT', () => {
    it('should return true for an ODT file', () => {
      const odtBuffer = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00]);
      const fsBytes = createFSBytes(odtBuffer);
      expect(fsBytes.isType('odt')).toBe(true);
    });

    it('should return false for a non-ODT file', () => {
      const nonODTBuffer = Buffer.from('ABCDE');
      const fsBytes = createFSBytes(nonODTBuffer);
      expect(fsBytes.isType('odt')).toBe(false);
    });
  });

  describe('isRTF', () => {
    it('should return true for an RTF file', () => {
      const rtfBuffer = Buffer.from([0x7b, 0x5c, 0x72, 0x74, 0x66]);
      const fsBytes = createFSBytes(rtfBuffer);
      expect(fsBytes.isType('rtf')).toBe(true);
    });

    it('should return false for a non-rtf file', () => {
      const nonRTFBuffer = Buffer.from('ABCDE');
      const fsBytes = createFSBytes(nonRTFBuffer);
      expect(fsBytes.isType('rtf')).toBe(false);
    });
  });
});
