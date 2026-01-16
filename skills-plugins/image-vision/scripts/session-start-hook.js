#!/usr/bin/env node

/**
 * SessionStart hook for Image Vision Plugin
 *
 * 这个 hook 在 Claude Code 会话启动时运行，提供：
 * - 欢迎消息和插件状态
 * - 检查配置文件是否存在
 * - 验证 API Key 和 Model ID 配置
 * - 提供配置管理提示
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// 配置文件路径
const CONFIG_DIR = path.join(os.homedir(), '.byted-cli', 'image');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
const DEFAULT_CONFIG = {
  ark_api_key: '',
  model_id: 'doubao-1-5-vision-pro-32k-250115'
};

/**
 * 检查配置文件是否存在
 */
function checkConfigExists() {
  return fs.existsSync(CONFIG_FILE);
}

/**
 * 读取配置文件
 */
function loadConfig() {
  try {
    if (checkConfigExists()) {
      const content = fs.readFileSync(CONFIG_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (error) {
    process.stderr.write(`读取配置文件失败: ${error.message}\n`);
  }
  return null;
}

/**
 * 创建默认配置文件
 */
function createDefaultConfig() {
  try {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
    fs.writeFileSync(
      CONFIG_FILE,
      JSON.stringify(DEFAULT_CONFIG, null, 2),
      'utf-8'
    );
    return true;
  } catch (error) {
    process.stderr.write(`创建配置文件失败: ${error.message}\n`);
    return false;
  }
}

/**
 * 验证配置
 */
function validateConfig(config) {
  const issues = [];

  if (!config) {
    issues.push('配置文件不存在');
    return issues;
  }

  if (!config.ark_api_key || config.ark_api_key.trim() === '') {
    issues.push('ark_api_key 未配置');
  }

  if (!config.model_id || config.model_id.trim() === '') {
    issues.push('model_id 未配置');
  }

  return issues;
}

/**
 * 获取配置提示信息
 */
function getConfigTips() {
  const config = loadConfig();
  const issues = validateConfig(config);

  if (issues.length === 0) {
    return {
      status: '✅ 配置正常',
      model_id: config.model_id,
      api_key_preview: config.ark_api_key.substring(0, 8) + '...'
    };
  }

  const tips = [];
  tips.push('⚠️  配置问题：');
  issues.forEach(issue => tips.push(`   - ${issue}`));

  if (!checkConfigExists()) {
    tips.push('');
    tips.push('📝 首次使用？请运行以下命令创建配置：');
    tips.push(`   mkdir -p "${CONFIG_DIR}"`);
    tips.push(`   cat > "${CONFIG_FILE}" << 'EOF'`);
    tips.push(JSON.stringify(DEFAULT_CONFIG, null, 2));
    tips.push('EOF');
  }

  tips.push('');
  tips.push('🔑 配置方法：');
  tips.push('   方式1（推荐）：使用 Bash 工具直接编辑配置文件');
  tips.push(`   vi "${CONFIG_FILE}"`);
  tips.push('');
  tips.push('   方式2：使用覆盖命令');
  tips.push(`   echo '{"ark_api_key": "你的key", "model_id": "模型ID"}' > "${CONFIG_FILE}"`);

  return {
    status: '⚠️ 需要配置',
    issues: tips
  };
}

/**
 * 获取使用示例
 */
function getUsageExamples() {
  return [
    {
      title: '分析本地图片',
      example: '帮我分析这张图片 /path/to/image.png 的内容'
    },
    {
      title: '分析网络图片',
      example: '分析这张图片 https://example.com/photo.jpg 的主要元素'
    },
    {
      title: '使用 Base64',
      example: '理解这个图片 (base64: iVBORw0KG...) 的详细内容'
    }
  ];
}

/**
 * 构建欢迎消息
 */
function buildWelcomeMessage() {
  const configTips = getConfigTips();
  const examples = getUsageExamples();

  let message = '\n📸 Image Vision Plugin\n';
  message += '=' .repeat(40) + '\n\n';

  // 配置状态
  message += '📊 配置状态：\n';
  if (configTips.status === '✅ 配置正常') {
    message += `  ${configTips.status}\n`;
    message += `  模型: ${configTips.model_id}\n`;
    message += `  API Key: ${configTips.api_key_preview}\n`;
  } else {
    configTips.issues.forEach(tip => message += `${tip}\n`);
  }

  message += '\n💡 使用示例：\n';
  examples.forEach((ex, index) => {
    message += `  ${index + 1}. ${ex.title}\n`;
    message += `     "${ex.example}"\n`;
  });

  message += '\n🔧 支持的图片输入格式：\n';
  message += '  • 本地文件路径: /path/to/image.jpg\n';
  message += '  • HTTPS URL: https://example.com/image.jpg\n';
  message += '  • Base64 编码: data:image/jpeg;base64,...\n';

  message += '\n📖 详细文档: 请查看 /skills/image-vision/SKILL.md\n';

  return message;
}

/**
 * SessionStart hook 处理函数
 */
function handleSessionStart(input) {
  const welcomeMessage = buildWelcomeMessage();

  return {
    systemMessage: welcomeMessage,
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      pluginName: 'image-vision',
      configPath: CONFIG_FILE,
      configExists: checkConfigExists()
    }
  };
}

/**
 * 从标准输入读取数据
 */
async function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf-8');

    process.stdin.on('data', (chunk) => {
      data += chunk;
    });

    process.stdin.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        resolve({});
      }
    });

    // 如果没有输入，设置超时
    setTimeout(() => {
      resolve({});
    }, 100);
  });
}

// CLI 执行入口
(async () => {
  const inputData = await readStdin();
  const output = handleSessionStart(inputData);
  console.log(JSON.stringify(output, null, 2));
})();
