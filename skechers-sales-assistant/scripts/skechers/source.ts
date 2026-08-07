// Source adapters for the Skechers connector.
//
//  • FixtureSkechersSource — the DEFAULT. Reads AUTHORIZED sample records from the
//    bundled fixtures and/or a provided export file (JSON). No network access.
//  • LiveWebSource — a permission-gated SEAM. It is disabled by default and
//    REFUSES to run unless the operator sets SKECHERS_INGEST_AUTHORIZED=true AND
//    supplies an explicit approved endpoint. It never defaults to skechers.com,
//    and the app UI never uses it. This exists to show where an authorized
//    connector would plug in — this codebase ships no scraper (see CLAUDE.md).
import { readFileSync } from 'node:fs';
import { createRateLimiter } from './connector';
import { SAMPLE_SKECHERS_PRODUCTS } from './fixtures';
import type { RawSkechersProduct, SkechersSource } from './types';

/** Reads records from the bundled sample map, optionally overlaid by a JSON file. */
export class FixtureSkechersSource implements SkechersSource {
  readonly name = 'fixture';
  private readonly records: Record<string, RawSkechersProduct>;

  constructor(filePath?: string) {
    let records: Record<string, RawSkechersProduct> = { ...SAMPLE_SKECHERS_PRODUCTS };
    if (filePath) {
      const parsed = JSON.parse(readFileSync(filePath, 'utf8')) as
        | RawSkechersProduct[]
        | Record<string, RawSkechersProduct>;
      const list = Array.isArray(parsed) ? parsed : Object.values(parsed);
      for (const r of list) records[r.styleNumber] = r;
    }
    this.records = records;
  }

  async fetchByStyle(style: string): Promise<RawSkechersProduct> {
    const rec = this.records[style];
    if (!rec) throw new Error(`style "${style}" not found in the provided source (fixtures/export file)`);
    return rec;
  }

  async fetchMany(styles: string[]): Promise<RawSkechersProduct[]> {
    const out: RawSkechersProduct[] = [];
    for (const s of styles) out.push(await this.fetchByStyle(s));
    return out;
  }
}

/**
 * Permission-gated live adapter. Intentionally NOT implemented as a scraper. It
 * refuses unless authorization is explicitly configured, and even then it only
 * calls the operator-supplied approved endpoint (never skechers.com by default),
 * using the resilient transport (timeout/retry/UA) + a rate limiter.
 */
export class LiveWebSource implements SkechersSource {
  readonly name = 'live-web';
  private readonly limit = createRateLimiter(1500);

  constructor(private readonly approvedEndpoint?: string) {}

  private assertAuthorized(): void {
    const authorized = process.env.SKECHERS_INGEST_AUTHORIZED === 'true';
    if (!authorized || !this.approvedEndpoint) {
      throw new Error(
        'LiveWebSource is disabled: set SKECHERS_INGEST_AUTHORIZED=true and provide an approved endpoint. ' +
          'This project does not scrape skechers.com; use the fixture/export source, or wire an authorized feed here.',
      );
    }
  }

  async fetchByStyle(_style: string): Promise<RawSkechersProduct> {
    this.assertAuthorized();
    await this.limit();
    // An authorized parser for the approved endpoint's payload would live here.
    throw new Error('LiveWebSource has no parser configured for the approved endpoint.');
  }

  async fetchMany(styles: string[]): Promise<RawSkechersProduct[]> {
    const out: RawSkechersProduct[] = [];
    for (const s of styles) out.push(await this.fetchByStyle(s));
    return out;
  }
}

/** Choose a source. Defaults to fixtures/export; live-web only when explicitly requested + authorized. */
export function createSource(opts: { file?: string; live?: boolean; endpoint?: string } = {}): SkechersSource {
  if (opts.live) return new LiveWebSource(opts.endpoint);
  return new FixtureSkechersSource(opts.file);
}
