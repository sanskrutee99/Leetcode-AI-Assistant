const STORAGE_KEY = "groqApiKey";

function sanitizeApiKey(key) {
  if (!key || typeof key !== "string") return "";
  return key
    .trim()
    .replace(/^["']+|["']+$/g, "")
    .replace(/[\s\u200b-\u200d\uFEFF]/g, "");
}

function storageGet() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(result);
    });
  });
}

function storageSet(data) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set(data, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve();
    });
  });
}

async function getGroqApiKey() {
  const result = await storageGet();
  return sanitizeApiKey(result[STORAGE_KEY] || "");
}

async function setGroqApiKey(key) {
  const clean = sanitizeApiKey(key);
  await storageSet({ [STORAGE_KEY]: clean });
  return clean;
}

function maskApiKey(key) {
  const clean = sanitizeApiKey(key);
  if (!clean) return "Not set";
  if (clean.length <= 8) return "••••••••";
  return `${clean.slice(0, 4)}…${clean.slice(-4)}`;
}

function isLikelyGroqKey(key) {
  const clean = sanitizeApiKey(key);
  return clean.startsWith("gsk_") && clean.length >= 20;
}
