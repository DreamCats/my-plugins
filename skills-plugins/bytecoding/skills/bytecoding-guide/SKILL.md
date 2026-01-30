---
name: bytecoding-guide
description: "当用户询问 bytecoding 是什么、怎么用、有哪些命令时触发。介绍插件功能和使用方法。"
---

# Bytecoding 插件使用指南

Bytecoding 是一个简化版 spec-driven 开发工作流插件，帮助你高效地完成代码开发任务。

## 核心理念

**命令式思维，选择权交给用户**：根据需求明确程度选择不同命令。

## 命令一览

| 命令 | 场景 | 说明 |
|------|------|------|
| `/bytecoding:init` | 新项目接入 | 初始化项目配置（目录、gitignore、bcindex） |
| `/bytecoding:brainstorming` | 不确定怎么做 | 探索式问答，将想法转化为设计 |
| `/bytecoding:do` | 需求明确，直接干 | 直接执行改动 |
| `/bytecoding:gcmsg` | 提交代码 | 自动生成 commit message |
| `/bytecoding:code-simplifier` | 优化代码 | 简化和优化最近修改的代码 |
| `/bytecoding:code-reviewer` | 代码审查 | 审查代码质量和潜在问题 |

## 如何选择命令？

```
首次使用？
  └─► /bytecoding:init（初始化项目配置）

你的需求是什么？
  │
  ├─ 不确定怎么实现
  │    └─► /bytecoding:brainstorming
  │         （探索问答 → design.md → 想清楚后 /do）
  │
  └─ 需求明确
       └─► /bytecoding:do
            （直接执行 → review → commit）
```

## 典型工作流

### 场景 1：探索式开发（不确定怎么做）

```
/bytecoding:brainstorming "如何实现用户认证模块"
  ↓ 多轮问答，梳理思路
  ↓ 产出 design.md
/bytecoding:do "实现用户认证模块"
  ↓ 直接执行
/bytecoding:code-reviewer  # 可选：审查代码
/bytecoding:gcmsg          # 提交
```

### 场景 2：明确需求开发

```
/bytecoding:do "在 UserService 添加 GetUserByID 方法"
  ↓ 直接执行
/bytecoding:code-simplifier  # 可选：优化代码
/bytecoding:gcmsg            # 提交
```

## 辅助工具

### MCP 搜索工具

插件集成了多个 MCP 工具帮助代码搜索：

- **Repotalk** - 跨仓库搜索字节内部代码
- **bcindex** - 语义搜索，自然语言定位代码
- **byte-lsp** - 符号定位，查找定义/引用

### 其他 Skills

- **repotalk-refresh-cookie** - Repotalk Cookie 失效时刷新
- **bcindex-usage** - bcindex CLI 使用指南
- **byte-lsp-usage** - byte-lsp MCP 使用指南（符号定位、调用层次）

## 目录结构

```
.bytecoding/
├── plans/             # 设计文档
│   └── YYYY-MM-DD-xxx-design.md
└── imports/           # 飞书文档导入
    ├── YYYY-MM-DD-xxx.md
    └── assets/
```

## Tips

- 经常运行 `bcindex index` 提高代码搜索准确度
- Cookie 失效时会自动提示刷新方法
- 代码完成后可用 `/bytecoding:code-reviewer` 自查
- Repotalk 查询仓库无结果（非 401 错误）？可能是该仓库未被索引，需去 https://repotalk.byted.org/ 手动添加仓库进行索引
