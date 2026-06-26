# 🛡️ SQLens

> 图形化 SQLMap 外壳 + AI 全自动注入分析

SQLens 是一款基于 Electron 的桌面端 SQL 注入分析工具。它通过调用 `sqlmapapi` 的 REST API 实现全图形化操作，并集成 AI 大模型（DeepSeek）实现全流程自动化漏洞发现。

## ✨ 特性

### 🖥️ 全图形化参数面板
所有 sqlmap 常用参数 GUI 化，无需记忆命令行：
- **目标与请求** — URL/GET/POST/Cookie/UA/Headers/代理
- **注入参数** — 注入技术/数据库类型/Level/Risk
- **检测与绕过** — 70+ Tamper 脚本/编码/文本比较
- **枚举选项** — 数据库/表/列/Dump/字段搜索
- **优化** — 线程数/Keep-Alive/Null连接

### 🤖 AI 全自动
- **一键全自动** — 输入 URL → AI 分析 → 自动配置 → 扫描 → 出报告
- **流式 AI 对话** — 像 ChatGPT 一样交流，AI 实时响应
- **日志解读** — AI 用大白话解释扫描进度
- **报告生成** — 结构化报告 + 修复建议代码 (PHP/Python/Java)

### 📦 开箱即用
- 单文件安装包，内置 sqlmapapi 自动管理
- 多任务标签页，同时扫描多个目标
- 批量导入 URL (手动/文件/Burp Suite)
- 数据库浏览器 (树形浏览/数据预览/导出)
- SQL 编辑器 (通过注入点执行任意 SQL)
- 暗色/亮色双主题
- 键盘快捷键 (`Ctrl+Enter` 启动, `Ctrl+Shift+T` 切换主题)

## 🚀 快速开始

### 开发环境

```bash
# 克隆仓库
git clone https://github.com/yyq2006/SQLens.git
cd SQLens

# 安装依赖
npm install

# 启动开发模式
npm run dev

# 或者先下载 sqlmap 资源
npm run setup
```

### 构建安装包

```bash
# Windows
npm run dist:win

# macOS
npm run dist:mac

# Linux
npm run dist:linux
```

## 🔧 配置 AI

1. 打开 SQLens，点击左侧「设置」
2. 输入 [DeepSeek](https://platform.deepseek.com) API Key
3. 点击「测试连接」验证
4. 保存后即可使用 AI 功能

## 🏗️ 技术架构

```
┌─────────────────────────────────────┐
│         SQLens (Electron)           │
│  ┌──────────┐  ┌──────────────────┐ │
│  │ 渲染进程   │←→│ 主进程           │ │
│  │ React+TW  │IP│ Node.js         │ │
│  │ shadcn/ui │  │ sqlmapapi管理器  │ │
│  └──────────┘  │ AI 服务          │ │
│                │ SQLite 持久化     │ │
│                └────────┬─────────┘ │
└─────────────────────────┼───────────┘
                          │ REST API
              ┌───────────▼───────────┐
              │     sqlmapapi         │
              │  (自动管理子进程)       │
              └───────────────────────┘
                          │ HTTPS
              ┌───────────▼───────────┐
              │  DeepSeek API (在线)   │
              └───────────────────────┘
```

### 技术栈

| 层级 | 技术 |
|------|------|
| 桌面框架 | Electron 28+ |
| 前端 | React 19 + TypeScript + Tailwind CSS v4 |
| UI 组件 | shadcn/ui |
| 构建 | electron-vite + electron-builder |
| AI | DeepSeek API (兼容 OpenAI 格式) |
| sqlmap 接口 | sqlmapapi REST API |

## 📁 项目结构

```
src/
├── main/
│   ├── index.ts           主进程 (IPC 处理)
│   ├── sqlmap-manager.ts   sqlmapapi 管理器
│   └── ai-service.ts       AI 服务
├── preload/
│   └── index.ts            API 桥接层
└── renderer/src/
    ├── App.tsx             主应用
    ├── types.ts            类型定义
    ├── storage.ts          持久化存储
    ├── hooks/
    │   ├── useScanManager.ts  扫描管理
    │   └── useTheme.ts        主题管理
    └── components/
        ├── Sidebar.tsx        侧边栏
        ├── RequestParams.tsx  请求参数
        ├── InjectionParams.tsx 注入参数
        ├── DetectionParams.tsx 检测绕过
        ├── EnumParams.tsx     枚举选项
        ├── OptimizeParams.tsx 优化参数
        ├── CustomParams.tsx   自定义参数
        ├── LogViewer.tsx      日志查看器
        ├── StatusBar.tsx      状态栏
        ├── RequestEditor.tsx  请求导入
        ├── AiSettings.tsx     AI 配置
        ├── BatchScanner.tsx   批量扫描
        ├── ChatPanel.tsx      AI 聊天
        ├── DatabaseBrowser.tsx 数据库浏览器
        ├── ReportViewer.tsx   报告生成
        └── HistoryPanel.tsx   历史记录
```

## 📄 许可证

[GPL v3](LICENSE) — 继承 sqlmap 的开源许可证

## ⚠️ 免责声明

本工具仅限 **授权测试** 使用：
- 你已经获得目标系统的明确书面授权
- CTF 比赛和漏洞赏金计划
- 自己的实验室环境

**未经授权使用可能违反法律法规。使用者自行承担所有责任。**
