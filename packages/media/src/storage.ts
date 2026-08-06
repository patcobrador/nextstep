import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import type { MediaConfiguration } from "./config.js";

export interface StoredObjectHead {
  contentLength: number;
  contentType: string | null;
}

export interface PrivateMediaStore {
  createUploadGrant(input: {
    contentType: string;
    expiresAt?: Date;
    objectKey: string;
  }): Promise<{
    expiresAt: Date;
    requiredHeaders: Record<string, string>;
    url: string;
  }>;
  createPlaybackGrant(
    objectKey: string,
    expiresAt?: Date,
  ): Promise<{ expiresAt: Date; url: string }>;
  deleteObject(objectKey: string): Promise<void>;
  getObject(objectKey: string): Promise<AsyncIterable<Uint8Array>>;
  headObject(objectKey: string): Promise<StoredObjectHead | null>;
}

const client = (config: MediaConfiguration, endpoint: string): S3Client =>
  new S3Client({
    endpoint,
    forcePathStyle: true,
    region: config.region,
    credentials: {
      accessKeyId: config.accessKey,
      secretAccessKey: config.secretKey,
    },
  });

export class S3PrivateMediaStore implements PrivateMediaStore {
  readonly #internal: S3Client;
  readonly #public: S3Client;

  constructor(private readonly config: MediaConfiguration) {
    this.#internal = client(config, config.internalEndpoint);
    this.#public = client(config, config.publicEndpoint);
  }

  async createUploadGrant(input: {
    contentType: string;
    expiresAt?: Date;
    objectKey: string;
  }) {
    const expiresAt =
      input.expiresAt ??
      new Date(Date.now() + this.config.uploadGrantSeconds * 1000);
    const expiresIn = Math.max(
      1,
      Math.floor((expiresAt.getTime() - Date.now()) / 1000),
    );
    const url = await getSignedUrl(
      this.#public,
      new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: input.objectKey,
        ContentType: input.contentType,
      }),
      { expiresIn },
    );
    return {
      expiresAt,
      requiredHeaders: { "content-type": input.contentType },
      url,
    };
  }

  async createPlaybackGrant(objectKey: string, fixedExpiry?: Date) {
    const expiresAt =
      fixedExpiry ??
      new Date(Date.now() + this.config.playbackGrantSeconds * 1000);
    const expiresIn = Math.max(
      1,
      Math.floor((expiresAt.getTime() - Date.now()) / 1000),
    );
    const url = await getSignedUrl(
      this.#public,
      new GetObjectCommand({ Bucket: this.config.bucket, Key: objectKey }),
      { expiresIn },
    );
    return { expiresAt, url };
  }

  async headObject(objectKey: string): Promise<StoredObjectHead | null> {
    try {
      const result = await this.#internal.send(
        new HeadObjectCommand({ Bucket: this.config.bucket, Key: objectKey }),
      );
      return {
        contentLength: result.ContentLength ?? 0,
        contentType: result.ContentType ?? null,
      };
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "$metadata" in error &&
        (error as { $metadata?: { httpStatusCode?: number } }).$metadata
          ?.httpStatusCode === 404
      ) {
        return null;
      }
      throw error;
    }
  }

  async getObject(objectKey: string): Promise<AsyncIterable<Uint8Array>> {
    const result = await this.#internal.send(
      new GetObjectCommand({ Bucket: this.config.bucket, Key: objectKey }),
    );
    if (!result.Body) throw new Error("Stored media object has no body.");
    return result.Body as AsyncIterable<Uint8Array>;
  }

  async deleteObject(objectKey: string): Promise<void> {
    await this.#internal.send(
      new DeleteObjectCommand({ Bucket: this.config.bucket, Key: objectKey }),
    );
  }
}
