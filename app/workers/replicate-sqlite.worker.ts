/// <reference lib="webworker" />

// Next.js-compatible adaptation of Replicate's sqlite worker.
// Based on: reference/replicate/packages/replicate/src/client/persistence/sqlite/worker.ts
// and: reference/replicate/packages/replicate/src/client/persistence/sqlite/schema.ts

interface Executor {
  execute(
    sql: string,
    params?: unknown[],
  ): Promise<{ rows: Record<string, unknown>[] }>;
  close(): void;
}

async function initSchema(executor: Executor): Promise<void> {
  await executor.execute(`
    CREATE TABLE IF NOT EXISTS snapshots (
      collection TEXT PRIMARY KEY,
      data BLOB NOT NULL,
      state_vector BLOB,
      seq INTEGER DEFAULT 0
    )
  `);

  await executor.execute(`
    CREATE TABLE IF NOT EXISTS deltas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      collection TEXT NOT NULL,
      data BLOB NOT NULL
    )
  `);

  await executor.execute(`
    CREATE INDEX IF NOT EXISTS deltas_collection_idx ON deltas (collection)
  `);

  await executor.execute(`
    CREATE TABLE IF NOT EXISTS kv (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);
}

const CDN_BASE = "https://wa-sqlite.robelest.com/v1.0.0";

const INIT = 0;
const EXECUTE = 1;
const CLOSE = 2;
const FLUSH = 3;

interface WorkerRequest {
  id: number;
  type: typeof INIT | typeof EXECUTE | typeof CLOSE | typeof FLUSH;
  name?: string;
  sql?: string;
  params?: unknown[];
}

interface WorkerResponse {
  id: number;
  ok: boolean;
  rows?: Record<string, unknown>[];
  error?: string;
}

interface SqliteApi {
  open_v2(name: string): Promise<number>;
  exec(db: number, sql: string): Promise<void>;
  close(db: number): void;
  vfs_register(vfs: unknown, makeDefault: boolean): void;
  statements(db: number, sql: string): AsyncIterable<unknown>;
  bind_collection(stmt: unknown, params: unknown[]): void;
  column_names(stmt: unknown): string[];
  step(stmt: unknown): Promise<number>;
  row(stmt: unknown): unknown[];
}

interface SqliteApiModule {
  Factory: (wasmModule: unknown) => SqliteApi;
}

interface Vfs {
  close(): void;
}

let sqlite3: SqliteApi | null = null;
let db: number | null = null;
let vfs: Vfs | null = null;
let mutex: Promise<unknown> = Promise.resolve();

async function init(name: string): Promise<void> {
  const [{ default: SQLiteESMFactory }, { IDBBatchAtomicVFS }, SQLite] =
    await Promise.all([
      import(
        /* webpackIgnore: true */ `${CDN_BASE}/dist/wa-sqlite-async.mjs`
      ),
      import(
        /* webpackIgnore: true */ `${CDN_BASE}/src/examples/IDBBatchAtomicVFS.js`
      ),
      import(/* webpackIgnore: true */ `${CDN_BASE}/src/sqlite-api.js`),
    ]);

  const wasmModule = await SQLiteESMFactory({
    locateFile: (file: string) => `${CDN_BASE}/dist/${file}`,
  });
  sqlite3 = (SQLite as SqliteApiModule).Factory(wasmModule);

  vfs = await IDBBatchAtomicVFS.create(name, wasmModule);
  sqlite3.vfs_register(vfs, true);

  db = await sqlite3.open_v2(name);

  await sqlite3.exec(db, "PRAGMA cache_size = -8000;");
  await sqlite3.exec(db, "PRAGMA synchronous = NORMAL;");
  await sqlite3.exec(db, "PRAGMA temp_store = MEMORY;");

  const executor: Executor = {
    async execute(sql, params) {
      return execute(sql, params);
    },
    close() {
      if (sqlite3 && db !== null) sqlite3.close(db);
      vfs?.close();
    },
  };

  await initSchema(executor);
}

function execute(
  sql: string,
  params?: unknown[],
): Promise<{ rows: Record<string, unknown>[] }> {
  const s = sqlite3;
  const d = db;
  if (!s || d === null) {
    return Promise.reject(new Error("SQLite worker not initialized"));
  }

  const operation = mutex
    .catch(() => {})
    .then(async () => {
      const rows: Record<string, unknown>[] = [];

      for await (const stmt of s.statements(d, sql)) {
        if (params && params.length > 0) {
          s.bind_collection(stmt, params);
        }

        const columns: string[] = s.column_names(stmt);
        while ((await s.step(stmt)) === 100) {
          const row = s.row(stmt);
          const obj: Record<string, unknown> = {};
          columns.forEach((col: string, i: number) => {
            obj[col] = row[i];
          });
          rows.push(obj);
        }
      }

      return { rows };
    });

  mutex = operation;
  return operation;
}

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  const { id, type, name, sql, params } = e.data;

  try {
    switch (type) {
      case INIT:
        await init(name!);
        self.postMessage({ id, ok: true } satisfies WorkerResponse);
        break;
      case EXECUTE:
        const result = await execute(sql!, params);
        self.postMessage({ id, ok: true, rows: result.rows } satisfies WorkerResponse);
        break;
      case FLUSH:
        self.postMessage({ id, ok: true } satisfies WorkerResponse);
        break;
      case CLOSE:
        if (sqlite3 && db !== null) sqlite3.close(db);
        vfs?.close();
        self.postMessage({ id, ok: true } satisfies WorkerResponse);
        break;
    }
  } catch (error) {
    self.postMessage(
      { id, ok: false, error: String(error) } satisfies WorkerResponse,
    );
  }
};

