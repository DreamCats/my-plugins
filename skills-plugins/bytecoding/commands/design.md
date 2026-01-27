---
description: 探索式方案设计
argument-hint: [设计主题]
allowed-tools: Bash(bash*), Bash(node*), Bash(git*), Bash(pwd*), Read, Write, Edit, Glob, Grep
---

# /design 命令

与 LLM 进行探索式问答交流，将想法转化为完整的设计方案。

## 触发 Skill

本命令触发 `brainstorming` skill，开始协作式设计对话。

## 工作流程

```
/design "设计主题"
  │
  ├─ 理解项目上下文（文件、文档、最近提交）
  ├─ 一次一个问题，逐步澄清需求
  ├─ 提出 2-3 种方案，给出推荐
  ├─ 分段呈现设计（每段 200-300 字）
  ├─ 每段确认后继续下一段
  │
  └─► 产出：design.md（沉淀到 docs/plans/）
```

## 使用场景

- 需求不明确，需要梳理思路
- 有多种实现方案，需要讨论权衡
- 技术选型犹豫不决
- 想了解最佳实践

## 核心原则

- **一次一个问题** - 不要多个问题一起问
- **优先选择题** - 比开放式问题更容易回答
- **YAGNI** - 从设计中删除不必要的功能
- **探索替代方案** - 在确定方案前提出 2-3 种选择
- **增量验证** - 分段呈现设计，逐段确认
- **灵活调整** - 随时回溯澄清

## 产出

设计文档写入：`.bytecoding/plans/YYYY-MM-DD-<topic>-design.md`

## 与 /plan 的关系

```
不确定怎么做？
  └─► /bytecoding:design 探索交流 → 产出 design.md
        │
        └─► 想清楚了 → /bytecoding:plan 生成 tasks.md → /bytecoding:apply 执行
```
