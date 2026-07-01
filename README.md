# Web Deck

> **PPT → HTML 转换层** — 把你的 PowerPoint 变成交互式网页演示文稿

[English](./README_EN.md) | **简体中文**

---

## 🎯 Web Deck 是什么？

**Web Deck** 是一个将传统 PowerPoint（`.pptx`）演示文稿一键转换为**交互式网页演示文稿** 的开源工具。

想象一下：你有一份精心准备的 PPT，但每次分享都要担心对方有没有装 PowerPoint、排版会不会错位、手机上能不能看。Web Deck 解决了这一切——上传 PPT，AI 自动解析内容结构，生成一份**可以直接在浏览器中打开、分享、演示**的网页文档。

**保留 PPT 的确定性，解锁 HTML 的交互性。**

---

## ✨ 核心特性

### 📑 PPTX 智能解析
上传 `.pptx` 文件，Web Deck 会自动提取每一页的标题、正文、要点、备注等结构化信息，生成导入质量报告，让你对解析结果一目了然。

### 🤖 AI 驱动的内容重构
借助 Anthropic Claude 的能力，Web Deck 不是简单地"截图转网页"，而是**理解你的内容语义**，将 PPT 内容智能重组为原生网页组件：

| PPT 中的… | → Web Deck 中的… |
|---|---|
| 封面页 | 🏠 Hero 区域（带 CTA 按钮） |
| 目录页 | 📋 Agenda 导航 |
| 文字要点页 | 📝 文本 / 卡片 / 时间线 |
| 对比表格 | ⚖️ 对比组件 |
| Q&A 页 | ❓ FAQ 手风琴 |
| 数据图表 | 📊 SVG 图表（柱状/折线/饼图/KPI） |
| 结尾页 | 🎯 CTA 行动号召 |

### 🎨 两种转换模式

- **保守模式（Conservative）**：一页 PPT = 一个章节，保留原始结构，零学习成本
- **增强模式（Enhanced）**：AI 自由重组内容，生成 Hero、Cards、Timeline、Comparison 等网页原生组件

### 🖊️ 可视化编辑器
转换完成后，进入功能完善的所见即所得编辑器：

- **内容面板** — 编辑标题、正文、列表项
- **设计面板** — 切换主题、调整圆角/阴影/间距
- **媒体面板** — 管理图片与画廊
- **动画面板** — 配置入场动画和页面切换效果
- **设备预览** — 桌面 / 平板 / 手机三端实时切换
- **快捷键支持** — 提升编辑效率
- **发布检查清单** — 发布前自动检查内容完整性

### 🎭 丰富的区块类型

Web Deck 支持 **12 种原生区块**，覆盖几乎所有演示场景：

| 区块 | 用途 |
|---|---|
| `hero` | 大标题 + 指标数据 |
| `agenda` | 内容目录导航 |
| `slide` | 传统文字页 |
| `cards` | 特性卡片 / 案例展示 |
| `image` | 单图（全宽/分栏/带框） |
| `gallery` | 图片画廊（网格/轮播/瀑布流） |
| `chart` | 数据图表（柱/线/饼/环/KPI/表格） |
| `timeline` | 时间线 |
| `comparison` | 左右对比 |
| `faq` | 常见问题 |
| `quote` | 引用语录 |
| `cta` | 行动号召 |

### 🎪 全屏演示模式
按方向键翻页，`Esc` 退出，`N` 键切换演讲者备注——就像真正的演示软件一样。支持 Fade / Slide / Zoom 三种切换动画。

### 🔗 一键分享与导出
- **链接分享**：发布后获得专属链接，支持 Open Graph 元数据
- **静态 HTML 导出**：导出一个完全自包含的 `.html` 文件，离线可读，无任何外部依赖

### 🌍 中英文双语
完整的中英文界面支持，一键切换语言。

### 🔌 离线可用
没有 API Key？没关系。Web Deck 内置 `MockAIProvider`，无需任何外部服务即可完整体验所有功能。

---

## 🚀 快速开始

### 环境要求

- Node.js ≥ 18
- npm 或 yarn

### 安装

```bash
git clone https://github.com/your-username/web-deck.git
cd web-deck
npm install
```

### 配置（可选）

```bash
cp .env.local.example .env.local
```

编辑 `.env.local`，填入你的 Anthropic API Key（不填则使用离线 Mock 模式）：

```env
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-5-sonnet-20240620
```

### 启动

```bash
npm run dev
```

