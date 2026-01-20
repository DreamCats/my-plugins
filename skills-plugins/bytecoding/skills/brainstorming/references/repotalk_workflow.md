# Repotalk MCP 搜索工作流模板

## 推荐流程

```javascript
// 1. 获取仓库详情（概览 + 包列表）
repotalk.get_repos_detail({ repo_names: ["org/repo"] });

// 2. 语义化代码搜索（收敛候选）
repotalk.search_nodes({
  repo_names: ["org/repo"],
  question: "handler 注释规范 最佳实践",
});

// 3. 搜索包详情（聚焦候选包）
repotalk.get_packages_detail({
  repo_name: "org/repo",
  package_ids: ["module?path/to/pkg"],
});

// 4. 获取节点详情（确认实现与依赖）
repotalk.get_nodes_detail({
  repo_name: "org/repo",
  node_ids: ["module?path/to/pkg#FuncName"],
  need_related_codes: true,
});
```

## 完成标志

- 找到 2-3 个参考实现
- 产出候选路径/模块名/函数名
- 识别常用模式和规范
- 记录潜在的安全/性能考虑
