export function requireEnv(value: string | undefined) {
  if (value == null || value.length === 0) {
    throw new Error("Required ENV");
  }
  return value;
}