打开浏览器访问 `http://localhost:3000`，开始使用！

### 生成演示数据

```bash
npm run seed:demo
```

这会生成 5 个内置 Demo 项目：公司简介、产品发布、融资路演、年度总结、培训课程。

---

## 🏗️ 技术架构

```
┌─────────────────────────────────────────────────────┐
│                   Web Deck                           │
├──────────┬──────────┬──────────┬────────────────────┤
│  上传 PPT │  AI 转换  │  可视化   │   分享 & 导出       │
│  解析引擎  │  内容重构  │  编辑器   │                    │
├──────────┴──────────┴──────────┴────────────────────┤
│                   Web Deck 数据层                     │
│  (12 种区块类型 · 主题系统 · 动画系统 · 图表渲染)       │
├─────────────────────────────────────────────────────┤
│  Next.js 14 · React 18 · TypeScript · Tailwind CSS  │
│  Anthropic Claude · JSZip · fast-xml-parser          │
└─────────────────────────────────────────────────────┘
```

### 核心模块

| 模块 | 路径 | 说明 |
|---|---|---|
| PPTX 解析 | `lib/pptx/` | 基于 JSZip 解压 `.pptx`，提取 XML 中的文本和结构 |
| AI 引擎 | `lib/ai/` | Anthropic Claude 接口 + Mock 离线模式 |
| Deck 引擎 | `lib/deck/` | 主题、动画、图表渲染、区块工厂、质量检查 |
| 导出引擎 | `lib/export/` | 生成零依赖静态 HTML |
| 存储层 | `lib/storage/` | 项目持久化（JSON 文件存储） |
| 编辑器 | `components/editor/` | 所见即所得编辑器 + Inspector 面板 |
| Deck 组件 | `components/deck/` | 12 种区块的 React 渲染器 |
| 国际化 | `lib/i18n/` | 中英文双语字典 |

---

## 📂 项目结构

```
web-deck/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # 首页
│   ├── projects/                 # 项目管理
│   │   ├── new/                  # 上传 PPT
│   │   └── [id]/
│   │       ├── edit/             # 编辑器
│   │       └── present/          # 全屏演示
│   ├── demo/                     # Demo 画廊
│   ├── share/[shareId]/          # 公开分享页
│   └── api/                      # API 路由
├── components/
│   ├── deck/                     # Deck 区块渲染器
│   ├── editor/                   # 编辑器组件
│   ├── layout/                   # 布局组件
│   └── ui/                       # 通用 UI 组件
├── lib/
│   ├── ai/                       # AI 提供者（Anthropic + Mock）
│   ├── deck/                     # Deck 核心逻辑
│   ├── export/                   # 静态 HTML 导出
│   ├── i18n/                     # 国际化
│   ├── pptx/                     # PPTX 解析
│   ├── storage/                  # 数据存储
│   └── utils/                    # 工具函数
├── types/                        # TypeScript 类型定义
├── scripts/                      # 工具脚本
└── data/                         # 项目数据（git ignored）
```

---

## 📜 开源协议

本项目采用 **[CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hans)**（署名-非商业性使用-相同方式共享）协议。

**这意味着你可以：**

- ✅ **自由使用** — 个人学习、研究、非商业用途
- ✅ **修改和分发** — 基于本项目创作衍生作品
- ✅ **Fork 和二次开发** — 只要遵循相同协议

**但你需要遵守：**

- 📝 **署名** — 使用时保留原作者署名和许可证声明
- 🚫 **非商业用途** — 不得将本项目或其衍生作品用于商业目的
- 🔄 **相同方式共享** — 衍生作品必须采用相同的 CC BY-NC-SA 4.0 协议

> **如需商业使用授权，请联系项目作者获取商业许可。**

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feature/amazing-feature`
3. 提交更改：`git commit -m 'Add amazing feature'`
4. 推送分支：`git push origin feature/amazing-feature`
5. 提交 Pull Request

---

## 🙏 致谢

- [Anthropic Claude](https://www.anthropic.com/) — AI 内容理解与重构
- [Next.js](https://nextjs.org/) — 全栈 React 框架
- [Tailwind CSS](https://tailwindcss.com/) — 原子化 CSS
- [JSZip](https://stuk.github.io/jszip/) — PPTX ZIP 解压
- [Lucide](https://lucide.dev/) — 图标库

---

<p align="center">
  <strong>Web Deck</strong> — 让每一份 展示 都能以最现代的方式被看见 ✨
</p>

