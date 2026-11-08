// Backups in the owner's Google Drive, through the Drive REST API. Every call
// takes an access token from utils/googleAccount.ts. With the drive.file
// permission the app only sees the folder and files it created.

const API = "https://www.googleapis.com/drive/v3";
const UPLOAD = "https://www.googleapis.com/upload/drive/v3";
const FOLDER_TYPE = "application/vnd.google-apps.folder";
export const BACKUP_FOLDER = "Wardrobe Atlas backups";
// Older backups are deleted after each upload (owner's choice).
export const BACKUPS_KEPT = 3;

export type DriveBackupFile = {
  id: string;
  name: string;
  // Bytes, as Drive reports it
  size: number;
  createdTime: string;
};

/** A Drive request that failed; 401 means the access token needs renewing. */
export class DriveError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const request = async (
  token: string,
  url: string,
  init: RequestInit = {},
): Promise<Response> => {
  const response = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...init.headers },
  });
  if (!response.ok)
    throw new DriveError(
      response.status,
      `Drive ${init.method ?? "GET"} failed: ${response.status}`,
    );
  return response;
};

const pad = (value: number) => String(value).padStart(2, "0");

/** wardrobe-atlas-2026-11-08-1405.json, in the phone's time. */
export const backupFileName = (date: Date) =>
  `wardrobe-atlas-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}-${pad(date.getHours())}${pad(date.getMinutes())}.json`;

/** The backups folder's id, creating the folder the first time. */
export const backupFolder = async (token: string) => {
  const query = encodeURIComponent(
    `name = '${BACKUP_FOLDER}' and mimeType = '${FOLDER_TYPE}' and trashed = false`,
  );
  const found = await request(
    token,
    `${API}/files?q=${query}&spaces=drive&fields=files(id)`,
  ).then(response => response.json());
  if (found.files?.length) return found.files[0].id as string;
  const created = await request(token, `${API}/files?fields=id`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: BACKUP_FOLDER, mimeType: FOLDER_TYPE }),
  }).then(response => response.json());
  return created.id as string;
};

/** The folder's backups, newest first. */
export const listBackups = async (
  token: string,
  folderId: string,
): Promise<DriveBackupFile[]> => {
  const query = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
  const listed = await request(
    token,
    `${API}/files?q=${query}&orderBy=createdTime desc&pageSize=100` +
      "&fields=files(id,name,size,createdTime)",
  ).then(response => response.json());
  return (listed.files ?? []).map((file: Record<string, string>) => ({
    id: file.id,
    name: file.name,
    size: Number(file.size) || 0,
    createdTime: file.createdTime,
  }));
};

/**
 * Uploads a backup as a new file. A resumable upload, because backups with
 * photos are often over the 5 MB a simple upload allows.
 */
export const uploadBackup = async (
  token: string,
  folderId: string,
  name: string,
  text: string,
) => {
  const session = await request(
    token,
    `${UPLOAD}/files?uploadType=resumable`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        parents: [folderId],
        mimeType: "application/json",
      }),
    },
  );
  const location = session.headers.get("Location");
  if (!location) throw new DriveError(0, "Drive gave no upload address");
  const uploaded = await request(token, location, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: text,
  }).then(response => response.json());
  return uploaded.id as string;
};

export const downloadBackup = (token: string, fileId: string) =>
  request(token, `${API}/files/${fileId}?alt=media`).then(response =>
    response.text(),
  );

/** Deletes all but the newest backups; returns how many were deleted. */
export const pruneBackups = async (
  token: string,
  folderId: string,
  keep = BACKUPS_KEPT,
) => {
  const old = (await listBackups(token, folderId)).slice(keep);
  for (const file of old)
    await request(token, `${API}/files/${file.id}`, { method: "DELETE" });
  return old.length;
};
