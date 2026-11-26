export const isValidEmail = (email) =>
  typeof email === "string";

export const isValidName = (name) =>
  typeof name === "string" &&
  name.trim().length >= 2 &&
  name.trim().length <= 100;

export const isValidPassword = (password) =>
  typeof password === "string" && password.length >= 8 && password.length <= 72;

export const normalizeOptionalString = (value, maxLength) => {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || value.trim().length > maxLength) return undefined;
  return value.trim();
};