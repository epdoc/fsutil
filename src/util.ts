/**
 * Joins continuation lines in a string array.
 * @param lines - The array of lines to join.
 * @param continuation - The regular expression or string that delimits
 * continuation lines. If a regular expression, the part of the line before the
 * match must be returned. For example, `new RegExp(/^(.*)\\\s*$/)`.
 * @returns The joined lines.
 */
export function joinContinuationLines(lines: string[], continuation: string | RegExp): string[] {
  let regex = typeof continuation === 'string' ? new RegExp('^(.*)' + continuation + '\\s*$') : continuation;
  let result: string[] = [];
  for (let idx = 0; idx < lines.length; ++idx) {
    let line = lines[idx];
    let p = line.match(regex);
    if (p) {
      line = p[1];
      if (idx + 1 < lines.length) {
        line += lines[idx + 1].replace(/^\s+/, '');
        lines[idx + 1] = line;
      }
    } else {
      result.push(line);
    }
  }
  return result;
}
