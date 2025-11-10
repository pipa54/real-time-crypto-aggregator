export function encodeCursor(index: number) {
  return Buffer.from(String(index)).toString('base64');
}

export function decodeCursor(cursor?: string | null) {
  if (!cursor) return 0;
  try {
    const s = Buffer.from(cursor, 'base64').toString('utf8');
    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}
