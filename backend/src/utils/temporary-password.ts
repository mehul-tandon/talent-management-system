import crypto from "node:crypto";

const REQUIRED_CHARSETS = ["ABCDEFGHJKLMNPQRSTUVWXYZ", "abcdefghijkmnopqrstuvwxyz", "23456789", "!@#$%^&*"];

function pickRandomCharacter(characters: string) {
  return characters[crypto.randomInt(0, characters.length)];
}

export function generateTemporaryPassword(length = 14) {
  const passwordCharacters = REQUIRED_CHARSETS.join("");
  const password = REQUIRED_CHARSETS.map((characters) => pickRandomCharacter(characters));

  while (password.length < length) {
    password.push(pickRandomCharacter(passwordCharacters));
  }

  for (let index = password.length - 1; index > 0; index -= 1) {
    const swapIndex = crypto.randomInt(0, index + 1);
    [password[index], password[swapIndex]] = [password[swapIndex], password[index]];
  }

  return password.join("");
}
