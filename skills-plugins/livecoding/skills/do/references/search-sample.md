# 搜索样例

## 判断任务类型

根据用户需求判断类型：

- RPC/API 接口
- CRUD 操作
- 工具函数
- 配置修改
- Bug 修复
- 其他

## 搜索策略（按优先级）

### 1. 同目录/同模块优先

如果需求涉及 `handler/user.go`，先看 `handler/` 下的其他文件。

### 2. 相似类型优先

- 新增 `GetXxx` 接口 → 找现有的 `GetXxx` 实现
- 新增 `CreateXxx` 接口 → 找现有的 `CreateXxx` 实现
- 修改 `UpdateXxx` → 找现有的 `UpdateXxx` 实现

### 3. 最新代码优先

```bash
# 找最近 3 个月修改过的相关文件
git log --since="3 months ago" --name-only --pretty=format: -- "*.go" | sort | uniq -c | sort -rn
```

### 4. 兜底：全局搜索

使用 MCP 工具搜索关键词：
- Grep 搜索函数名
- Glob 搜索文件类型
- bcindex 语义搜索（如果有）

## 搜索数量

找 **1-2 个最相关的样例**即可，不要贪多。

样例太多反而干扰，1-2 个足矣学习核心模式。
