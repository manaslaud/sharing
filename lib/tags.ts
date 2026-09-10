export const MAX_TAGS = 20;
export const MAX_TAG_LENGTH = 32;

export function normalizeTagName(raw: string) {
  return raw.trim().replace(/^#+/, "").trim().toLowerCase();
}

export function isValidTagName(name: string) {
  return name.length >= 1 && name.length <= MAX_TAG_LENGTH;
}
