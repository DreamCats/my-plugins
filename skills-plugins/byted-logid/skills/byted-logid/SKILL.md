---
name: byted-logid
description: This skill should be used when the user asks to "解析 logid", "查询字节日志ID", "logid CLI", "查一下这个日志", "看看这个 logid", "这个 logid 有什么问题", or mentions "byted-logid", "字节日志ID", or needs to query ByteDance trace ID logs， log cookie.
---

# 执行流程

当该 Skill 被触发时，Claude 应按照以下步骤执行：

1. **识别用户意图**
   - 判断用户是否需要：
     - 基础日志查询
     - 指定区域查询（cn / i18n / us）
     - 按 PSM 过滤
     - 只想看错误日志

2. **构造命令**
   - 根据用户意图选择合适的参数：
     - `LOGID`（必需）
     - `--region` / `-r`（必需）
     - `--psm` / `-p`（可选）

3. **调用 logid CLI**
   - 使用 Bash 工具执行命令：

   ```bash
   logid query "LOGID" --region <region> [OPTIONS]
   ```

   **注意**：`logid` 是独立的 CLI 工具，需提前安装并配置在 PATH 中。输出默认是 JSON 格式。

4. **解释结果**
   - 如有需要，向用户解释输出字段含义
   - 高亮关键日志信息（如错误、异常）
   - 提供日志调用链的简要分析

# 命令参考

## 命令格式

```bash
logid query [OPTIONS] --region <REGION> <LOGID>
```

## 必需参数

| 参数              | 说明                                      |
| ----------------- | ----------------------------------------- |
| `LOGID`           | 要查询的日志 ID（通常是 UUID 格式）       |
| `--region` / `-r` | 查询区域：`us`、`i18n`、`eu`、`cn`（暂不可用） |

## 可选参数

| 参数    | 短参数 | 说明                              |
| ------- | ------ | --------------------------------- |
| `--psm` | `-p`   | 过滤的 PSM 服务名称（可多次指定） |

**说明**：输出格式默认为 JSON，无需额外指定。

## 区域说明

| 区域   | 状态     | 说明                 | URL                                  |
| ------ | -------- | -------------------- | ------------------------------------ |
| `us`   | 可用     | 美区                 | https://logservice-tx.tiktok-us.org  |
| `i18n` | 可用     | 国际化区域（新加坡） | https://logservice-sg.tiktok-row.org |
| `eu`   | 可用     | 欧洲区               | -                                    |
| `cn`   | 暂不可用 | 中国区               | 需后续配置                           |

## 环境变量配置

在使用前，用户需在 `.env` 文件中配置以下变量：

| 变量               | 区域       | 说明                     |
| ------------------ | ---------- | ------------------------ |
| `CAS_SESSION_US`   | 美区       | CAS 认证凭据（必需）     |
| `CAS_SESSION_I18n` | 国际化区域 | CAS 认证凭据（小写 n）   |
| `CAS_SESSION_EU`   | 欧洲区     | CAS 认证凭据             |
| `CAS_SESSION_CN`   | 中国区     | CAS 认证凭据（暂不可用） |
| `CAS_SESSION`      | 通用       | 回退认证凭据（可选）     |
| `ENABLE_LOGGING`   | 通用       | 启用调试输出（`true`/`false`） |

**配置位置优先级**（按顺序查找）：

1. `<logid可执行文件所在目录>/.env`
2. `~/.config/logid/.env`

> 安装与 Cookie 配置详细指南：参见 [`reference/installation.md`](reference/installation.md)

# 示例

## 示例 1：基础日志查询

用户：

```
帮我查一下这个 logid：550e8400-e29b-41d4-a716-446655440000（美区）
```

Claude（使用该 Skill）：

- 构造带 `--region us` 的命令
- 执行并返回解析结果

```bash
logid query "550e8400-e29b-41d4-a716-446655440000" --region us
```

## 示例 2：按多个 PSM 过滤

用户：

```
只看 user.service 和 auth.service 的日志
```

Claude（使用该 Skill）：

- 添加多个 `--psm` 参数
- 执行并解释过滤后的结果

```bash
logid query "550e8400-e29b-41d4-a716-446655440000" --region i18n \
  --psm "user.service" \
  --psm "auth.service"
```

## 示例 3：只查看错误日志

用户：

```
这个 logid 有没有错误？
```

Claude（使用该 Skill）：

- 使用 `--psm` 过滤相关服务
- 解析 JSON 结果，高亮 ERROR 级别的日志

```bash
logid query "550e8400-e29b-41d4-a716-446655440000" --region us \
  --psm "payment.service"
```

# 返回结果

**说明**：logid 默认输出 JSON 格式，无需额外指定。

```json
{
  "logid": "550e8400-e29b-41d4-a716-446655440000",
  "region": "us",
  "region_display_name": "US Region",
  "total_items": 2,
  "messages": [
    {
      "id": "msg_1",
      "group": {
        "psm": "payment.service",
        "pod_name": "payment-pod-abc",
        "ipv4": "10.0.0.1",
        "env": "production",
        "vregion": "US-TTP",
        "idc": "us-east-1"
      },
      "values": [
        {
          "key": "_msg",
          "value": "Payment processed successfully",
          "type_field": "string"
        }
      ],
      "level": "INFO",
      "location": "src/handler.rs:42"
    }
  ],
  "timestamp": "2024-01-15T10:30:46.000Z"
}
```

**JSON 字段说明**：

- `total_items`：匹配的消息总数
- `messages[].group.psm`：服务名称
- `messages[].group.pod_name`：Pod 名称
- `messages[].group.ipv4`：IP 地址
- `messages[].group.env`：环境（production/staging）
- `messages[].values[].value`：日志消息内容
- `level`：日志级别（INFO/ERROR/WARN/DEBUG）
- `location`：代码位置（文件名:行号）

# 错误处理

| 错误情况            | 处理方式                                      |
| ------------------- | --------------------------------------------- |
| 认证失败（401/403） | 提示用户检查 CAS_SESSION 环境变量是否正确配置 |
| 区域无效            | 提示用户使用正确的区域值：us、i18n、eu、cn    |
| logid 不存在        | 告知用户该 logid 无日志记录，可能已被清理     |
| 超时无响应          | 建议用户稍后重试，或检查网络连接              |
| 无匹配日志          | 提示用户尝试其他 PSM 过滤条件                 |

# 其他命令

## 更新工具

```bash
# 检查是否有更新
logid update --check

# 更新到最新版本
logid update

# 强制更新
logid update --force
```

将 logid 工具更新到最新版本。

## 查看帮助

```bash
logid --help          # 查看主帮助
logid query --help    # 查看 query 子命令帮助
```

# 说明

- 该 Skill 以 logid CLI 工具作为唯一事实来源
- 命令行为变更应优先修改工具本身，而非在此文件中重复说明
- SKILL.md 重点在于"调度指令"，而非工具实现细节
