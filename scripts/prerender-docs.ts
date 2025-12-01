#!/usr/bin/env node
/**
 * Documentation Pre-rendering Script
 * 
 * Scans all documentation page components, extracts markdown content,
 * renders to HTML, and outputs:
 * - JSON files for Angular app consumption
 * - Static HTML files for SEO
 * 
 * Usage:
 *   npx ts-node scripts/prerender-docs.ts
 *   npm run docs:prerender
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Output directories
const DOCS_DIR = path.join(__dirname, '../src/app/features/documentation');
const JSON_OUTPUT_DIR = path.join(__dirname, '../src/assets/docs/rendered');
const HTML_OUTPUT_DIR = path.join(__dirname, '../docs-static');

// Ensure output directories exist
if (!fs.existsSync(JSON_OUTPUT_DIR)) {
  fs.mkdirSync(JSON_OUTPUT_DIR, { recursive: true });
}
if (!fs.existsSync(HTML_OUTPUT_DIR)) {
  fs.mkdirSync(HTML_OUTPUT_DIR, { recursive: true });
}

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface RenderedPage {
  pageId: string;
  title: string;
  html: string;
  toc: TocItem[];
  contentHash: string;
  generatedAt: string;
  demoConfigs: Record<string, unknown>;
}

/**
 * Extract markdown content from a page component file or index.md
 * Priority: index.md > pageContent in component
 */
