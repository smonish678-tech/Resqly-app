import { Capacitor, registerPlugin } from '@capacitor/core';

const AgoraCall = registerPlugin('AgoraCall');

/**
 * Opens the native Android Agora room. The caller must first obtain a short-lived
 * RTC token from the authenticated Resqly backend.
 */
export async function startNativeAgoraCall(options) {
  if (Capacitor.getPlatform() !== 'android') {
    throw new Error('Secure video calling is currently available in the Resqly Android app only.');
  }
  if (!options?.token || !options?.appId || !options?.channel || !options?.uid) {
    throw new Error('The secure video-room details are incomplete. Please reopen the consultation.');
  }
  return AgoraCall.startCall(options);
}

export function isNativeAgoraCallSupported() {
  return Capacitor.getPlatform() === 'android';
}
