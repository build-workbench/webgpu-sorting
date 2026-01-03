# 贡献指南

感谢你对 WebGPU Sorting 项目的关注！我们欢迎各种形式的贡献。

## 目录

1. [行为准则](#行为准则)
2. [如何贡献](#如何贡献)
3. [开发环境设置](#开发环境设置)
4. [代码规范](#代码规范)
5. [提交规范](#提交规范)
6. [测试要求](#测试要求)
7. [Pull Request 流程](#pull-request-流程)

---

## 行为准则

本项目遵循开源社区的基本准则：

- 尊重所有贡献者
- 接受建设性批评
- 关注对项目最有利的事情
- 对社区成员表现出同理心

---

## 如何贡献

### 报告 Bug

如果你发现了 bug，请创建一个 Issue 并包含：

1. **清晰的标题**: 简洁描述问题
2. **复现步骤**: 详细的步骤说明
3. **预期行为**: 你期望发生什么
4. **实际行为**: 实际发生了什么
5. **环境信息**:
   - 浏览器版本
   - 操作系统
   - GPU 型号
   - Node.js 版本

**示例:**

```markdown
## Bug: 双调排序在大数组上失败

### 复现步骤
1. 创建 1M 元素的数组
2. 调用 bitonicSorter.sort(data)
3. 观察错误

### 预期行为
排序成功完成

### 实际行为
抛出 "Out of memory" 错误

### 环境
- Chrome 113.0.5672.126
- Windows 11
- NVIDIA RTX 3060
- Node.js 18.16.0
```

### 提出新功能

如果你有新功能的想法，请先创建一个 Issue 讨论：

1. **功能描述**: 详细说明功能
2. **使用场景**: 为什么需要这个功能
3. **实现建议**: 如何实现（可选）
4. **替代方案**: 其他可能的解决方案

### 改进文档

文档改进总是受欢迎的：

- 修正拼写错误
- 改进示例代码
- 添加更多使用场景
- 翻译文档

---

## 开发环境设置

### 1. Fork 和克隆

```bash
# Fork 项目到你的 GitHub 账号
# 然后克隆你的 fork

git clone https://github.com/YOUR_USERNAME/webgpu-sorting.git
cd webgpu-sorting
```

### 2. 安装依赖

```bash
npm install
```

### 3. 创建分支

```bash
git checkout -b feature/your-feature-name
# 或
git checkout -b fix/your-bug-fix
```

### 4. 开发

```bash
# 启动开发服务器
npm run dev

# 运行测试（监听模式）
npm run test:watch

# 类型检查
npm run lint
```

---

## 代码规范

### TypeScript 风格

```typescript
// ✅ 好: 使用明确的类型
function sort(data: Uint32Array): Promise<SortResult> {
  // ...
}

// ❌ 差: 使用 any
function sort(data: any): Promise<any> {
  // ...
}

// ✅ 好: 使用接口定义复杂类型
interface SortResult {
  sortedData: Uint32Array;
  gpuTimeMs: number;
  totalTimeMs: number;
}

// ✅ 好: 使用 async/await
async function initialize(): Promise<void> {
  await this.requestAdapter();
  await this.requestDevice();
}

// ❌ 差: 使用 Promise 链
function initialize(): Promise<void> {
  return this.requestAdapter()
    .then(() => this.requestDevice());
}
```

### WGSL 风格

```wgsl
// ✅ 好: 使用有意义的变量名
fn compare_and_swap(index_a: u32, index_b: u32, ascending: bool) {
  let value_a = data[index_a];
  let value_b = data[index_b];
  // ...
}

// ❌ 差: 使用单字母变量名
fn compare_and_swap(i: u32, j: u32, a: bool) {
  let x = data[i];
  let y = data[j];
  // ...
}

// ✅ 好: 添加注释说明同步点
workgroupBarrier();  // 同步: 确保所有线程完成数据加载

// ✅ 好: 使用常量
const WORKGROUP_SIZE: u32 = 256u;
const RADIX: u32 = 16u;
```

### 命名约定

```typescript
// 类名: PascalCase
class BitonicSorter { }
class GPUContext { }

// 方法和变量: camelCase
async sort(data: Uint32Array) { }
const gpuTimeMs = 10.5;

// 常量: UPPER_SNAKE_CASE
const WORKGROUP_SIZE = 256;
const MAX_BUFFER_SIZE = 1024 * 1024;

// 私有成员: 前缀 _
private _device: GPUDevice;
private _pipeline: GPUComputePipeline;

// 接口: PascalCase
interface SortResult { }
interface ValidationResult { }
```

### 注释规范

```typescript
/**
 * 对 Uint32Array 进行双调排序
 * 
 * @param data - 要排序的数组
 * @returns 排序结果，包含排序后的数组和性能指标
 * @throws {Error} 如果数组为空或设备未初始化
 * 
 * @example
 * ```typescript
 * const sorter = new BitonicSorter(context);
 * const result = await sorter.sort(new Uint32Array([5, 2, 8, 1]));
 * console.log(result.sortedData); // [1, 2, 5, 8]
 * ```
 */
async sort(data: Uint32Array): Promise<SortResult> {
  // 实现...
}
```

---

## 提交规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 格式：

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type 类型

- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式（不影响功能）
- `refactor`: 重构（不是新功能也不是 bug 修复）
- `perf`: 性能优化
- `test`: 添加或修改测试
- `chore`: 构建过程或辅助工具的变动

### 示例

```bash
# 新功能
git commit -m "feat(radix): add 8-bit radix sort variant"

# Bug 修复
git commit -m "fix(bitonic): correct padding calculation for odd sizes"

# 文档
git commit -m "docs(api): add examples for Benchmark class"

# 性能优化
git commit -m "perf(radix): optimize histogram computation with shared memory"

# 测试
git commit -m "test(validator): add property tests for edge cases"
```

---

## 测试要求

### 运行测试

```bash
# 运行所有测试
npm test

# 监听模式
npm run test:watch

# 覆盖率报告
npm run test:coverage
```

### 测试类型

#### 1. 单元测试

测试单个函数或方法：

```typescript
import { describe, it, expect } from 'vitest';
import { BufferManager } from '../src/core/BufferManager';

describe('BufferManager', () => {
  it('should align size correctly', () => {
    expect(BufferManager.alignSize(100, 256)).toBe(256);
    expect(BufferManager.alignSize(256, 256)).toBe(256);
    expect(BufferManager.alignSize(257, 256)).toBe(512);
  });
});
```

#### 2. 属性测试

使用 fast-check 测试通用属性：

```typescript
import { describe, it } from 'vitest';
import fc from 'fast-check';
import { Validator } from '../src/core/Validator';

describe('Validator Properties', () => {
  it('sorted array should pass isSorted check', () => {
    fc.assert(
      fc.property(
        fc.array(fc.nat(1000000), { minLength: 0, maxLength: 1000 }),
        (arr) => {
          const sorted = new Uint32Array(arr.sort((a, b) => a - b));
          expect(Validator.isSorted(sorted)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### 测试覆盖率要求

- 核心功能: 90%+
- 工具函数: 100%
- 错误处理: 80%+

---

## Pull Request 流程

### 1. 准备工作

```bash
# 确保所有测试通过
npm test

# 确保类型检查通过
npm run lint

# 确保构建成功
npm run build
```

### 2. 创建 Pull Request

1. 推送你的分支到 GitHub
2. 在 GitHub 上创建 Pull Request
3. 填写 PR 模板

**PR 标题格式:**
```
<type>: <description>
```

**PR 描述模板:**
```markdown
## 变更类型
- [ ] Bug 修复
- [ ] 新功能
- [ ] 性能优化
- [ ] 文档更新
- [ ] 代码重构

## 变更说明
简要描述你的变更...

## 相关 Issue
Closes #123

## 测试
- [ ] 添加了新测试
- [ ] 所有测试通过
- [ ] 手动测试通过

## 检查清单
- [ ] 代码遵循项目规范
- [ ] 添加了必要的注释
- [ ] 更新了相关文档
- [ ] 没有引入新的警告
```

### 3. Code Review

- 响应审查意见
- 进行必要的修改
- 保持讨论专业和建设性

### 4. 合并

PR 将在以下条件满足后合并：

- 至少一个维护者批准
- 所有测试通过
- 没有合并冲突
- 遵循代码规范

---

## 开发技巧

### 调试 WebGPU

```typescript
// 启用错误作用域
device.pushErrorScope('validation');
// ... GPU 操作 ...
const error = await device.popErrorScope();
if (error) console.error('GPU Error:', error.message);

// 添加标签便于调试
const buffer = device.createBuffer({
  label: 'debug-my-buffer',
  size: 1024,
  usage: GPUBufferUsage.STORAGE,
});
```

### 性能分析

```typescript
// 使用 performance API
const start = performance.now();
await sorter.sort(data);
const duration = performance.now() - start;
console.log('Duration:', duration, 'ms');

// 使用 Chrome DevTools
// 1. 打开 Performance 面板
// 2. 录制排序操作
// 3. 分析 GPU 时间
```

### 测试 WGSL 着色器

```typescript
// 检查编译信息
const shaderModule = device.createShaderModule({
  code: wgslCode,
});

const compilationInfo = await shaderModule.getCompilationInfo();
for (const message of compilationInfo.messages) {
  console.log(`${message.type}: ${message.message}`);
}
```

---

## 获取帮助

如果你有任何问题：

1. 查看 [文档](./docs/)
2. 搜索 [已有 Issues](https://github.com/your-repo/issues)
3. 创建新 Issue 提问
4. 加入讨论区

---

## 许可证

通过贡献代码，你同意你的贡献将在 MIT 许可证下发布。

---

## 致谢

感谢所有贡献者的付出！你的贡献让这个项目变得更好。

