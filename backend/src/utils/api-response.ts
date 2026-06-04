export function success<T>(data: T, meta?: Record<string, unknown>) {
  return meta ? { success: true, data, meta } : { success: true, data };
}
