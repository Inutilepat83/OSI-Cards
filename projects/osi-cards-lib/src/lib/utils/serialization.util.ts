/**
 * Serialization Utilities
 *
 * Advanced serialization and deserialization utilities.
 *
 * @example
 * ```typescript
 * import { serialize, deserialize, toQueryString } from '@osi-cards/utils';
 *
 * const serialized = serialize(obj);
 * const obj = deserialize(serialized);
 * const qs = toQueryString({ page: 1, filter: 'active' });
 * ```
 */

export function serialize(obj: any): string {
  return JSON.stringify(obj);
}

export function deserialize<T = any>(str: string): T {
  return JSON.parse(str);
}

export function serializeToBase64(obj: any): string {
  const json = JSON.stringify(obj);
  return btoa(encodeURIComponent(json));
}

export function deserializeFromBase64<T = any>(str: string): T {
  const json = decodeURIComponent(atob(str));
  return JSON.parse(json);
}

export function toQueryString(params: Record<string, any>): string {
  return Object.entries(params)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return value.map(v => `${encodeURIComponent(key)}[]=${encodeURIComponent(v)}`).join('&');
      }
      return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
    })
    .join('&');
}

export function fromQueryString(query: string): Record<string, any> {
  const params: Record<string, any> = {};

  query.split('&').forEach(pair => {
    const [key, value] = pair.split('=');
    if (!key) return;

    const decodedKey = decodeURIComponent(key);
    const decodedValue = decodeURIComponent(value || '');

    if (decodedKey.endsWith('[]')) {
      const arrayKey = decodedKey.slice(0, -2);
      params[arrayKey] = params[arrayKey] || [];
      params[arrayKey].push(decodedValue);
    } else {
      params[decodedKey] = decodedValue;
    }
  });

  return params;
}

export function toFormData(obj: Record<string, any>): FormData {
  const formData = new FormData();

  Object.entries(obj).forEach(([key, value]) => {
    if (value instanceof File) {
      formData.append(key, value);
    } else if (Array.isArray(value)) {
      value.forEach(v => formData.append(`${key}[]`, v));
    } else {
      formData.append(key, String(value));
    }
  });

  return formData;
}

export function fromFormData(formData: FormData): Record<string, any> {
  const obj: Record<string, any> = {};

  formData.forEach((value, key) => {
    if (key.endsWith('[]')) {
      const arrayKey = key.slice(0, -2);
      obj[arrayKey] = obj[arrayKey] || [];
      obj[arrayKey].push(value);
    } else {
      obj[key] = value;
    }
  });

  return obj;
}

