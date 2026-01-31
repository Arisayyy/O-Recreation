declare module "bun" {
  type S3Options = Record<string, unknown>;

  export interface S3File extends Blob {
    write(data: unknown, options?: Record<string, unknown>): Promise<number>;
    presign(options?: S3Options): string;
    delete(options?: S3Options): Promise<void>;
    unlink(options?: S3Options): Promise<void>;
    exists(options?: S3Options): Promise<boolean>;
  }

  export class S3Client {
    constructor(options?: Record<string, unknown>);
    file(path: string): S3File;
    write(path: string, data: unknown, options?: Record<string, unknown>): Promise<number>;
    presign(path: string, options?: S3Options): string;
    delete(path: string, options?: S3Options): Promise<void>;
    unlink(path: string, options?: S3Options): Promise<void>;
    exists(path: string, options?: S3Options): Promise<boolean>;
  }

  export const s3: S3Client;
}

