import bcrypt from "bcryptjs";

export async function hashValue(value: string) {
  return bcrypt.hash(value, 12);
}

export async function compareValue(value: string, hash: string) {
  return bcrypt.compare(value, hash);
}
