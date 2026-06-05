import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Reads and JSON-parses every file in `files` (relative to `dir`) using a
 * bounded worker pool. Parallelising the I/O overlaps disk reads instead of
 * waiting for them one-by-one, while the concurrency cap keeps us well under
 * the open-file-descriptor limit when a directory holds thousands of files.
 *
 * Corrupt/unreadable files are skipped via `onError` rather than aborting the
 * whole batch.
 */
export async function readJsonFiles<T>(
  dir: string,
  files: string[],
  concurrency: number,
  onError: (file: string, message: string) => void,
): Promise<T[]> {
  const results: T[] = [];
  let next = 0;

  const worker = async (): Promise<void> => {
    while (next < files.length) {
      const file = files[next++];
      try {
        const content = await fs.readFile(path.join(dir, file), 'utf-8');
        results.push(JSON.parse(content) as T);
      } catch (e) {
        onError(file, e?.message);
      }
    }
  };

  const workers = Array.from(
    { length: Math.min(concurrency, files.length) },
    () => worker(),
  );
  await Promise.all(workers);

  return results;
}
