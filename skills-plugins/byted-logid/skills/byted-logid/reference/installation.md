# logid 安装与配置

## 安装方式

### 方式一：快速安装（推荐）

```bash
curl -fsSL https://raw.githubusercontent.com/DreamCats/logid/main/install.sh | bash
```

自定义安装目录：

```bash
INSTALL_DIR=/usr/local/bin curl -fsSL https://raw.githubusercontent.com/DreamCats/logid/main/install.sh | bash
```

### 方式二：源码编译

```bash
git clone https://github.com/DreamCats/logid.git
cd logid
cargo build --release
# 二进制文件位于 target/release/logid
```

### 方式三：预编译二进制文件

从 [Releases](https://github.com/DreamCats/logid/releases) 下载对应平台的二进制文件。

## Cookie 配置

### 1. 创建配置文件

```bash
mkdir -p ~/.config/logid
cat > ~/.config/logid/.env << 'EOF'
CAS_SESSION_US=your_us_session_cookie_here
CAS_SESSION_I18n=your_i18n_session_cookie_here
CAS_SESSION_EU=your_eu_session_cookie_here
EOF
```

### 2. 获取 Cookie 方法

#### 美区
1. 访问 https://cloud-ttp-us.bytedance.net
2. 按 F12 打开浏览器开发者工具
3. 切换到 "Application" 或 "存储" 标签
4. 在 Cookies 中找到对应域名
5. 复制名为 `CAS_SESSION` 的值

#### 国际化区域
1. 访问 https://cloud-i18n.bytedance.net
2. 重复上述步骤获取 Cookie

#### 欧洲区
1. 访问对应的欧洲区云控制台
2. 重复上述步骤获取 Cookie

### 3. 验证安装

```bash
logid --help
logid query "test-logid" --region us
```

## 常见问题

### Q: 提示缺少 CAS_SESSION_US？
A: 检查 `.env` 文件是否在正确位置，或环境变量是否已导出。

### Q: 认证失败（401/403）？
A: Cookie 可能已过期，重新登录获取新的 CAS_SESSION。

### Q: logid 命令找不到？
A: 确保 logid 在系统 PATH 中，或使用完整路径执行。
