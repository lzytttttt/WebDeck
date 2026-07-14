# Web Deck

> **PPT → HTML 转换层** — 把你的 PowerPoint 变成交互式网页演示文稿

**🔗 [在线体验 Demo](https://web-deck-pied.vercel.app/)**

[English](./README_EN.md) | **简体中文**

---

## 🎯 Web Deck 是什么？

**Web Deck** 是一个将传统 PowerPoint（`.pptx`）演示文稿一键转换为**交互式网页演示文稿** 的开源工具。

想象一下：你有一份精心准备的 PPT，但每次分享都要担心对方有没有装 PowerPoint、排版会不会错位、手机上能不能看。Web Deck 解决了这一切——上传 PPT，AI 自动解析内容结构，生成一份**可以直接在浏览器中打开、分享、演示**的网页文档。

**保留 PPT 的确定性，解锁 HTML 的交互性。**

---

## 💡 为什么需要 Web Deck？

### PPT 的范式困境

PowerPoint 诞生于 1987 年，它的核心假设是：**演示 = 线性翻页的幻灯片**。这个假设在投影仪时代是合理的，但在今天——

```
1987 年的世界                    2026 年的世界
┌──────────────┐               ┌──────────────┐
│ 一台投影仪    │               │ 手机·平板·PC  │
│ 一个全屏软件  │        →      │ 微信·飞书·邮件 │
│ 线性翻页      │               │ 响应式·交互    │
│ 离线文件交换  │               │ 链接分享·协作  │
└──────────────┘               └──────────────┘
```

| PPT 的痛点 | 根因 | Web Deck 的解法 |
|---|---|---|
| 打开需要 PowerPoint/WPS | 私有二进制格式 | 浏览器原生，零依赖 |
| 手机上排版错乱 | 固定像素布局 | 响应式设计，三端适配 |
| 分享要发文件（几十 MB） | 文件分发模式 | 一个链接，几 KB HTML |
| 内容是"死"的 | 线性翻页，无交互 | FAQ 手风琴、卡片、时间线等原生交互 |
| 版本管理混乱 | 二进制 diff 不可能 | JSON 结构化数据，Git 友好 |
| 内容无法被搜索/引用 | 视觉格式，无语义 | 语义化 HTML，可索引可引用 |

### 不是替代 PPT，而是升级范式

Web Deck 的定位不是"又一个演示工具"，而是一个**过渡层**：

```
传统工作流：  Word 写稿 → PPT 排版 → 发文件 → 对方用 PPT 打开
                              ↓ Web Deck
新工作流：    PPT 写稿 → Web Deck 转换 → 链接分享 → 浏览器打开
```

你不需要重新学任何东西。**你的 PPT 技能完全保留**——Web Deck 在 PPT 的基础上叠加了 HTML 的能力，而不是推倒重来。

---

## ✨ 核心特性

### 📑 PPTX 智能解析
上传 `.pptx` 文件，Web Deck 会自动提取每一页的标题、正文、要点、备注等结构化信息，生成导入质量报告，让你对解析结果一目了然。

### 🤖 AI 驱动的内容重构
借助可自由切换的 AI Provider（**Anthropic Claude / OpenAI / 本地 Ollama / 离线 Mock**）的能力，Web Deck 不是简单地"截图转网页"，而是**理解你的内容语义**，将 PPT 内容智能重组为原生网页组件：

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

### 🔀 多 AI Provider 支持
在编辑器工具栏的「AI 提供商」面板中，可即时切换 **Anthropic / OpenAI / Ollama / Mock** 四种引擎，并按 Provider 填写 API Key、模型名、基础地址。选择会持久化保存，并直接作用于后续的 AI 生成任务——无需改环境变量、无需重启服务。

### 🖼️ PPTX 图片内联
从 `.pptx` 中提取的图片会直接内联进 HTML（base64），不再只是统计引用数，导出的网页能完整呈现原稿视觉内容。

### 🎨 自定义主题与模板
内置主题库 + 用户自定义主题（颜色、圆角、阴影、间距），并支持模板浏览一键套用，快速统一整份 deck 的视觉风格。

### ⚙️ 异步生成管线
AI 生成在后台 Job 中执行（进度可见、失败可重试），大文档不再阻塞界面。

### 📦 PPTX 再导出
支持把编辑后的 deck 重新导出为 `.pptx`，形成「PPT → Web → PPT」的闭环。

---

## 🏛️ 设计哲学

### "内容源"而非"视觉格式"

传统 PPT 转换工具（如 LibreOffice 导出 PDF/HTML）本质上是在做**像素级搬运**——把幻灯片的视觉外观"截图"到另一个格式。Web Deck 的思路完全不同：

> **把 PPT 当作"结构化内容源"，而非"视觉格式"。**

PPT 的每一页都包含语义信息：这是封面、这是目录、这是数据对比、这是 FAQ。Web Deck 通过 AI 理解这些语义，然后用**最合适的网页原生组件**重新表达——而不是把 PPT 的视觉外观"拍照"到网页上。

```
传统转换：  PPT 视觉 → 截图/矢量图 → 嵌入网页（还是"死"的）
Web Deck：  PPT 内容 → AI 语义理解 → 原生网页组件（活的、可交互的）
```

### 多 Provider 架构：永不卡死

```
用户上传 PPT
    │
    ▼
[AIProvider.generateWebDeck()]   ←  界面/环境变量 选择 Provider
    │
    ├── Anthropic Claude API 可用？
    │   └── Yes → Claude 语义理解 → 结构化 JSON
    │
    ├── OpenAI API 可用？
    │   └── Yes → GPT 语义理解 → 结构化 JSON
    │
    ├── 本地 Ollama 可用？
    │   └── Yes → 本地模型语义理解（隐私/离线友好）
    │
    └── 以上都不可用（无 Key / 离线 / 超时）
        └── 自动回退 → MockAIProvider → 确定性本地生成
```

**用户永远不会看到"转换失败"。** 离线模式下，Mock 引擎基于启发式规则生成可用的 deck——虽然不如 AI 智能，但保证了完整的可用性。多 Provider 设计让你可以按成本、隐私、质量灵活取舍。

### Theme → CSS Variables 桥接

编辑器中的每一个设计调整（主题切换、圆角、阴影、间距）都通过 CSS 自定义属性驱动：

```css
:root {
  --deck-bg: #ffffff;
  --deck-text: #1a1a2e;
  --deck-accent: #6366f1;
  --deck-radius: 12px;
  --deck-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
}
```

**预览和导出共用同一套变量**——编辑器里看到的效果 = 导出的 HTML 文件的效果 = 最终分享链接的效果。所见即所得。

### 零依赖图表渲染

手写 SVG 图表渲染器（柱状图、折线图、饼图、环形图、KPI 卡片、数据表格），不依赖 Chart.js / D3 / ECharts 等第三方库。颜色通过 `color-mix()` 从主题 CSS 变量自动派生——切换主题时图表颜色自动跟随变化。

---

## 🚀 快速开始

### 环境要求

- Node.js ≥ 18
- npm 或 yarn

### 安装

```bash
git clone https://github.com/lzytttttt/WebDeck.git
cd WebDeck
npm install
```

### 配置（可选）

```bash
cp .env.local.example .env.local
```

编辑 `.env.local` 配置默认的 AI Provider（不填则使用离线 Mock 模式）：

```env
# 可选值：anthropic | openai | ollama | mock（与界面「AI 提供商」设置二选一，界面优先）
AI_PROVIDER=mock

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-5-sonnet-20240620

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o

# 本地 Ollama
OLLAMA_BASE_URL=http://localhost:11434
```

> 也可以通过编辑器工具栏的「AI 提供商」面板在界面中设置，保存后即时生效并持久化。环境变量与界面设置均可使用，**界面中的选择优先级高于环境变量**。

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

### 核心数据流

```
.pptx 文件
    │
    ▼
[JSZip 解压] → [fast-xml-parser 提取 XML] → [extractSlideText]
    │
    ▼
ParsedSlide[] (title, rawText, bullets, notes, imageRefCount, tableRefCount)
    │
    ├──→ [buildImportQualityReport] → 6 种警告
    │
    ▼
[AIProvider.generateWebDeck()]
    ├── AnthropicAIProvider: Claude API → JSON Schema 校验
    └── MockAIProvider: 启发式规则 → 确定性生成
    │
    ▼
WebDeck JSON (id, title, theme, sections[], suggestions[])
    │
    ├──→ [DeckRenderer] → React 组件树
    ├──→ [Presenter] → 全屏演示
    └──→ [exportStaticHtml] → 自包含 .html 文件
```

### 核心模块

| 模块 | 路径 | 说明 |
|---|---|---|
| PPTX 解析 | `lib/pptx/` | 基于 JSZip 解压 `.pptx`，提取 XML 中的文本和结构 |
| AI 引擎 | `lib/ai/` | 多 Provider：Anthropic / OpenAI / Ollama + Mock 离线模式 |
| Deck 引擎 | `lib/deck/` | 主题、动画、图表渲染、区块工厂、质量检查 |
| 导出引擎 | `lib/export/` | 生成零依赖静态 HTML |
| 存储层 | `lib/storage/` | 项目持久化（JSON 文件存储） |
| 编辑器 | `components/editor/` | 所见即所得编辑器 + Inspector 面板 |
| Deck 组件 | `components/deck/` | 12 种区块的 React 渲染器 |
| 国际化 | `lib/i18n/` | 中英文双语字典 |

---

## 📂 项目结构

```
WebDeck/
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
│   ├── ai/                       # AI 提供者（Anthropic / OpenAI / Ollama / Mock）
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

## ⚠️ 已知限制

| 限制 | 说明 | 计划 |
|---|---|---|
| 不保留 PPT 动画/过渡 | PPT 的入场动画、切换效果无法映射 | Roadmap v0.4 |
| 不支持 SmartArt | SmartArt 是 PPT 特有的复杂元素 | 暂无计划 |
| AI 结果需人工审核 | AI 可能误判内容语义，建议转换后检查 | 持续优化 Prompt |

---

## 🗺️ Roadmap

- [x] **v0.2** — 图片提取与内联（从 PPTX 中提取图片嵌入 HTML）
- [x] **v0.3** — 多 AI Provider（Anthropic / OpenAI / Ollama / Mock）+ 界面切换与持久化
- [ ] **v0.4** — PPT 动画 → CSS 动画映射
- [ ] **v0.5** — 模板市场（社区共享 deck 模板）
- [ ] **v1.0** — 团队协作 + 版本历史 + 批注

---

## 📊 性能参考

| 指标 | 典型值 |
|---|---|
| PPTX 解析（10 页） | < 1 秒 |
| AI 转换（10 页，保守模式） | 5-15 秒（取决于 API 响应） |
| Mock 转换（10 页） | < 500 毫秒 |
| 导出 HTML 文件大小 | 10-50 KB（不含图片） |
| 首屏加载 | < 2 秒 |

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
- [fast-xml-parser](https://github.com/NaturalIntelligence/fast-xml-parser/) — XML 解析
- [Lucide](https://lucide.dev/) — 图标库

---

<p align="center">
  <strong>Web Deck</strong> — 让每一份展示都能以最现代的方式被看见 ✨
</p>
