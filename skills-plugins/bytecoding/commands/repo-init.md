---
name: repo-init
description: 初始化 Bytecoding 目录结构
parameters:
  - name: --check
    description: 仅检查目录状态，不创建
    type: boolean
    required: false
---

初始化 Bytecoding 所需的目录结构，包括用户级全局目录和项目级目录。

**目录结构**：

用户级 (`~/.bytecoding/`)：
- `config.json` - 全局配置
- `cache/` - 缓存目录
- `changes/` - 变更记录
- `archive/` - 已归档计划
- `index/` - 历史索引

项目级 (`.bytecoding/`)：
- `changes/` - 项目级变更记录
- `archive/` - 项目级已归档计划

**选项**：
- `--check` - 仅检查目录状态，不创建

**示例**：
```bash
/repo-init              # 初始化目录
/repo-init --check      # 检查目录状态
```
