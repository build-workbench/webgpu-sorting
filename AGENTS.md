<!-- From: /home/shane/dev/webgpu-sorting/AGENTS.md -->

# AI Agent Instructions: WebGPU Sorting

## Project Overview

WebGPU Sorting is a high-performance GPU-accelerated sorting library using WebGPU compute shaders. It implements two parallel sorting algorithms—**Bitonic Sort** and **Radix Sort**—to achieve sorting performance tens of times faster than JavaScript's native `Array.sort()`.

> 本项目是一个基于 WebGPU 计算着色器的高性能 GPU 排序库，实现了双调排序（Bitonic Sort）和基数排序（Radix Sort）两种并行排序算法。

### Technology Stack

| Category        | Technology                     |
| --------------- | ------------------------------ |
| Language        | TypeScript 5.3+                |
| GPU API         | WebGPU                         |
| Shader Language | WGSL (WebGPU Shading Language) |
| Build Tool      | Vite 5.0+                      |
| Test Framework  | Vitest 1.2+                    |
| Package Manager | npm                            |
| Node.js Version | 18.x or 20.x (see `.nvmrc`)    |

### Browser Compatibility

- Chrome 113+ / Edge 113+ (Fully supported)
- Firefox Nightly (Requires `dom.webgpu.enabled` flag)
- Safari 18+ (Requires macOS 14+)

---

## Directory Structure

```
├── src/                    # Source code
│   ├── core/              # Core WebGPU infrastructure
│   │   ├── GPUContext.ts      # WebGPU initialization & lifecycle
│   │   ├── BufferManager.ts   # GPU buffer management
│   │   ├── Validator.ts       # Sorting result validation
│   │   └── errors.ts          # Custom error classes
│   ├── sorting/           # Sorting algorithm implementations
│   │   ├── BitonicSorter.ts   # Bitonic sort (O(n log²n))
│   │   └── RadixSorter.ts     # Radix sort (O(n × k))
│   ├── shaders/           # WGSL compute shaders
│   │   ├── bitonic.wgsl       # Bitonic sort shader
│   │   └── radix.wgsl         # Radix sort shader
│   ├── benchmark/         # Performance benchmarking
│   │   └── Benchmark.ts       # Benchmark utility
│   ├── shared/            # Shared utilities
│   │   ├── types.ts           # TypeScript type definitions
│   │   └── constants.ts       # Constants (workgroup size, radix, etc.)
│   ├── index.ts           # Public API exports
│   └── main.ts            # Demo UI application
├── test/                  # Test suite
│   ├── core/              # Core module tests
│   ├── sorting/           # Sorting algorithm tests
│   └── benchmark/         # Benchmark tests
├── openspec/              # OpenSpec spec-driven development
│   ├── specs/             # Source of truth specifications
│   │   ├── sorting/       # Sorting algorithm specs
│   │   ├── infrastructure/# WebGPU infrastructure specs
│   │   ├── quality/       # Quality and tooling specs
│   │   └── _archived/     # Historical design documents
│   ├── changes/           # Active change proposals
│   ├── archive/           # Completed changes
│   ├── config.yaml        # OpenSpec configuration
│   └── .templates/        # Spec and proposal templates
├── docs/                  # Documentation
│   ├── setup/             # Getting started guides
│   ├── tutorials/         # API reference
│   └── architecture/      # Technical deep-dives
├── examples/              # Usage examples
├── .github/workflows/     # CI/CD workflows
└── dist/                  # Build output (generated)
```

---

## Build and Development Commands

### Essential Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Build with bundle analysis
npm run build:analyze

# Preview production build
npm run preview
```

### Testing Commands

```bash
# Run all tests once
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Code Quality Commands

```bash
# Lint TypeScript files
npm run lint

# Lint and fix issues
npm run lint:fix

# Format all files
npm run format

# Check formatting without fixing
npm run format:check

# Type check without emitting
npm run typecheck
```

### Documentation Commands

```bash
# Generate TypeDoc API documentation
npm run docs:generate

# Serve generated docs locally
npm run docs:serve
```

---

## OpenSpec Workflow

This project uses **OpenSpec** for spec-driven development. All specifications in `openspec/specs/` serve as the Single Source of Truth for implementations.

> 本项目使用 **OpenSpec** 进行规范驱动开发。`openspec/specs/` 中的所有规范文档作为实现的唯一事实来源。

### OpenSpec Core Workflow

```
/opsx:propose → /opsx:apply → /opsx:archive
```

When developing features, fixing bugs, or making changes, **follow this workflow**:

#### Step 1: Propose | 提案

Before making any code changes, create a change proposal:

```
/opsx:propose "Add merge sort algorithm"
```

