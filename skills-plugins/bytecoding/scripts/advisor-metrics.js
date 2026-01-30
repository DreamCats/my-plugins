#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

/**
 * MCP Tool Advisor Metrics 统计脚本
 *
 * 用法:
 *   node advisor-metrics.js [--days N] [--clear]
 *
 * 选项:
 *   --days N   只统计最近 N 天的数据（默认 7）
 *   --clear    清空 metrics 文件
 */

const METRICS_FILE = '/tmp/bytecoding-advisor-metrics.jsonl';

// ============================================================================
// 数据加载
// ============================================================================

/**
 * 加载 metrics 数据
 * @param {number} daysLimit - 只加载最近 N 天的数据
 * @returns {Array} 记录数组
 */
function loadMetrics(daysLimit) {
  if (!fs.existsSync(METRICS_FILE)) {
    return [];
  }

  const cutoff = Date.now() - daysLimit * 24 * 60 * 60 * 1000;
  const records = [];

  try {
    const content = fs.readFileSync(METRICS_FILE, 'utf-8');
    const lines = content.trim().split('\n').filter(Boolean);

    for (const line of lines) {
      try {
        const record = JSON.parse(line);
        if (record.ts >= cutoff) {
          records.push(record);
        }
      } catch {
        // 跳过无效行
      }
    }
  } catch {
    return [];
  }

  return records;
}

// ============================================================================
// 统计计算
// ============================================================================

/**
 * 计算采纳率
 * @param {Array} records - 记录数组
 * @returns {Object} 统计结果
 */
function calculateStats(records) {
  const suggestions = records.filter((r) => r.type === 'suggest');
  const actuals = records.filter((r) => r.type === 'actual');

  // 按 session 分组
  const sessionSuggestions = new Map();
  const sessionActuals = new Map();

  for (const s of suggestions) {
    if (!sessionSuggestions.has(s.session)) {
      sessionSuggestions.set(s.session, []);
    }
    sessionSuggestions.get(s.session).push(s);
  }

  for (const a of actuals) {
    if (!sessionActuals.has(a.session)) {
      sessionActuals.set(a.session, []);
    }
    sessionActuals.get(a.session).push(a);
  }

  // 计算采纳情况
  const ruleStats = new Map();
  let totalSuggestions = 0;
  let totalAdopted = 0;

  for (const [session, sessionSugs] of sessionSuggestions) {
    const sessionActs = sessionActuals.get(session) || [];

    for (const sug of sessionSugs) {
      totalSuggestions++;

      // 初始化规则统计
      if (!ruleStats.has(sug.rule)) {
        ruleStats.set(sug.rule, { suggested: 0, adopted: 0 });
      }
      const stat = ruleStats.get(sug.rule);
      stat.suggested++;

      // 检查建议后是否使用了推荐的工具
      // 在建议时间之后的第一个工具调用
      const nextActual = sessionActs.find((a) => a.ts > sug.ts);
      if (nextActual && nextActual.tool === sug.tool) {
        totalAdopted++;
        stat.adopted++;
      }
    }
  }

  // 工具使用分布
  const toolUsage = new Map();
  for (const a of actuals) {
    toolUsage.set(a.tool, (toolUsage.get(a.tool) || 0) + 1);
  }

  return {
    totalSuggestions,
    totalAdopted,
    ruleStats,
    toolUsage,
  };
}

// ============================================================================
// 输出格式化
// ============================================================================

/**
 * 格式化输出
 * @param {Object} stats - 统计结果
 * @param {number} days - 统计天数
 */
function printStats(stats, days) {
  const { totalSuggestions, totalAdopted, ruleStats, toolUsage } = stats;

  console.log('\n=== MCP Tool Advisor 效果统计 ===');
  console.log(`统计周期: 最近 ${days} 天\n`);

  if (totalSuggestions === 0) {
    console.log('暂无数据\n');
    return;
  }

  const adoptionRate = ((totalAdopted / totalSuggestions) * 100).toFixed(1);
  const ignoredRate = (((totalSuggestions - totalAdopted) / totalSuggestions) * 100).toFixed(1);

  console.log(`总建议次数: ${totalSuggestions}`);
  console.log(`建议后使用推荐工具: ${totalAdopted} (${adoptionRate}%)`);
  console.log(`建议后使用其他工具: ${totalSuggestions - totalAdopted} (${ignoredRate}%)`);

  // 按规则统计
  console.log('\n按规则统计:');
  console.log('┌────────────────────────┬────────┬────────┬─────────┐');
  console.log('│ 规则                   │ 建议数 │ 采纳数 │ 采纳率  │');
  console.log('├────────────────────────┼────────┼────────┼─────────┤');

  const sortedRules = [...ruleStats.entries()].sort((a, b) => b[1].suggested - a[1].suggested);

  for (const [rule, stat] of sortedRules) {
    const rate = stat.suggested > 0 ? ((stat.adopted / stat.suggested) * 100).toFixed(1) : '0.0';
    const ruleName = rule.padEnd(22).slice(0, 22);
    const suggested = String(stat.suggested).padStart(6);
    const adopted = String(stat.adopted).padStart(6);
    const rateStr = (rate + '%').padStart(7);
    console.log(`│ ${ruleName} │${suggested} │${adopted} │${rateStr} │`);
  }

  console.log('└────────────────────────┴────────┴────────┴─────────┘');

  // 工具使用分布
  console.log('\n实际工具使用分布:');
  const sortedTools = [...toolUsage.entries()].sort((a, b) => b[1] - a[1]);
  for (const [tool, count] of sortedTools.slice(0, 10)) {
    console.log(`  - ${tool}: ${count}`);
  }

  console.log('');
}

// ============================================================================
// CLI 入口
// ============================================================================

function main() {
  const args = process.argv.slice(2);

  // 解析参数
  let days = 7;
  let shouldClear = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--days' && args[i + 1]) {
      days = parseInt(args[i + 1], 10) || 7;
      i++;
    } else if (args[i] === '--clear') {
      shouldClear = true;
    } else if (args[i] === '--help' || args[i] === '-h') {
      console.log('用法: node advisor-metrics.js [--days N] [--clear]');
      console.log('');
      console.log('选项:');
      console.log('  --days N   只统计最近 N 天的数据（默认 7）');
      console.log('  --clear    清空 metrics 文件');
      process.exit(0);
    }
  }

  // 清空文件
  if (shouldClear) {
    try {
      fs.unlinkSync(METRICS_FILE);
      console.log('已清空 metrics 文件');
    } catch {
      console.log('metrics 文件不存在或无法删除');
    }
    return;
  }

  // 加载并统计
  const records = loadMetrics(days);
  const stats = calculateStats(records);
  printStats(stats, days);
}

main();
