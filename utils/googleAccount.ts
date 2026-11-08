import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { DriveError } from "./driveBackup";

// Only the files and folders this app creates in Drive.
const DRIVE_FILE = "https://www.googleapis.com/auth/drive.file";
// Optional: the Web client ID from Google Cloud. Sign-in works without it
// because the app only needs access tokens, not an ID token.
export const GOOGLE_WEB_CLIENT_ID = "";

let configured = false;
const configure = () => {
  if (configured) return;
  GoogleSignin.configure({
    scopes: [DRIVE_FILE],
    ...(GOOGLE_WEB_CLIENT_ID ? { webClientId: GOOGLE_WEB_CLIENT_ID } : {}),
  });
  configured = true;
};

/** The connected account's email, without asking; undefined if none. */
export const connectedAccount = async () => {
  configure();
  const current = GoogleSignin.getCurrentUser();
  if (current) return current.user.email;
  if (!GoogleSignin.hasPreviousSignIn()) return undefined;
  const silent = await GoogleSignin.signInSilently();
  return silent.type === "success" ? silent.data.user.email : undefined;
};

/** Asks for the account and the Drive permission; undefined if cancelled. */
export const connectAccount = async () => {
  configure();
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const result = await GoogleSignin.signIn();
  return result.type === "success" ? result.data.user.email : undefined;
};

/** Removes the app's Drive permission and signs out. */
export const disconnectAccount = async () => {
  configure();
  try {
    await GoogleSignin.revokeAccess();
  } finally {
    await GoogleSignin.signOut();
  }
};

/**
 * Runs Drive calls with an access token. An expired token is dropped and the
 * calls run once more with a fresh one.
 */
export const withDriveToken = async <T,>(
  work: (token: string) => Promise<T>,
): Promise<T> => {
  configure();
  const { accessToken } = await GoogleSignin.getTokens();
  try {
    return await work(accessToken);
  } catch (error) {
    if (!(error instanceof DriveError) || error.status !== 401) throw error;
    await GoogleSignin.clearCachedAccessToken(accessToken);
    const fresh = await GoogleSignin.getTokens();
    return work(fresh.accessToken);
  }
};
