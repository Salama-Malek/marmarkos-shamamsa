import * as FS from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

export type SaveOutcome =
  | { kind: 'saved'; uri: string }
  | { kind: 'cancelled' }
  | { kind: 'shared'; uri: string };

/**
 * Persists a UTF-8 text payload to the user's chosen location on the device.
 *
 * Android: opens the Storage Access Framework directory picker so the user
 * can save to Downloads, an SD card, a Drive folder, etc. Once the user
 * grants directory permission, the file is created there and stays on the
 * phone independently of the app's sandbox.
 *
 * iOS: there's no SAF equivalent. The OS-level "Save to Files" flow is
 * available only via the share sheet, so we open it. The user can choose
 * "Save to Files" → "On My iPhone" to keep the file on the device, or
 * pick any other destination.
 *
 * Returns 'cancelled' when the user dismisses the picker / share sheet.
 */
export async function saveTextToDevice(
  text: string,
  filename: string,
  mimeType: string,
): Promise<SaveOutcome> {
  if (Platform.OS === 'android') {
    const perms = await FS.StorageAccessFramework.requestDirectoryPermissionsAsync();
    if (!perms.granted) return { kind: 'cancelled' };
    const fileUri = await FS.StorageAccessFramework.createFileAsync(
      perms.directoryUri,
      filename,
      mimeType,
    );
    await FS.writeAsStringAsync(fileUri, text, { encoding: FS.EncodingType.UTF8 });
    return { kind: 'saved', uri: fileUri };
  }
  // iOS / web: write to documentDirectory then share so the user can pick
  // "Save to Files" or any other destination.
  const dir = FS.documentDirectory;
  if (!dir) throw new Error('documentDirectory unavailable');
  const tempUri = dir + filename;
  await FS.writeAsStringAsync(tempUri, text, { encoding: FS.EncodingType.UTF8 });
  const sharingAvailable = await Sharing.isAvailableAsync();
  if (!sharingAvailable) return { kind: 'saved', uri: tempUri };
  await Sharing.shareAsync(tempUri, { mimeType });
  return { kind: 'shared', uri: tempUri };
}