This creates a change folder with:

- `proposal.md` - Intent, scope, and approach
- `specs/` - Delta specs describing ADDED/MODIFIED/REMOVED requirements
- `tasks.md` - Implementation checklist

#### Step 2: Apply | 实施

Once the proposal is approved, implement the changes:

```
/opsx:apply
```

This executes the tasks from the checklist in order, writing code and marking tasks complete.

#### Step 3: Archive | 归档

After implementation and testing, archive the change:

```
/opsx:archive
```

This merges delta specs into the main specs and moves the change to the archive.

### OpenSpec Commands

| Command                | Purpose                             | 说明               |
| ---------------------- | ----------------------------------- | ------------------ |
| `/opsx:propose "idea"` | Create a new change proposal        | 创建新的变更提案   |
| `/opsx:apply`          | Implement tasks from current change | 实施当前变更的任务 |
| `/opsx:archive`        | Complete and archive the change     | 归档已完成的变更   |
| `/opsx:explore`        | Explore codebase before proposing   | 提案前探索代码库   |

### Spec Locations

| Directory                        | Purpose                          | 说明                |
| -------------------------------- | -------------------------------- | ------------------- |
| `openspec/specs/sorting/`        | Sorting algorithm specifications | 排序算法规范        |
| `openspec/specs/infrastructure/` | WebGPU infrastructure specs      | WebGPU 基础设施规范 |
| `openspec/specs/quality/`        | Quality and tooling specs        | 质量与工具规范      |
| `openspec/specs/_archived/`      | Historical design documents      | 历史设计文档        |
| `openspec/changes/`              | Active change proposals          | 活跃的变更提案      |
| `openspec/archive/`              | Completed changes                | 已完成的变更        |

### Current Specs

| Spec                                                                    | Domain     | Description                                    |
| ----------------------------------------------------------------------- | ---------- | ---------------------------------------------- |
| [WebGPU Sorting](./openspec/specs/sorting/webgpu-sorting.md)            | sorting    | Feature requirements and acceptance criteria   |
| [Project Enhancement](./openspec/specs/quality/project-enhancement.md)  | quality    | CI/CD, code quality, project metadata          |
| [Core Architecture](./openspec/specs/_archived/core-architecture-v1.md) | \_archived | Technical design, data flow, algorithm details |

### Writing Specs

Follow the existing format with Requirements and Acceptance Criteria:

```markdown
### Requirement N: [Feature Name]

**User Story:** As a [role], I want [feature] so that [benefit].

#### Acceptance Criteria

1. WHEN [condition], THE [component] SHALL [behavior]
2. IF [error condition], THEN THE [component] SHALL [error handling]
```

### Delta Specs

When proposing changes, use markers to indicate modifications:

```markdown
<!-- ADDED -->

### New Requirement

...

<!-- MODIFIED -->

### Existing Requirement

~ Old text to be removed

- New text to be added

<!-- REMOVED -->

### ~~Deprecated Requirement~~

...
```

---

## Architecture Overview

### Layer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Demo UI Layer                          │
│  (src/main.ts - Interactive benchmark interface)            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Public API Layer                         │
│  ┌───────────────┐ ┌───────────────┐ ┌─────────────────┐   │
│  │ BitonicSorter │ │  RadixSorter  │ │    Benchmark    │   │
│  └───────────────┘ └───────────────┘ └─────────────────┘   │
│  (src/sorting/, src/benchmark/)                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   WebGPU Core Layer                         │
│  ┌───────────────┐ ┌───────────────┐ ┌─────────────────┐   │
│  │   GPUContext  │ │ BufferManager │ │    Validator    │   │
│  └───────────────┘ └───────────────┘ └─────────────────┘   │
│  (src/core/)                                                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    WGSL Compute Shaders                     │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │  bitonic.wgsl   │  │   radix.wgsl    │                  │
│  └─────────────────┘  └─────────────────┘                  │
│  (src/shaders/)                                             │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
Input Array (CPU)
       │
       ▼
┌──────────────────┐
│ Upload to GPU    │ ← writeBuffer()
│ (Storage Buffer) │
└──────────────────┘
       │
       ▼
┌──────────────────┐
│ GPU Sorting      │ ← Compute Shader Dispatches
│ (Multiple Passes)│
└──────────────────┘
       │
       ▼
┌──────────────────┐
│ Download to CPU  │ ← mapAsync() + copyBufferToBuffer()
│ (Staging Buffer) │
└──────────────────┘
       │
       ▼
