import { defineConfig } from 'vitepress';

const base = process.env.GITHUB_PAGES ? '/webgpu-sorting/' : '/';

export default defineConfig({
  base,
  title: 'WebGPU Sorting',
  description: 'WebGPU 排序库、Demo 与参考文档。',

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
    ['meta', { property: 'og:title', content: 'WebGPU Sorting' }],
    [
      'meta',
      {
        property: 'og:description',
        content: '使用 WebGPU 计算着色器实现 GPU 加速排序',
      },
    ],
  ],

  markdown: {
    math: true,
  },

  cleanUrls: true,
  lastUpdated: true,

  themeConfig: {
    logo: '/icons/icon-192.svg',
    siteTitle: 'WebGPU Sorting',

    nav: [
      { text: '主页', link: '/' },
      { text: 'Demo', link: '/demo' },
      { text: '架构', link: '/architecture' },
      { text: 'API', link: '/api' },
      { text: '性能', link: '/performance' },
    ],

    sidebar: {
      '/': [
        {
          text: '入门',
          items: [
            { text: '项目简介', link: '/' },
            { text: '快速开始', link: '/getting-started' },
          ],
        },
        {
          text: '架构',
          items: [
            { text: '系统设计', link: '/architecture' },
            { text: 'Bitonic Sort', link: '/algorithm-bitonic' },
            { text: 'Radix Sort', link: '/algorithm-radix' },
          ],
        },
        {
          text: '参考',
          items: [
            { text: 'API 文档', link: '/api' },
            { text: '性能基准', link: '/performance' },
          ],
        },
      ],
    },

    socialLinks: [{ icon: 'github', link: 'https://github.com/AICL-Lab/webgpu-sorting' }],

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

    editLink: {
      pattern: 'https://github.com/AICL-Lab/webgpu-sorting/edit/main/docs/:path',
      text: '在 GitHub 上编辑本页',
    },

    footer: {
      message: '基于 MIT 协议发布。',
      copyright: 'Copyright © AICL-Lab 贡献者',
    },

    outline: {
      level: [2, 4],
      label: '本页内容',
    },
  },

  vite: {
    build: {
      minify: 'esbuild',
      target: 'esnext',
    },
  },
});
