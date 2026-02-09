# 提取模式

分析样例代码，提取以下模式：

## 1. 目录结构

- 文件放在哪个目录？
- 命名规范是什么？（snake_case, camelCase, PascalCase）

## 2. 分层调用

- 项目采用什么分层？（handler → service → repo？）
- 依赖关系怎么写？（wire, fx, 手写注入？）

## 3. 错误处理

- 用什么错误码？（errno, codes, 自定义？）
- 错误怎么包装？（errors.Wrap, errors.Is, fmt.Errorf？）
- 错误码定义在哪里？

## 4. 日志模式

- 用什么日志库？（zap, zerolog, 标准 log？）
- 日志格式？（JSON 结构化？还是 printf 风格？）
- 常用字段？（request_id, user_id, action？）

## 5. 命名风格

- 函数名命名习惯？（GetUser vs GetUserByID）
- 变量名习惯？（u := &User{} 还是 user := &User{}）

## 6. 参数校验

- 用什么校验库？（validator, go-playground/validator？）
- 校验标签风格？（`validate:"required"`？）

## 7. 注释风格

- 函数注释格式？（// FuncName ... ？Doc风格？）
- 行内注释习惯？（中文还是英文？）

## 提取结果

把提取的模式用于方案确认，让用户知道你会怎么写代码。
