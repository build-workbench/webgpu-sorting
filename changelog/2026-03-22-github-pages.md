# 2026-03-22 GitHub Pages 优化

## 修改内容
- 新增 `.github/workflows/pages.yml`，在 `main` 分支推送后自动构建并发布到 GitHub Pages。
- 在 `vite.config.ts` 中增加 `VITE_BASE_PATH` 支持，适配 `/<repo-name>/` 子路径部署。

## 验证说明
- 已检查 `index.html` 与源码中不存在明显的根路径资源引用。
- 本地未完成构建验证，当前环境缺少 `tsc`/`vite` 命令；GitHub Actions 会在 `npm ci` 后执行构建。
