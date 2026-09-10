import { customAlphabet } from "nanoid";

const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const generate = customAlphabet(alphabet, 8);

export function createInviteCode() {
  return generate();
}

export function normalizeInviteCode(code: string) {
  return code.trim().toUpperCase().replaceAll(" ", "");
}
