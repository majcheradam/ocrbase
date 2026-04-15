import { isS3Configured, s3 } from "./s3";

interface MimeSignature {
  bytes: readonly number[];
  mimeType: string;
  offset: number;
  suffixBytes?: readonly number[];
  suffixOffset?: number;
}

const MIME_SIGNATURES: MimeSignature[] = [
  {
    bytes: [0x25, 0x50, 0x44, 0x46],
    mimeType: "application/pdf",
    offset: 0,
  },
  {
    bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
    mimeType: "image/png",
    offset: 0,
  },
  {
    bytes: [0xFF, 0xD8, 0xFF],
    mimeType: "image/jpeg",
    offset: 0,
  },
  {
    bytes: [0x47, 0x49, 0x46, 0x38],
    mimeType: "image/gif",
    offset: 0,
  },
  {
    bytes: [0x52, 0x49, 0x46, 0x46],
    mimeType: "image/webp",
    offset: 0,
    suffixBytes: [0x57, 0x45, 0x42, 0x50],
    suffixOffset: 8,
  },
];

type DocumentInput = File | URL | string;

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function isDataUrl(value: string): boolean {
  return value.startsWith("data:");
}

function stripBase64Whitespace(value: string): string {
  return value.replaceAll(/\s+/g, "");
}

async function toDataUrl(file: File): Promise<string> {
  const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
  return `data:${file.type || "application/octet-stream"};base64,${base64}`;
}

function decodeDataUrl(value: string): { bytes: Buffer; type: string | undefined } {
  const commaIndex = value.indexOf(",");
  if (commaIndex === -1) {
    throw new Error("Invalid data URL");
  }

  const metadata = value.slice(5, commaIndex);
  const payload = value.slice(commaIndex + 1);
  const [type] = metadata.split(";");
  const isBase64Encoded = metadata.includes(";base64");
  const bytes = isBase64Encoded
    ? Buffer.from(stripBase64Whitespace(payload), "base64")
    : Buffer.from(decodeURIComponent(payload));

  return {
    bytes,
    type: type || undefined,
  };
}

function inferMimeType(bytes: Uint8Array): string | undefined {
  return MIME_SIGNATURES.find((signature) => {
    const hasPrefix = signature.bytes.every(
      (value, index) => bytes[signature.offset + index] === value,
    );
    if (!hasPrefix) {
      return false;
    }

    return (
      !signature.suffixBytes ||
      signature.suffixBytes.every(
        (value, index) => bytes[(signature.suffixOffset ?? 0) + index] === value,
      )
    );
  })?.mimeType;
}

function extensionForMimeType(type: string | undefined): string {
  switch (type) {
    case "application/pdf": {
      return ".pdf";
    }
    case "image/gif": {
      return ".gif";
    }
    case "image/jpeg": {
      return ".jpg";
    }
    case "image/png": {
      return ".png";
    }
    case "image/webp": {
      return ".webp";
    }
    default: {
      return ".bin";
    }
  }
}

function sanitizeFilename(filename: string): string {
  return filename.replaceAll(/[^a-zA-Z0-9._-]+/g, "-");
}

function getObjectKey(type: string | undefined, filename?: string): string {
  if (filename) {
    const safeFilename = sanitizeFilename(filename);
    if (safeFilename.includes(".")) {
      return safeFilename;
    }

    return `${safeFilename}${extensionForMimeType(type)}`;
  }

  return `${crypto.randomUUID()}${extensionForMimeType(type)}`;
}

function getFilenameFromUrl(url: URL): string | undefined {
  const filename = decodeURIComponent(url.pathname.split("/").toReversed().find(Boolean) ?? "");
  return filename || undefined;
}

async function toS3Payload(
  file: DocumentInput,
): Promise<{ body: Blob | Buffer; filename?: string; type: string | undefined }> {
  if (file instanceof File) {
    return {
      body: file,
      filename: file.name || undefined,
      type: file.type || undefined,
    };
  }

  if (file instanceof URL) {
    const response = await fetch(file);
    if (!response.ok) {
      throw new Error(`Failed to fetch file from URL: ${response.status} ${response.statusText}`);
    }

    return {
      body: await response.blob(),
      filename: getFilenameFromUrl(file),
      type: response.headers.get("content-type") ?? undefined,
    };
  }

  const sourceUrl = isHttpUrl(file) ? new URL(file) : null;
  if (sourceUrl) {
    const response = await fetch(sourceUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch file from URL: ${response.status} ${response.statusText}`);
    }

    return {
      body: await response.blob(),
      filename: getFilenameFromUrl(sourceUrl),
      type: response.headers.get("content-type") ?? undefined,
    };
  }

  if (isDataUrl(file)) {
    const { bytes, type } = decodeDataUrl(file);
    return { body: bytes, type };
  }

  const body = Buffer.from(stripBase64Whitespace(file), "base64");
  return {
    body,
    type: inferMimeType(body) ?? "application/octet-stream",
  };
}

export async function resolveDocumentInput(file: DocumentInput): Promise<string | URL> {
  if (!isS3Configured || !s3) {
    return file instanceof File ? await toDataUrl(file) : file;
  }

  const s3Client = s3;
  const payload = await toS3Payload(file);
  const key = getObjectKey(payload.type, payload.filename);

  await s3Client.write(key, payload.body, payload.type ? { type: payload.type } : undefined);

  return s3Client.presign(key, {
    method: "GET",
    type: payload.type,
  });
}
