import { defineConfig } from 'vitepress';
import llmstxt from 'vitepress-plugin-llms';

// Dynamic base path for GitHub Pages
const base = process.env.GITHUB_PAGES ? '/webgpu-sorting/' : '/';

export default defineConfig({
  base,
  title: 'WebGPU Sorting',
  description: 'GPU-Accelerated Sorting Algorithms - Technical Whitepaper',

  head: [
    // Security headers
    [
      'meta',
      {
        'http-equiv': 'Content-Security-Policy',
        content:
          "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:",
      },
    ],
    [
      'meta',
      {
        'http-equiv': 'Permissions-Policy',
        content: 'geolocation=(), microphone=(), camera=(), payment=(), usb=(), interest-cohort=()',
      },
    ],
    ['meta', { name: 'theme-color', content: '#00d4aa' }],
    ['meta', { name: 'author', content: 'AICL-Lab' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'WebGPU Sorting - Technical Whitepaper' }],
    [
      'meta',
      {
        property: 'og:description',
        content: 'GPU-accelerated sorting with WebGPU compute shaders',
      },
    ],
  ],

  // Markdown extensions for technical whitepaper
  markdown: {
    math: true,
  },

  // Clean URLs
  cleanUrls: true,

  // Last updated for documentation freshness
  lastUpdated: true,

  themeConfig: {
    // Technical whitepaper aesthetic
    logo: '/icons/icon-192.png',
    siteTitle: 'WebGPU Sorting',

    // Navigation - Architecture Showcase focused
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Demo', link: '/demo/' },
      { text: 'Architecture', link: '/architecture' },
      { text: 'API', link: '/api' },
      { text: 'Performance', link: '/performance' },
    ],

    // Sidebar - Technical documentation hierarchy
    sidebar: {
      '/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Introduction', link: '/' },
            { text: 'Quick Start', link: '/getting-started' },
          ],
        },
        {
          text: 'Architecture',
          items: [
            { text: 'System Design', link: '/architecture' },
            { text: 'Bitonic Sort', link: '/algorithm-bitonic' },
            { text: 'Radix Sort', link: '/algorithm-radix' },
          ],
        },
        {
          text: 'Reference',
          items: [
            { text: 'API Documentation', link: '/api' },
            { text: 'Performance Benchmarks', link: '/performance' },
          ],
        },
      ],
    },

    // Social links
    socialLinks: [{ icon: 'github', link: 'https://github.com/AICL-Lab/webgpu-sorting' }],

    // Built-in local search
    search: {
      provider: 'local',
      options: {
        detailedView: true,
        miniSearch: {
          searchOptions: {
            fuzzy: 0.2,
            prefix: true,
            boost: { title: 4, text: 2, titles: 1 },
          },
        },
      },
    },

    // Edit link for contributions
    editLink: {
      pattern: 'https://github.com/AICL-Lab/webgpu-sorting/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },

    // Footer
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024-present lessup',
    },

    // Outline for long technical docs
    outline: {
      level: [2, 4],
      label: 'On this page',
    },
  },

  // Vite configuration
  vite: {
    plugins: [llmstxt()],
    build: {
      minify: 'esbuild',
      target: 'esnext',
    },
  },
});
