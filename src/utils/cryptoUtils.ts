const FALLBACK_KEY = "g4m3f1n0w_f4llb4ck_k3y_2026!";

/**
 * Obfuscates data using XOR + Base64 (fallback since crypto-js causes require() error in Vite)
 */
export const encryptAES = (text: string, pin?: string): string => {
  if (!text) return "";
  const key = pin && pin.length >= 6 ? pin : FALLBACK_KEY;
  let result = "";
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return btoa(result);
};

/**
 * De-obfuscates data using XOR + Base64
 */
export const decryptAES = (cipherText: string, pin?: string): string => {
  if (!cipherText) return "";
  try {
    const key = pin && pin.length >= 6 ? pin : FALLBACK_KEY;
    const decoded = atob(cipherText);
    let originalText = "";
    for (let i = 0; i < decoded.length; i++) {
      originalText += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return originalText;
  } catch (err) {
    console.error("Failed to decrypt AES", err);
    return cipherText;
  }
};
