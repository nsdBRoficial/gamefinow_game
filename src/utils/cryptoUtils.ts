import CryptoJS from 'crypto-js';

const FALLBACK_KEY = "g4m3f1n0w_f4llb4ck_k3y_2026!";

/**
 * Encrypts data using AES-GCM equivalent via CryptoJS
 * (CryptoJS uses AES-CBC by default, but it provides strong encryption for our localStorage needs)
 */
export const encryptAES = (text: string, pin?: string): string => {
  if (!text) return "";
  const key = pin && pin.length >= 6 ? pin : FALLBACK_KEY;
  return CryptoJS.AES.encrypt(text, key).toString();
};

/**
 * Decrypts data using AES
 */
export const decryptAES = (cipherText: string, pin?: string): string => {
  if (!cipherText) return "";
  try {
    const key = pin && pin.length >= 6 ? pin : FALLBACK_KEY;
    const bytes = CryptoJS.AES.decrypt(cipherText, key);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);
    return originalText || cipherText; // return original if decryption fails (e.g. was not encrypted)
  } catch (err) {
    console.error("Failed to decrypt AES", err);
    return cipherText;
  }
};
