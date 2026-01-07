# Design Document

## Overview

本设计文档描述了 WebGPU Sorting 项目质量增强的技术实现方案。通过添加 CI/CD 配置、代码质量工具、Git hooks、完善的项目元数据和标准开源文件，将项目提升到优秀开源项目的标准。

## Architecture

### 项目增强架构

```
webgpu-sorting/
├── .github/                          # GitHub 配置
│   ├── workflows/
│   │   ├── ci.yml                    # CI 工作流
│   │   └── release.yml               # 发布工作流
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md             # Bug 报告模板
│   │   └── feature_request.md        # 功能请求模板
│   └── PULL_REQUEST_TEMPLATE.md      # PR 模板
│
├── .husky/                           # Git hooks
│   └── pre-commit                    # 预提交钩子
│
├── CODE_OF_CONDUCT.md                # 行为准则
├── SECURITY.md                       # 安全策略
├── .editorconfig                     # 编辑器配置
├── .nvmrc                            # Node 版本
├── .eslintrc.cjs                     # ESLint 配置
├── .prettierrc                       # Prettier 配置
├── .prettierignore                   # Prettier 忽略
└── package.json                      # 完善的包配置
```

## Components and Interfaces

### 1. GitHub Actions CI 工作流

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run test:coverage
      - uses: actions/upload-artifact@v4
        with:
          name: coverage-${{ matrix.node-version }}
          path: coverage/
```

### 2. ESLint 配置

```javascript
// .eslintrc.cjs
module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
  },
  ignorePatterns: ['dist/', 'node_modules/', '*.wgsl'],
};
```

### 3. Prettier 配置

```json
// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "bracketSpacing": true
}
```

### 4. Husky + lint-staged 配置

```json
// package.json (部分)
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md,yml,yaml}": ["prettier --write"]
  }
}
```

### 5. 完善的 package.json

```json
{
  "name": "webgpu-sorting",
  "version": "1.0.0",
  "description": "High-performance GPU sorting algorithms using WebGPU compute shaders",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": ["dist", "src/shaders"],
  "repository": {
    "type": "git",
    "url": "git+https://github.com/user/webgpu-sorting.git"
  },
  "bugs": {
    "url": "https://github.com/user/webgpu-sorting/issues"
  },
  "homepage": "https://github.com/user/webgpu-sorting#readme",
  "author": "Your Name <email@example.com>",
  "engines": {
    "node": ">=18.0.0"
  },
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "format": "prettier --write \"**/*.{ts,tsx,json,md,yml,yaml}\"",
    "format:check": "prettier --check \"**/*.{ts,tsx,json,md,yml,yaml}\"",
    "typecheck": "tsc --noEmit",
    "prepare": "husky"
  }
}
```

## Data Models

本增强不涉及数据模型变更，主要是配置文件和工具链的添加。

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: ESLint 配置有效性

*For any* TypeScript 源文件，运行 ESLint 检查应该能够正确解析并报告问题，不应产生配置错误。

**Validates: Requirements 2.1, 2.3**

### Property 2: Prettier 格式化幂等性

*For any* 已格式化的文件，再次运行 Prettier 格式化应该产生相同的输出（幂等性）。

**Validates: Requirements 2.2, 2.4**

### Property 3: CI 工作流完整性

*For any* 有效的代码提交，CI 工作流应该能够成功执行所有步骤（安装、lint、测试、构建）。

**Validates: Requirements 1.1, 1.2, 1.3, 1.4**

### Property 4: Package.json 有效性

*For any* package.json 配置，所有必需字段应该存在且格式正确，npm publish 应该能够成功执行。

**Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7**

## Error Handling

### 配置错误处理

1. **ESLint 配置错误**: 如果 ESLint 配置无效，运行 `npm run lint` 时会显示明确的错误信息
2. **Prettier 配置错误**: 如果 Prettier 配置无效，运行 `npm run format` 时会显示错误
3. **Husky 安装失败**: 如果 Husky 安装失败，`npm install` 后会显示警告，但不会阻止安装
4. **CI 失败**: GitHub Actions 会在 PR 页面显示失败原因和日志链接

### 降级策略

- 如果 Husky 不可用，开发者仍可手动运行 lint 和 format 命令
- 如果 CI 暂时不可用，本地测试仍可正常运行

## Testing Strategy

### 配置验证测试

1. **ESLint 配置测试**: 运行 `npm run lint` 验证配置有效
2. **Prettier 配置测试**: 运行 `npm run format:check` 验证配置有效
3. **TypeScript 配置测试**: 运行 `npm run typecheck` 验证类型检查
4. **CI 工作流测试**: 通过 GitHub Actions 运行验证

### 测试覆盖率

- 使用 Vitest 的 coverage 功能
- 配置 @vitest/coverage-v8 提供覆盖率报告
- 生成 text、lcov、html 格式的报告

