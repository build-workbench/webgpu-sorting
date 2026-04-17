# WebGPU Sorting Documentation Hub

<p align="center">
  <strong>High-Performance GPU Sorting Algorithms Using WebGPU Compute Shaders</strong><br/>
  <strong>基于 WebGPU 计算着色器的高性能 GPU 排序算法</strong>
</p>

---

## Documentation Structure | 文档结构

This project follows the [Spec-Driven Development](../AGENTS.md) paradigm. All implementation details are governed by spec documents in `/specs`.

> 本项目遵循 [Spec-Driven Development](../AGENTS.md) 范式。所有实现细节由 `/specs` 中的规范文档管理。

```
docs/
├── setup/           # Installation & setup guides | 安装与配置指南
├── tutorials/       # API tutorials & examples | API 教程与示例
├── architecture/    # Technical deep-dives | 技术深入分析
└── assets/          # Images & static resources | 图片与静态资源
```

---

## Quick Navigation | 快速导航

### Setup Guides | 安装指南

| Document                                      | Language   | Description                                |
| --------------------------------------------- | ---------- | ------------------------------------------ |
| [Getting Started](./setup/GETTING_STARTED.md) | 🇺🇸 English | Installation, quick start, troubleshooting |
| [入门指南](./setup/GETTING_STARTED.zh.md)     | 🇨🇳 中文    | 安装、快速开始、常见问题                   |

### Tutorials & API References | 教程与 API 参考

| Document                            | Language   | Description                              |
| ----------------------------------- | ---------- | ---------------------------------------- |
| [API Reference](./tutorials/API.md) | 🇺🇸 English | Complete API documentation with examples |
| [API 参考](./tutorials/API.zh.md)   | 🇨🇳 中文    | 完整的 API 文档和示例                    |

### Architecture & Technical Details | 架构与技术细节

| Document                                         | Language   | Description                            |
| ------------------------------------------------ | ---------- | -------------------------------------- |
| [Technical Details](./architecture/TECHNICAL.md) | 🇺🇸 English | Architecture, algorithms, optimization |
| [技术文档](./architecture/TECHNICAL.zh.md)       | 🇨🇳 中文    | 架构、算法和优化                       |

### Changelog | 更新日志

See [CHANGELOG.md](../CHANGELOG.md) for version history.

> 查看 [CHANGELOG.md](../CHANGELOG.md) 了解版本历史。

---

## Specifications | 规范文档

The `/specs` directory contains the authoritative specifications:

| Spec                                                                        | Type    | Description                                  |
| --------------------------------------------------------------------------- | ------- | -------------------------------------------- |
| [WebGPU Sorting](../specs/product/0001-webgpu-sorting.md)                   | Product | Feature requirements and acceptance criteria |
| [Quality Enhancement](../specs/product/0002-project-quality-enhancement.md) | Product | CI/CD, code quality, project metadata        |
| [Core Architecture](../specs/rfc/0001-core-architecture.md)                 | RFC     | Technical design and architecture            |

---

## Documentation Standards | 文档标准

All documentation follows these principles:

- Clear, professional language
- Working code examples
- Comprehensive troubleshooting
- Cross-referenced links
- Consistent formatting
- Bilingual support (English + Chinese)

> 所有文档遵循以下原则：清晰专业的语言、可运行的代码示例、全面的故障排除、交叉引用链接、一致的格式、双语支持（英文+中文）

---

## For Contributors | 给贡献者

Before contributing, please read:

1. [AGENTS.md](../AGENTS.md) - Spec-Driven Development workflow
2. [CONTRIBUTING.md](../CONTRIBUTING.md) - Contribution guidelines
3. [specs/](../specs/) - Project specifications

---

**Last Updated**: 2026-04-17  
**Version**: 1.0.1