Sorted Array (CPU)
```

---

## Code Style Guidelines

### TypeScript/JavaScript

- **Indentation**: 2 spaces (see `.editorconfig`)
- **Quotes**: Single quotes
- **Semicolons**: Required
- **Line endings**: LF (Unix)
- **Max line length**: 100 characters
- **Trailing commas**: ES5 compatible (required)

### ESLint Rules (Key)

```javascript
// From .eslintrc.cjs
{
  '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  '@typescript-eslint/explicit-function-return-type': 'off',
  '@typescript-eslint/no-explicit-any': 'warn',
  '@typescript-eslint/no-non-null-assertion': 'warn',
  'no-console': ['warn', { allow: ['warn', 'error'] }],
  'prefer-const': 'error',
  'no-var': 'error',
}
```

### File Naming Conventions

- TypeScript source files: `PascalCase.ts` for classes (e.g., `GPUContext.ts`)
- Test files: `*.test.ts` (e.g., `GPUContext.test.ts`)
- Shader files: `*.wgsl` (lowercase, e.g., `bitonic.wgsl`)

### WGSL Shader Conventions

- Use snake_case for variable/function names
- Include sync comments with TypeScript constants:

```wgsl
// IMPORTANT: WORKGROUP_SIZE must match src/shared/constants.ts
// @see src/shared/constants.ts - WORKGROUP_SIZE = 256
const WORKGROUP_SIZE: u32 = 256u;
```

---

## Testing Strategy

### Test Framework: Vitest

- **Environment**: Node.js (browser APIs mocked where needed)
- **Globals**: Enabled (`expect`, `describe`, `it`, etc.)
- **Timeout**: 30 seconds per test (GPU operations can be slow)
- **Coverage**: v8 provider with thresholds configured

### Test Structure

```
test/
├── core/              # Core module unit tests
│   ├── GPUContext.test.ts
│   ├── BufferManager.test.ts
│   ├── Validator.test.ts
│   └── errors.test.ts
├── sorting/           # Sorting algorithm tests
│   ├── BitonicSorter.test.ts
│   └── RadixSorter.test.ts
└── benchmark/         # Benchmark tests
    └── Benchmark.test.ts
```

### Coverage Thresholds

```typescript
// From vitest.config.ts
thresholds: {
  lines: 25,
  functions: 30,
  branches: 20,
  statements: 25,
}
```

### Property-Based Testing

Uses `fast-check` for generative testing. Property tests validate:

1. Buffer round-trip consistency
2. Buffer size alignment
3. Bitonic padding to power of 2
4. Sort correctness for both algorithms
5. Speedup calculation correctness
6. Average time calculation
7. Validator correctness

**Annotation Format for Property Tests**:

```typescript
// Feature: webgpu-sorting, Property 4: Bitonic Sort Correctness
// Validates: Requirements 3.5
```

---

## Git Workflow & CI/CD

### Git Hooks (Husky)

Pre-commit hook runs `lint-staged`:

- ESLint --fix on staged `*.ts,*.tsx` files
- Prettier --write on staged files

### CI/CD Pipelines (.github/workflows/)

| Workflow        | Trigger            | Purpose                             |
| --------------- | ------------------ | ----------------------------------- |
| `ci.yml`        | PR, Push to master | Lint, test (Node 18.x, 20.x), build |
| `pr-checks.yml` | PR                 | Additional PR validation            |
| `docs.yml`      | Push to master     | Documentation generation            |
| `pages.yml`     | Push to master     | Deploy demo to GitHub Pages         |
| `release.yml`   | Tag push           | Release automation                  |
| `codeql.yml`    | Scheduled          | Security analysis                   |

### CI Pipeline Order

```
Lint & Format Check → Test (Node 18.x, 20.x) → Build
         │                              │
         └──── All must pass ───────────┘