function extractMarkdownContent(filePath: string): string | null {
  try {
    const dir = path.dirname(filePath);
    const indexMdPath = path.join(dir, 'index.md');
    
    // First, check for index.md file (preferred for large content)
    if (fs.existsSync(indexMdPath)) {
      const markdown = fs.readFileSync(indexMdPath, 'utf-8');
      if (markdown.trim()) {
        return markdown;
      }
    }
    
    // Fall back to extracting from page.component.ts
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Look for pageContent constant with template literal
    // Use greedy match to get the full content (match until the final `; before @Component or export)
    const templateLiteralMatch = content.match(/const\s+pageContent\s*=\s*`([\s\S]*?)`;\s*\n\s*(?=@Component|export)/);
    if (templateLiteralMatch && templateLiteralMatch[1]) {
      let markdown = templateLiteralMatch[1];
      
      // First, handle code blocks with escaped backticks
      // Match \`\`\`language ... \`\`\` (escaped form in template literal)
      markdown = markdown.replace(/\\`\\`\\`(\w*)\s*\n?([\s\S]*?)\\`\\`\\`/g, (_, lang, code) => {
        // Unescape backticks inside code blocks separately
        const unescapedCode = code.replace(/\\`/g, '`').replace(/\\\$/g, '$');
        return '```' + (lang || '') + '\n' + unescapedCode + '```';
      });
      
      // Then unescape remaining template literal escapes outside code blocks
      markdown = markdown
        .replace(/\\`/g, '`')
        .replace(/\\\$/g, '$');
      
      return markdown;
    }
    
    // Look for pageContent with single quotes
    const singleQuoteMatch = content.match(/const\s+pageContent\s*=\s*'([\s\S]*?)';/);
    if (singleQuoteMatch && singleQuoteMatch[1]) {
      return singleQuoteMatch[1]
        .replace(/\\n/g, '\n')
        .replace(/\\'/g, "'");
    }
    
    // Look for pageContent with double quotes
    const doubleQuoteMatch = content.match(/const\s+pageContent\s*=\s*"([\s\S]*?)";/);
    if (doubleQuoteMatch && doubleQuoteMatch[1]) {
      return doubleQuoteMatch[1]
        .replace(/\\n/g, '\n')
        .replace(/\\"/g, '"');
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Extract page title from markdown content
 */
function extractTitle(markdown: string): string {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match && match[1] ? match[1].trim() : 'Documentation';
}

/**
 * Generate content hash for cache invalidation
 */
function hashContent(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
}

/**
 * Process callout blocks (:::tip, :::warning, :::info, :::danger)
 */
function processCallouts(content: string): string {
  const calloutRegex = /:::(tip|warning|info|danger)(?:\s+(.+?))?\n([\s\S]*?):::/g;
  
  const icons: Record<string, string> = {
    tip: '<svg class="callout-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v1"></path><path d="M12 21v1"></path><path d="m4.93 4.93.7.7"></path><path d="m18.37 18.37.7.7"></path><path d="M2 12h1"></path><path d="M21 12h1"></path><path d="m4.93 19.07.7-.7"></path><path d="m18.37 5.63.7-.7"></path><circle cx="12" cy="12" r="4"></circle></svg>',
    warning: '<svg class="callout-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"></path><line x1="12" x2="12" y1="9" y2="13"></line><line x1="12" x2="12.01" y1="17" y2="17"></line></svg>',
    info: '<svg class="callout-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>',
    danger: '<svg class="callout-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m8 2 1.88 1.88"></path><path d="M14.12 3.88 16 2"></path><path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"></path><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6"></path><path d="M12 20v-9"></path><path d="M6.53 9C4.6 8.8 3 7.1 3 5"></path><path d="M6 13H2"></path><path d="M3 21c0-2.1 1.7-3.9 3.8-4"></path><path d="M20.97 5c0 2.1-1.6 3.8-3.5 4"></path><path d="M22 13h-4"></path><path d="M17.2 17c2.1.1 3.8 1.9 3.8 4"></path></svg>'
  };
  
  return content.replace(calloutRegex, (_, type, title, body) => {
    const icon = icons[type] || icons['info'];
    const titleHtml = title ? `<span class="callout-title">${title}</span>` : '';
    return `<div class="callout ${type}">${icon}<div class="callout-content">${titleHtml}<p>${body.trim()}</p></div></div>`;
  });
}

/**
 * Render markdown to HTML (matching doc-page.component.ts logic)
 */
function renderMarkdown(content: string): { html: string; toc: TocItem[]; demoConfigs: Record<string, unknown> } {
  const tocItems: TocItem[] = [];
  const demoConfigs: Record<string, unknown> = {};
  let demoCounter = 0;
  
  let html = content;
  
  // Process callout blocks FIRST
  html = processCallouts(html);
  
  // Escape HTML (except for already processed callouts)
  html = html
    .replace(/&(?!amp;|lt;|gt;)/g, '&amp;')
    .replace(/<(?!div|\/div|span|\/span|p|\/p|strong|\/strong|svg|\/svg|path)/g, '&lt;')
    .replace(/(?<!div|span|p|strong|svg|path)>/g, '&gt;');
  
  // Code blocks with copy button and live demo for JSON
  html = html.replace(/```(\w*)\s*\n?([\s\S]*?)```/g, (_, lang, code) => {
    const language = lang || 'text';
    const trimmedCode = code.trim();
    const escapedCode = trimmedCode
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    // Check if this is a JSON block that looks like a card/section config
    let liveDemoButton = '';
    let demoContainer = '';
    if (language === 'json') {
      try {
        const parsed = JSON.parse(trimmedCode);
        // Check if it looks like a card or section config
        if (parsed.type || parsed.sections || parsed.cardTitle) {
          const demoId = `demo-${demoCounter++}`;
          demoConfigs[demoId] = parsed;
          liveDemoButton = `<button class="live-demo-btn" type="button" data-demo-id="${demoId}"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>Live Demo</button>`;
          demoContainer = `<div id="demo-container-${demoId}" class="live-demo-container"></div>`;
        }
      } catch {
        // Not valid JSON or not a card config, ignore
      }
    }
    
    // Special handling for LLM prompt blocks
    if (language === 'llm') {
      return `<div class="llm-copy-standalone"><div class="llm-copy-btn" role="button" tabindex="0">COPY PROMPT</div></div><div class="code-block-wrapper llm-block"><div class="code-header"><span class="code-lang">${language}</span></div><pre><code class="language-${language}">${escapedCode}</code></pre></div>`;
    }
    
    return `<div class="code-block-wrapper"><div class="code-header"><span class="code-lang">${language}</span><div class="code-actions">${liveDemoButton}<button class="copy-btn" type="button"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>Copy</button></div></div><pre><code class="language-${language}">${escapedCode}</code></pre></div>${demoContainer}`;
  });
  
  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // Bold
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  
  // Italic
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  
  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  
  // Headers with anchor links
  html = html.replace(/^(#{1,6})\s+(.+)$/gm, (_, hashes, text) => {
    const level = hashes.length;
    const cleanText = text.replace(/<[^>]*>/g, '').trim();
    const id = cleanText.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    if (level <= 4) {
      tocItems.push({ id, text: cleanText, level });
    }
    
    return `<h${level} id="${id}"><a href="#${id}" class="anchor-link" aria-hidden="true">#</a>${text}</h${level}>`;
  });
  
  // Tables
  html = html.replace(/(\|[^\n]+\|\n)+/g, (match) => {
    const rows = match.trim().split('\n');
    if (rows.length < 2) return match;
    
    const headerRow = rows[0] ?? '';
    const separatorRow = rows[1] ?? '';
    const dataRows = rows.slice(2);
    
    // Check if second row is separator
    if (!/^\|[\s\-:|]+\|$/.test(separatorRow)) return match;
    
    const parseRow = (row: string) => {
      return row.split('|').slice(1, -1).map(cell => cell.trim());
    };
    
    const headers = parseRow(headerRow);
    const tableRows = dataRows.map(row => parseRow(row));
    
    let tableHtml = '<div class="table-wrapper"><table><thead><tr>';
    headers.forEach(h => {
      tableHtml += `<th>${h}</th>`;
    });
    tableHtml += '</tr></thead><tbody>';
    tableRows.forEach(row => {
      tableHtml += '<tr>';
      row.forEach(cell => {
        tableHtml += `<td>${cell}</td>`;
      });
      tableHtml += '</tr>';
    });
    tableHtml += '</tbody></table></div>';
    
    return tableHtml;
  });
  
  // Blockquotes
  html = html.replace(/^>\s+(.+)$/gm, '<blockquote><p>$1</p></blockquote>');
  
  // Process lists - find consecutive list items and wrap them together
  html = html.replace(/(^[-*]\s+.+$\n?)+/gm, (match) => {
    const items = match.trim().split('\n')
      .filter(line => line.trim())
      .map(line => `<li>${line.replace(/^[-*]\s+/, '')}</li>`)
      .join('');
    return `<ul>${items}</ul>`;
  });
  
  // Process ordered lists
  html = html.replace(/(^\d+\.\s+.+$\n?)+/gm, (match) => {
    const items = match.trim().split('\n')
      .filter(line => line.trim())
      .map(line => `<li>${line.replace(/^\d+\.\s+/, '')}</li>`)
      .join('');
    return `<ol>${items}</ol>`;
  });
  
  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr>');
  
  // Paragraphs - double newlines become paragraph breaks
  html = html.replace(/\n\n+/g, '</p><p>');
  
  // Single line breaks - only convert to <br> if not inside a list or other block element
  html = html.replace(/(?<![>\n])\n(?![<\n])/g, '<br>');

  // Wrap in paragraph if needed
  if (!html.startsWith('<h') && !html.startsWith('<pre') && !html.startsWith('<ul') && !html.startsWith('<ol') && !html.startsWith('<div')) {
    html = '<p>' + html + '</p>';
  }

  // Clean up
  html = html
    .replace(/<p><\/p>/g, '')
    .replace(/<p><br><\/p>/g, '')
    .replace(/<p>\s*<\/p>/g, '')
    .replace(/<br>\s*<br>\s*<br>/g, '<br><br>')
    .replace(/<\/ul>\s*(?:<br>\s*)*<ul>/g, '')  // Merge consecutive <ul> elements
    .replace(/<\/ol>\s*(?:<br>\s*)*<ol>/g, ''); // Merge consecutive <ol> elements

  return { html, toc: tocItems, demoConfigs };
}

/**
 * Generate static HTML page
 */
function generateStaticHtml(page: RenderedPage): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${page.title} - OSI Cards Documentation</title>
  <meta name="description" content="OSI Cards documentation: ${page.title}">
  <meta property="og:title" content="${page.title} - OSI Cards">
  <meta property="og:description" content="OSI Cards documentation: ${page.title}">
  <meta property="og:type" content="article">
  <meta name="twitter:card" content="summary">
  <link rel="canonical" href="https://osi-cards.dev/docs/${page.pageId}">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 2rem; }
    pre { background: #1e1e1e; color: #d4d4d4; padding: 1rem; border-radius: 8px; overflow-x: auto; }
    code { background: #f3f4f6; padding: 0.2rem 0.4rem; border-radius: 4px; font-size: 0.9em; }
    pre code { background: none; padding: 0; }
    h1, h2, h3, h4 { margin-top: 2rem; }
    .anchor-link { opacity: 0; margin-left: 0.5rem; text-decoration: none; }
    h1:hover .anchor-link, h2:hover .anchor-link, h3:hover .anchor-link { opacity: 0.5; }
    a { color: #e07b39; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #e5e7eb; padding: 0.5rem; text-align: left; }
    th { background: #f9fafb; }
    .callout { padding: 1rem; border-radius: 8px; margin: 1rem 0; display: flex; gap: 0.75rem; }
    .callout.tip { background: #ecfdf5; border-left: 4px solid #10b981; }
    .callout.warning { background: #fffbeb; border-left: 4px solid #f59e0b; }
    .callout.info { background: #eff6ff; border-left: 4px solid #3b82f6; }
    .callout.danger { background: #fef2f2; border-left: 4px solid #ef4444; }
    .callout-icon { width: 20px; height: 20px; flex-shrink: 0; }
    .code-header { display: flex; justify-content: space-between; background: #2d2d2d; padding: 0.5rem 1rem; border-radius: 8px 8px 0 0; }
    .code-lang { color: #9ca3af; font-size: 0.75rem; text-transform: uppercase; }
    .code-block-wrapper pre { margin-top: 0; border-radius: 0 0 8px 8px; }
  </style>
</head>
<body>
  <nav>
    <a href="/">← Back to OSI Cards</a> |
    <a href="/docs">Documentation</a>
  </nav>
  <main>
    ${page.html}
  </main>
  <footer>
    <p>Generated: ${page.generatedAt}</p>
    <p><a href="https://github.com/Inutilepat83/OSI-Cards">View on GitHub</a></p>
  </footer>
</body>
</html>`;
}

/**
 * Find all page.component.ts files recursively
 */
function findPageComponents(dir: string): string[] {
  const results: string[] = [];
  
  function scan(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        // Skip node_modules, components, services directories
        if (!['node_modules', 'components', 'services'].includes(entry.name)) {
          scan(fullPath);
        }
      } else if (entry.name === 'page.component.ts') {
        results.push(fullPath);
      }
    }
  }
  
  scan(dir);
  return results;
}

/**
 * Get page ID from file path
 */
function getPageId(filePath: string): string {
  const relativePath = path.relative(DOCS_DIR, path.dirname(filePath));
  return relativePath.replace(/\\/g, '/');
}

/**
 * Main pre-rendering function
 */
async function prerenderDocs() {
  console.log('🔍 Scanning documentation pages...');
  
  const pageFiles = findPageComponents(DOCS_DIR);
  console.log(`📄 Found ${pageFiles.length} page components\n`);
  
  const manifest: Record<string, { hash: string; title: string; generatedAt: string }> = {};
  let successCount = 0;
  let skipCount = 0;
  
  for (const filePath of pageFiles) {
    const pageId = getPageId(filePath);
    
    // Extract markdown content
    const markdown = extractMarkdownContent(filePath);
    
    if (!markdown) {
      console.log(`⏭️  Skipping ${pageId} (no markdown content)`);
      skipCount++;
      continue;
    }
    
    // Render to HTML
    const { html, toc, demoConfigs } = renderMarkdown(markdown);
    const title = extractTitle(markdown);
    const contentHash = hashContent(markdown);
    const generatedAt = new Date().toISOString();
    
    const renderedPage: RenderedPage = {
      pageId,
      title,
      html,
      toc,
      contentHash,
      generatedAt,
      demoConfigs
    };
    
    // Write JSON file
    const jsonPath = path.join(JSON_OUTPUT_DIR, `${pageId.replace(/\//g, '-')}.json`);
    fs.mkdirSync(path.dirname(jsonPath), { recursive: true });
    fs.writeFileSync(jsonPath, JSON.stringify(renderedPage, null, 2));
    
    // Write static HTML file
    const htmlPath = path.join(HTML_OUTPUT_DIR, `${pageId.replace(/\//g, '-')}.html`);
    fs.mkdirSync(path.dirname(htmlPath), { recursive: true });
    fs.writeFileSync(htmlPath, generateStaticHtml(renderedPage));
    
    // Add to manifest
    manifest[pageId] = { hash: contentHash, title, generatedAt };
    
    console.log(`✅ Rendered: ${pageId}`);
    successCount++;
  }
  
  // Write manifest file
  const manifestPath = path.join(JSON_OUTPUT_DIR, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify({
    generatedAt: new Date().toISOString(),
    pages: manifest
  }, null, 2));
  
  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Rendered: ${successCount} pages`);
  console.log(`   ⏭️  Skipped: ${skipCount} pages`);
  console.log(`   📁 JSON output: ${JSON_OUTPUT_DIR}`);
  console.log(`   📁 HTML output: ${HTML_OUTPUT_DIR}`);
  console.log(`\n✨ Pre-rendering complete!`);
}

// Run the script
prerenderDocs().catch(console.error);

