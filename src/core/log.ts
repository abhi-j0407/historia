/** Prefix-and-forward to console.error per E-001. No remote telemetry in v1. */
export function log(message: string, ...rest: unknown[]): void {
  // eslint-disable-next-line no-console -- E-001 explicitly uses console.
  console.error(`[historia] ${message}`, ...rest);
}