```

---

## Constants and Configuration

### Shared Constants (src/shared/constants.ts)

| Constant                  | Value                          | Description                         |
| ------------------------- | ------------------------------ | ----------------------------------- |
| `WORKGROUP_SIZE`          | 256                            | Compute shader workgroup size       |
| `BITS_PER_PASS`           | 4                              | Bits processed per radix pass       |
| `RADIX`                   | 16                             | Number of buckets (2^BITS_PER_PASS) |
| `NUM_PASSES`              | 8                              | Passes for 32-bit integers          |
| `DEFAULT_BENCHMARK_SIZES` | [1024, 10240, 102400, 1048576] | Default test sizes                  |
| `MAX_VALIDATION_SIZE`     | 10000                          | Max size for validation             |

> ⚠️ **CRITICAL**: These constants must stay in sync with WGSL shader values:
>
> - `src/shaders/bitonic.wgsl`: `WORKGROUP_SIZE = 256u`
> - `src/shaders/radix.wgsl`: `WORKGROUP_SIZE = 256u`, `RADIX = 16u`

---

## Error Handling

### Custom Error Classes (src/core/errors.ts)

| Error                     | Description                     |
| ------------------------- | ------------------------------- |
| `WebGPUNotSupportedError` | Browser doesn't support WebGPU  |
| `GPUAdapterError`         | Failed to get GPU adapter       |
| `GPUDeviceError`          | Failed to get GPU device        |
| `BufferAllocationError`   | GPU buffer allocation failed    |
| `BufferMapError`          | Buffer mapping operation failed |
| `ShaderCompilationError`  | WGSL shader compilation failed  |
| `GPUTimeoutError`         | GPU operation timed out         |

---

## Security Considerations

### Browser Security Headers

Vite dev server configured with COOP/COEP headers for WebGPU:

```typescript
// vite.config.ts
server: {
  headers: {
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Embedder-Policy': 'require-corp',
  },
}
```

### Security Reporting

See `SECURITY.md` for vulnerability reporting procedures.

---

## Documentation

### User Documentation (docs/)

| Document                                              | Language | Description                 |
| ----------------------------------------------------- | -------- | --------------------------- |
| [Getting Started](./docs/setup/GETTING_STARTED.md)    | EN       | Installation, quick start   |
| [入门指南](./docs/setup/GETTING_STARTED.zh.md)        | 中文     | 安装与快速开始              |
| [API Reference](./docs/tutorials/API.md)              | EN       | Complete API documentation  |
| [API 参考](./docs/tutorials/API.zh.md)                | 中文     | 完整 API 文档               |
| [Technical Details](./docs/architecture/TECHNICAL.md) | EN       | Architecture and algorithms |
| [技术文档](./docs/architecture/TECHNICAL.zh.md)       | 中文     | 架构与算法细节              |

### API Documentation Generation

Generated via TypeDoc from JSDoc comments in source code:

```bash
npm run docs:generate  # Output: docs/api/
```

---

## Common Development Tasks

### Adding a New Sorting Algorithm

1. Create spec update in `/specs/product/` and `/specs/rfc/`
2. Create WGSL shader in `src/shaders/{algorithm}.wgsl`
3. Implement sorter class in `src/sorting/{Algorithm}Sorter.ts`
4. Add tests in `test/sorting/{Algorithm}Sorter.test.ts`
5. Export from `src/index.ts`
6. Update API documentation

### Modifying Shader Constants

1. Update value in `src/shared/constants.ts`
2. Update corresponding value in WGSL shader file
3. Add/update cross-reference comments in both files
4. Run tests to verify synchronization

### Running Benchmarks Locally

```bash
npm run dev
# Open browser to http://localhost:5173
# Use the interactive UI to run benchmarks
```

---

## Standard Open Source Files

| File                               | Purpose                               | 说明                 |
| ---------------------------------- | ------------------------------------- | -------------------- |
| `README.md`                        | Project entry point (English)         | 项目入口（英文）     |
| `README.zh.md`                     | Chinese version of README             | 中文版 README        |
| `CONTRIBUTING.md`                  | Contribution guidelines               | 贡献指南             |
| `CHANGELOG.md`                     | Version history and release notes     | 版本历史与发行说明   |
| `LICENSE`                          | Open source license                   | 开源协议             |
| `SECURITY.md`                      | Security policy                       | 安全策略             |
| `CODE_OF_CONDUCT.md`               | Community behavior guidelines         | 社区行为准则         |
| `.editorconfig`                    | Cross-editor code style configuration | 跨编辑器代码风格配置 |
| `.nvmrc`                           | Node.js version specification         | Node.js 版本指定     |
| `.github/ISSUE_TEMPLATE/`          | Issue templates                       | Issue 模板           |
| `.github/PULL_REQUEST_TEMPLATE.md` | Pull request template                 | PR 模板              |

---

## Code Generation Rules

- Any external API changes **MUST** be proposed via `/opsx:propose` and documented in the corresponding spec.
  - 任何对外部暴露的 API 变更，必须通过 `/opsx:propose` 提案并在相应规范中记录。
- If uncertain about technical details, refer to the architectural conventions in `openspec/specs/_archived/`. **Do NOT invent design patterns on your own**.
  - 如果遇到不确定的技术细节，请查阅 `openspec/specs/_archived/` 下的架构约定，不要自行捏造设计模式。
- All documentation should be in English by default. Chinese translations should be linked or placed in corresponding `.zh.md` files.
  - 所有文档默认使用英文。中文翻译应链接到对应的 `.zh.md` 文件。
- README.md is in English with a link to README.zh.md at the top.
  - README.md 使用英文，并在开头链接到中文版 README.zh.md。

---

**Last Updated**: 2026-04-23
