import { log } from '@/core/log';

/** Wrap chrome.* Promise calls with E-004 error logging. */
export async function callChrome<T>(label: string, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    log(label, error);
    throw error;
  }
}
