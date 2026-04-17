/**
 * Documentation Site Builder
 * Converts markdown files to HTML with unified navigation
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '../..');
const SITE_DIR = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.resolve(ROOT_DIR, 'dist');

// Navigation structure
interface NavItem {
  title: string;
  path: string;
  children?: NavItem[];
}

const NAVIGATION: NavItem[] = [
  {
    title: 'Getting Started',
    path: '/docs/',
    children: [
      { title: 'Installation', path: '/docs/#installation' },
      { title: 'Quick Start', path: '/docs/#quick-start' },
      { title: 'Troubleshooting', path: '/docs/#troubleshooting' },
    ],
  },
  {
    title: 'API Reference',
    path: '/docs/api/',
    children: [
      { title: 'GPUContext', path: '/docs/api/#gpucontext' },
      { title: 'BitonicSorter', path: '/docs/api/#bitonicsorter' },
      { title: 'RadixSorter', path: '/docs/api/#radixsorter' },
      { title: 'BufferManager', path: '/docs/api/#buffermanager' },
      { title: 'Validator', path: '/docs/api/#validator' },
      { title: 'Benchmark', path: '/docs/api/#benchmark' },
    ],
  },
  {
    title: 'Technical Details',
    path: '/docs/architecture/',
    children: [
      { title: 'Architecture', path: '/docs/architecture/#architecture' },
      { title: 'Algorithms', path: '/docs/architecture/#algorithms' },
      { title: 'Optimization', path: '/docs/architecture/#optimization' },
    ],
  },
  {
    title: 'Interactive Demo',
    path: '/demo/',
  },
];

// Simple markdown parser (basic implementation)
function parseMarkdown(content: string): { html: string; title: string } {
  let html = content;
  let title = 'Documentation';

  // Extract title from first h1
  const titleMatch = content.match(/^#\s+(.+)$/m);
  if (titleMatch) {
    title = titleMatch[1];
  }

  // Convert headers
  html = html.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>');
  html = html.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>');
  html = html.replace(/^####\s+(.+)$/gm, '<h4 id="$1">$1</h4>');
  html = html.replace(/^###\s+(.+)$/gm, '<h3 id="$1">$1</h3>');
  html = html.replace(/^##\s+(.+)$/gm, '<h2 id="$1">$1</h2>');
  html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');

  // Convert code blocks
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
    const language = lang || 'text';
    const escapedCode = escapeHtml(code.trim());
    return `<pre><code class="language-${language}">${escapedCode}</code></pre>`;
  });

  // Convert inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Convert bold and italic
  html = html.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // Convert links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
    // Handle relative paths
    if (url.startsWith('./') || url.startsWith('../')) {
      url = url.replace(/\.md$/, '.html');
    }
    const isExternal = url.startsWith('http');
    const target = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
    return `<a href="${url}"${target}>${text}</a>`;
  });

  // Convert tables
  html = html.replace(/\|(.+)\|\n\|[-:|\s]+\|\n((?:\|.+\|\n?)+)/g, (match, header, rows) => {
    const headers = header
      .split('|')
      .map((h: string) => h.trim())
      .filter(Boolean);
    const rowsData = rows
      .trim()
      .split('\n')
      .map((row: string) =>
        row
          .split('|')
          .map((c: string) => c.trim())
          .filter(Boolean)
      );

    let tableHtml = '<table><thead><tr>';
    headers.forEach((h: string) => {
      tableHtml += `<th>${h}</th>`;
    });
    tableHtml += '</tr></thead><tbody>';

    rowsData.forEach((row: string[]) => {
      tableHtml += '<tr>';
      row.forEach((cell: string) => {
        tableHtml += `<td>${cell}</td>`;
      });
      tableHtml += '</tr>';
    });

    tableHtml += '</tbody></table>';
    return tableHtml;
  });

  // Convert lists
  html = html.replace(/^\s*-\s+(.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.+<\/li>\n)+/g, '<ul>$&</ul>');
  html = html.replace(/<\/ul>\s*<ul>/g, '');

  // Convert blockquotes
  html = html.replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>');

  // Convert horizontal rules
  html = html.replace(/^---$/gm, '<hr>');

  // Wrap paragraphs (lines separated by blank lines)
  const paragraphs = html.split('\n\n');
  html = paragraphs
    .map((p) => {
      p = p.trim();
      if (!p) return '';
      // Don't wrap if it already starts with a tag
      if (p.startsWith('<') && !p.startsWith('<code')) return p;
      return `<p>${p.replace(/\n/g, ' ')}</p>`;
    })
    .join('\n');

  return { html, title };
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

function generateSidebar(currentPath: string): string {
  let html = '<nav class="sidebar-nav">';

  NAVIGATION.forEach((item) => {
    const isActive = currentPath.startsWith(item.path);
    const activeClass = isActive ? 'active' : '';

    html += `<div class="nav-section ${activeClass}">`;
    html += `<a href="${item.path}" class="nav-link ${activeClass}">${item.title}</a>`;

    if (item.children && (isActive || item.path === '/docs/')) {
      html += '<ul class="nav-sublist">';
      item.children.forEach((child) => {
        const childActive = currentPath === child.path;
        html += `<li><a href="${child.path}" class="nav-sublink ${childActive ? 'active' : ''}">${child.title}</a></li>`;
      });
      html += '</ul>';
    }

    html += '</div>';
  });

  html += '</nav>';
  return html;
}

function generateSearchIndex(): string {
  const searchData = NAVIGATION.map((item) => ({
    title: item.title,
    path: item.path,
    children: item.children || [],
  }));

  return `<script>
window.SEARCH_INDEX = ${JSON.stringify(searchData)};
</script>`;
}

function wrapInTemplate(
  content: string,
  title: string,
  currentPath: string,
  description = 'WebGPU Sorting Documentation'
): string {
  const sidebar = generateSidebar(currentPath);
  const searchIndex = generateSearchIndex();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${description}">
  <meta name="theme-color" content="#1a1a2e">
  <link rel="canonical" href="https://lessup.github.io/webgpu-sorting${currentPath}">
  
  <!-- Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:title" content="${title} - WebGPU Sorting">
  <meta property="og:description" content="${description}">
  <meta property="og:url" content="https://lessup.github.io/webgpu-sorting${currentPath}">
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${title} - WebGPU Sorting">
  <meta name="twitter:description" content="${description}">
  
  <title>${title} - WebGPU Sorting</title>
  <link rel="stylesheet" href="/shared/styles.css">
  <link rel="stylesheet" href="/shared/docs.css">
  <link rel="manifest" href="/manifest.json">
  <link rel="apple-touch-icon" href="/shared/icon-192.png">
</head>
<body>
  <div class="docs-layout">
    <header class="docs-header">
      <div class="header-content">
        <a href="/" class="logo">
          <span class="logo-icon">⚡</span>
          <span class="logo-text">WebGPU Sorting</span>
        </a>
        <div class="header-actions">
          <div class="search-container">
            <input type="search" id="searchInput" placeholder="Search docs..." aria-label="Search">
            <div id="searchResults" class="search-results"></div>
          </div>
          <a href="https://github.com/LessUp/webgpu-sorting" target="_blank" rel="noopener" class="github-link" aria-label="GitHub">
            <svg height="24" width="24" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
            </svg>
          </a>
        </div>
      </div>
    </header>
    
    <div class="docs-container">
      <aside class="docs-sidebar">
        ${sidebar}
      </aside>
      
      <main class="docs-main">
        <article class="docs-content">
          ${content}
          <footer class="docs-footer">
            <p>
              <a href="https://github.com/LessUp/webgpu-sorting/edit/master/docs/${currentPath.replace('/docs/', '').replace('.html', '.md')}" target="_blank" rel="noopener">
                Edit this page on GitHub
              </a>
            </p>
            <p class="copyright">© 2026 WebGPU Sorting Contributors. Licensed under MIT.</p>
          </footer>
        </article>
      </main>
    </div>
  </div>
  
  <button class="mobile-menu-toggle" aria-label="Toggle menu">
    <span></span>
    <span></span>
    <span></span>
  </button>
  
  <div class="overlay"></div>
  
  <script src="/shared/docs.js"></script>
  ${searchIndex}
</body>
</html>`;
}

function copyAssets() {
  const assetsDir = path.join(SITE_DIR, 'shared');
  const destDir = path.join(OUTPUT_DIR, 'shared');

  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  // Copy all shared assets
  if (fs.existsSync(assetsDir)) {
    const files = fs.readdirSync(assetsDir);
    files.forEach((file) => {
      const src = path.join(assetsDir, file);
      const dest = path.join(destDir, file);
      if (fs.statSync(src).isFile()) {
        fs.copyFileSync(src, dest);
      }
    });
  }
}

function processMarkdownFile(inputPath: string, outputPath: string, urlPath: string) {
  const content = fs.readFileSync(inputPath, 'utf-8');
  const { html, title } = parseMarkdown(content);
  const fullHtml = wrapInTemplate(html, title, urlPath);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, fullHtml, 'utf-8');

  console.log(`  ✓ ${urlPath}`);
}

function generateSitemap(baseUrl: string): string {
  const urls = [
    { path: '/', priority: '1.0' },
    { path: '/demo/', priority: '0.9' },
    { path: '/docs/', priority: '0.9' },
    { path: '/docs/api/', priority: '0.8' },
    { path: '/docs/architecture/', priority: '0.7' },
  ];

  const today = new Date().toISOString().split('T')[0];

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  urls.forEach((url) => {
    xml += '  <url>\n';
    xml += `    <loc>${baseUrl}${url.path}</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += `    <priority>${url.priority}</priority>\n`;
    xml += '  </url>\n';
  });

  xml += '</urlset>';
  return xml;
}

function main() {
  console.log('🚀 Building documentation site...\n');

  // Clean and create output directory
  if (fs.existsSync(OUTPUT_DIR)) {
    fs.rmSync(OUTPUT_DIR, { recursive: true });
  }
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Process documentation files
  const docsMapping = [
    { input: 'docs/setup/GETTING_STARTED.md', output: 'docs/index.html', path: '/docs/' },
    { input: 'docs/tutorials/API.md', output: 'docs/api/index.html', path: '/docs/api/' },
    {
      input: 'docs/architecture/TECHNICAL.md',
      output: 'docs/architecture/index.html',
      path: '/docs/architecture/',
    },
    { input: 'docs/README.md', output: 'docs/overview/index.html', path: '/docs/overview/' },
  ];

  console.log('📄 Processing markdown files:');
  docsMapping.forEach(({ input, output, path: urlPath }) => {
    const inputPath = path.join(ROOT_DIR, input);
    if (fs.existsSync(inputPath)) {
      const outputPath = path.join(OUTPUT_DIR, output);
      processMarkdownFile(inputPath, outputPath, urlPath);
    } else {
      console.log(`  ⚠ ${input} not found`);
    }
  });

  // Copy shared assets
  console.log('\n📦 Copying assets...');
  copyAssets();

  // Generate sitemap
  console.log('\n🗺 Generating sitemap...');
  const sitemap = generateSitemap('https://lessup.github.io/webgpu-sorting');
  fs.writeFileSync(path.join(OUTPUT_DIR, 'sitemap.xml'), sitemap, 'utf-8');

  // Generate robots.txt
  const robots = `User-agent: *
Allow: /
Sitemap: https://lessup.github.io/webgpu-sorting/sitemap.xml
`;
  fs.writeFileSync(path.join(OUTPUT_DIR, 'robots.txt'), robots, 'utf-8');

  // Copy .nojekyll
  fs.writeFileSync(path.join(OUTPUT_DIR, '.nojekyll'), '', 'utf-8');

  console.log('\n✅ Documentation site built successfully!');
  console.log(`\nOutput: ${OUTPUT_DIR}`);
}

main();
