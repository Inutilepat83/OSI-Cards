/**
 * Parser Utilities
 *
 * Utilities for parsing various data formats.
 *
 * @example
 * ```typescript
 * import { parseMarkdown, parseYAML, parseINI } from '@osi-cards/utils';
 *
 * const html = parseMarkdown('# Hello World');
 * const data = parseYAML(yamlString);
 * ```
 */

export function parseMarkdownBasic(markdown: string): string {
  return markdown
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*)\*/gim, '<em>$1</em>')
    .replace(/!\[(.*?)\]\((.*?)\)/gim, '<img alt="$1" src="$2" />')
    .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2">$1</a>')
    .replace(/\n$/gim, '<br />');
}

export function parseCSV(csv: string, delimiter = ','): string[][] {
  return csv
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => line.split(delimiter).map((cell) => cell.trim()));
}

export function parseINI(ini: string): Record<string, Record<string, string>> {
  const result: Record<string, Record<string, string>> = {};
  let currentSection = 'default';
  result[currentSection] = {};

  ini.split('\n').forEach((line) => {
    line = line.trim();

    if (!line || line.startsWith(';') || line.startsWith('#')) return;

    if (line.startsWith('[') && line.endsWith(']')) {
      currentSection = line.slice(1, -1);
      result[currentSection] = {};
    } else {
      const [key, ...valueParts] = line.split('=');
      if (key) {
        result[currentSection][key.trim()] = valueParts.join('=').trim();
      }
    }
  });

  return result;
}

export function parseYAMLBasic(yaml: string): any {
  const lines = yaml.split('\n');
  const result: any = {};
  let currentIndent = 0;
  let currentObj: any = result;

  lines.forEach((line) => {
    if (!line.trim() || line.trim().startsWith('#')) return;

    const indent = line.search(/\S/);
    const content = line.trim();

    if (content.includes(':')) {
      const [key, value] = content.split(':').map((s) => s.trim());
      currentObj[key] = value || {};
    }
  });

  return result;
}

export function parseURL(url: string): {
  protocol: string;
  hostname: string;
  port: string;
  pathname: string;
  search: string;
  hash: string;
  params: Record<string, string>;
} {
  const parsed = new URL(url);
  const params: Record<string, string> = {};

  parsed.searchParams.forEach((value, key) => {
    params[key] = value;
  });

  return {
    protocol: parsed.protocol,
    hostname: parsed.hostname,
    port: parsed.port,
    pathname: parsed.pathname,
    search: parsed.search,
    hash: parsed.hash,
    params,
  };
}

export function parseUserAgent(ua: string): {
  browser: string;
  version: string;
  os: string;
  mobile: boolean;
} {
  const mobile = /Mobile|Android|iPhone|iPad/i.test(ua);

  let browser = 'Unknown';
  let version = '';

  if (ua.includes('Firefox/')) {
    browser = 'Firefox';
    version = ua.match(/Firefox\/(\d+)/)?.[1] || '';
  } else if (ua.includes('Chrome/')) {
    browser = 'Chrome';
    version = ua.match(/Chrome\/(\d+)/)?.[1] || '';
  } else if (ua.includes('Safari/')) {
    browser = 'Safari';
    version = ua.match(/Version\/(\d+)/)?.[1] || '';
  }

  let os = 'Unknown';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS')) os = 'iOS';

  return { browser, version, os, mobile };
}
