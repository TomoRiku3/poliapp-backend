// src/services/storage.ts
import s3 from "../config/aws";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

/**
 * Uploads a buffer to S3 under the given key.
 * Returns the public URL of the object.
 */
export async function uploadObject(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ACL: 'public-read'
    })
  );
  return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}

/**
 * Deletes an object from S3 by key.
 */
export async function deleteObject(key: string): Promise<void> {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: key
    })
  );
}
