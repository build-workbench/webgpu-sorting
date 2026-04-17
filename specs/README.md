# Specifications Directory

This directory contains all specification documents following the **Spec-Driven Development (SDD)** paradigm. These specs serve as the **Single Source of Truth** for all code implementations.

> 本目录包含遵循**规范驱动开发（SDD）**范式的所有规范文档。这些规范作为所有代码实现的**唯一事实来源**。

---

## Directory Structure | 目录结构

```
specs/
├── product/    # Product requirements (PRDs) | 产品需求文档
├── rfc/        # Technical design documents (RFCs) | 技术设计文档
├── api/        # API interface definitions | API 接口定义
├── db/         # Database/model definitions | 数据库/模型定义
└── testing/    # BDD test specifications | BDD 测试规范
```

---

## Current Specifications | 当前规范

### Product Specs | 产品规范

| Spec                                                                                 | Description                       | 说明                        |
| ------------------------------------------------------------------------------------ | --------------------------------- | --------------------------- |
| [0001-webgpu-sorting.md](./product/0001-webgpu-sorting.md)                           | Core sorting feature requirements | 核心排序功能需求            |
| [0002-project-quality-enhancement.md](./product/0002-project-quality-enhancement.md) | CI/CD, code quality, metadata     | CI/CD、代码质量、项目元数据 |

### RFCs | 技术设计

| RFC                                                          | Status   | Description              | 说明         |
| ------------------------------------------------------------ | -------- | ------------------------ | ------------ |
| [0001-core-architecture.md](./rfc/0001-core-architecture.md) | Accepted | Core architecture design | 核心架构设计 |

### API Specs | API 规范

Reserved for future API formalization needs. Current API is defined via TypeScript interfaces.

> 预留用于未来 API 形式化需求。当前 API 通过 TypeScript 接口定义。

### DB Specs | 数据模型规范

Reserved for data model specifications. Current models are TypeScript interfaces.

> 预留用于数据模型规范。当前模型为 TypeScript 接口。

### Testing Specs | 测试规范

Reserved for BDD feature files. Current tests use Vitest with property-based testing.

> 预留用于 BDD 功能文件。当前测试使用 Vitest 和属性测试。

---

## Specification Naming Convention | 规范命名约定

### Product Specs

Format: `NNNN-feature-name.md`

- `NNNN`: Zero-padded number (0001, 0002, ...)
- `feature-name`: Kebab-case feature name

### RFCs

Format: `NNNN-topic-name.md`

- `NNNN`: Zero-padded RFC number
- `topic-name`: Kebab-case topic name

### RFC Status Values

| Status       | Description                           |
| ------------ | ------------------------------------- |
| `Proposed`   | Under discussion                      |
| `Accepted`   | Approved and ready for implementation |
| `Rejected`   | Not approved                          |
| `Deprecated` | No longer relevant                    |
| `Superseded` | Replaced by newer RFC                 |

---

## How to Use | 如何使用

### For AI Agents | 给 AI 代理

1. **Always read specs first** before writing code
2. Follow the workflow in [AGENTS.md](../AGENTS.md)
3. If specs conflict with requirements, update specs first

---

### For Contributors | 给贡献者

1. New features require a product spec
2. Architecture changes require an RFC
3. Update specs before changing code
4. See [CONTRIBUTING.md](../CONTRIBUTING.md) for details

---

## Related Documents | 相关文档

- [AGENTS.md](../AGENTS.md) - AI workflow instructions
- [CONTRIBUTING.md](../CONTRIBUTING.md) - Contribution guidelines
- [docs/](../docs/) - User documentation

---

**Last Updated**: 2026-04-17
