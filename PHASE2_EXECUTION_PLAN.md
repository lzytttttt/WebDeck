# Phase 2：核心能力增强 — 架构师执行规划

> 基于 Phase 1 完成状态（测试基础设施、Section 注册表、SQLite 存储、Error Boundary、安全性修复、Upload 拆分、Zod Schema），以下为 Phase 6 个任务的详细技术方案。

---

## 目录

1. [P2.1 PPTX 图片提取与内联](#p21-pptx-图片提取与内联)
2. [P2.2 异步生成管线](#p22-异步生成管线)
3. [P2.3 多 AI Provider 支持](#p23-多-ai-provider-支持)
4. [P2.4 自定义主题系统](#p24-自定义主题系统)
5. [P2.5 导出增强（PDF、PPTX 反向导出）](#p25-导出增强)
6. [P2.6 图表渲染统一](#p26-图表渲染统一)
7. [执行顺序与并行策略](#执行顺序与并行策略)
8. [质量门控](#质量门控)

---

## P2.1 PPTX 图片提取与内联

### 目标

从 .pptx ZIP 包中提取嵌入图片（`ppt/media/*`），通过 rels 映射到对应 slide，生成 data URL 或文件存储路径，注入 `ParsedSlide.images[]`，使 AI 生成和 Image/Gallery section 可引用原始 PPT 中的图片。

### 当前状态分析

- `lib/pptx/parsePptx.ts`：使用 JSZip 解压，只提取文本，未读取 media 目录
- `lib/pptx/extractSlideText.ts`：有 `countImageRefs()` 做正则计数，但不提取实际图片
- `types/project.ts`：`SlideImage` 类型已存在但为占位（`// MVP: images are not extracted`）
- `app/api/projects/[id]/assets/upload/route.ts`：已有图片上传为 base64 data URL 的机制
- `lib/storage/projectRepo.ts`：`assets` 字段存储在 `assets_json` 列

### 需要创建/修改的文件

| 操作 | 文件 | 说明 |
|------|------|------|
| **修改** | `lib/pptx/parsePptx.ts` | 主解析流程增加图片提取逻辑 |
| **新建** | `lib/pptx/extractImages.ts` | 图片提取核心模块 |
| **修改** | `lib/pptx/extractSlideText.ts` | 增加 rels 解析，获取 rId→media 映射 |
| **新建** | `lib/pptx/slideRels.ts` | 解析 `ppt/slides/_rels/slideN.xml.rels` |
| **修改** | `types/project.ts` | `SlideImage` 增加 `dataUrl`/`assetId` 可选字段 |
| **修改** | `app/api/projects/upload/route.ts` | 上传流程注入提取的图片到 assets |
| **新建** | `lib/__tests__/extractImages.test.ts` | 单元测试 |
| **修改** | `lib/ai/prompts.ts` | 提示词中增加图片描述信息 |

### 核心代码结构

```typescript
// lib/pptx/slideRels.ts
export type SlideRelEntry = { rId: string; target: string }; // target = ../media/image1.png

export async function parseSlideRels(
  zip: JSZip,
  slideNumber: number
): Promise<Map<string, string>> {
  // 解析 ppt/slides/_rels/slideN.xml.rels
  // 返回 rId -> media 路径映射 (e.g., "rId1" -> "media/image1.png")
  const relsPath = `ppt/slides/_rels/slide${slideNumber}.xml.rels`;
  const relsFile = zip.file(relsPath);
  if (!relsFile) return new Map();
  const xml = await relsFile.async("string");
  const doc = parser.parse(xml);
  // 提取 Relationship 节点中 Type 包含 "image" 的条目
  // 返回 Map<rId, mediaTarget>
}

// lib/pptx/extractImages.ts
export type ExtractedImage = {
  slideIndex: number;
  rId: string;
  fileName: string;
  mimeType: string; // 从扩展名推断
  dataUrl: string;  // base64 data URL
  width?: number;   // 从 blipFill 或 spPr 获取（可选）
  height?: number;
};

const EXT_MIME: Record<string, string> = {
  png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg",
  gif: "image/gif", bmp: "image/bmp", svg: "image/svg+xml",
  webp: "image/webp", emf: "image/x-emf", wmf: "image/x-wmf",
};

export async function extractImages(
  buffer: Buffer | ArrayBuffer
): Promise<ExtractedImage[]> {
  const zip = await JSZip.loadAsync(buffer);
  const mediaFiles = zip.file(/^ppt\/media\/.+/);
  if (!mediaFiles?.length) return [];

  // 1. 遍历每个 slide 的 rels，建立 slideIndex -> [rId -> mediaPath]
  // 2. 读取每个 media 文件为 base64 data URL
  // 3. 过滤掉 EMF/WMF（不支持在网页展示），保留 PNG/JPG/SVG/WebP
  // 4. 返回 ExtractedImage[]
}

// 将提取的图片映射回 ParsedSlide
export function mapImagesToSlides(
  images: ExtractedImage[],
  slideCount: number
): Map<number, ExtractedImage[]> {
  const map = new Map<number, ExtractedImage[]>();
  for (const img of images) {
    const list = map.get(img.slideIndex) ?? [];
    list.push(img);
    map.set(img.slideIndex, list);
  }
  return map;
}
```

```typescript
// 修改 lib/pptx/parsePptx.ts — parsePptx 增加图片返回
export type ParsePptxResult = {
  slides: ParsedSlide[];
  images: ExtractedImage[];  // 新增
};

export async function parsePptx(buffer: Buffer | ArrayBuffer): Promise<ParsePptxResult> {
  const extracted = await extractSlides(buffer);
  const slides = toParsedSlides(extracted);
  const images = await extractImages(buffer);

  // 将图片注入对应 slide 的 images 字段
  const imagesBySlide = mapImagesToSlides(images, slides.length);
  for (const slide of slides) {
    const slideImages = imagesBySlide.get(slide.index) ?? [];
    slide.images = slideImages.map(img => ({
      id: uid("img_"),
      name: img.fileName,
      alt: img.fileName.replace(/\.\w+$/, ""),
      // dataUrl 存在 assets 中，这里只保留引用
    }));
  }

  return { slides, images };
}
```

### 预期工期：3–4 天

### 依赖关系

- **无外部依赖**，可在 Phase 2 最早期执行
- 下游被 P2.2（异步管线）和 P2.5（PPTX 反向导出）引用

### 风险点与缓解

| 风险 | 影响 | 缓解 |
|------|------|------|
| PPTX 内嵌 EMF/WMF 矢量图无法在浏览器展示 | 中 | 过滤掉非 Web 支持格式，ImportQualityReport 增加 warning |
| 大型 PPT 含大量高清图导致内存爆炸 | 高 | 设置单文件 5MB / 总量 50MB 上限；超过跳过并 warning |
| rels 文件缺失或损坏 | 低 | 容错处理，降级为无图模式 |
| base64 data URL 使 SQLite blob 过大 | 中 | 图片存储到 `data/uploads/images/` 目录，assets 只存文件路径 |

---

## P2.2 异步生成管线

### 目标

将当前同步阻塞的 AI 生成流程改为异步队列模式：前端发起生成请求后立即返回 `jobId`，后端通过轮询/SSE 推送进度，支持取消、重试、超时处理。

### 当前状态分析

- `app/api/projects/[id]/generate/route.ts`：同步 `await provider.generateWebDeck()`，长时间阻塞 HTTP 请求
- 生成耗时：Mock ~10ms，Anthropic ~5-15s，未来多 Provider 更长
- 无进度反馈，无取消机制

### 需要创建/修改的文件

| 操作 | 文件 | 说明 |
|------|------|------|
| **新建** | `lib/pipeline/jobQueue.ts` | 内存队列管理器（单进程，无需 Redis） |
| **新建** | `lib/pipeline/jobTypes.ts` | Job 类型定义 |
| **新建** | `lib/pipeline/worker.ts` | 生成任务执行器 |
| **新建** | `app/api/projects/[id]/generate/submit/route.ts` | 提交生成任务（返回 jobId） |
| **新建** | `app/api/projects/[id]/generate/status/route.ts` | 查询任务状态（轮询） |
| **新建** | `app/api/projects/[id]/generate/cancel/route.ts` | 取消任务 |
| **修改** | `app/api/projects/[id]/generate/route.ts` | 保留为同步快捷路径（Mock Provider） |
| **修改** | `components/editor/Editor.tsx` | 集成轮询逻辑 |
| **新建** | `components/editor/GenerationProgress.tsx` | 进度 UI 组件 |
| **新建** | `lib/__tests__/jobQueue.test.ts` | 单元测试 |

### 核心代码结构

```typescript
// lib/pipeline/jobTypes.ts
export type JobStatus = "pending" | "running" | "completed" | "failed" | "cancelled";
export type JobStep = "parsing" | "generating" | "validating" | "saving";

export type GenerateJob = {
  id: string;
  projectId: string;
  mode: DeckMode;
  status: JobStatus;
  step: JobStep;
  progress: number;        // 0-100
  result?: WebDeck;
  error?: string;
  startedAt: string;
  completedAt?: string;
  abortController?: AbortController;
};
```

```typescript
// lib/pipeline/jobQueue.ts
const jobs = new Map<string, GenerateJob>();

export function submitJob(projectId: string, mode: DeckMode): GenerateJob {
  const job: GenerateJob = {
    id: uid("job_"),
    projectId,
    mode,
    status: "pending",
    step: "parsing",
    progress: 0,
    startedAt: new Date().toISOString(),
    abortController: new AbortController(),
  };
  jobs.set(job.id, job);
  // 异步执行，不阻塞返回
  executeJob(job).catch(err => {
    job.status = "failed";
    job.error = String(err);
  });
  return job;
}

export function getJob(jobId: string): GenerateJob | undefined { ... }
export function cancelJob(jobId: string): boolean { ... }

async function executeJob(job: GenerateJob): Promise<void> {
  job.status = "running";
  try {
    // Step 1: 获取项目
    job.step = "parsing"; job.progress = 10;
    const project = await getProject(job.projectId);
    if (!project) throw new Error("Project not found");

    // 检查取消
    if (job.abortController?.signal.aborted) { job.status = "cancelled"; return; }

    // Step 2: AI 生成
    job.step = "generating"; job.progress = 30;
    const provider = getAIProvider();
    const webDeck = await provider.generateWebDeck({
      projectName: project.name,
      slides: project.slides,
      mode: job.mode,
    });

    if (job.abortController?.signal.aborted) { job.status = "cancelled"; return; }

    // Step 3: 验证
    job.step = "validating"; job.progress = 80;
    // Zod 验证已在 provider 内部完成

    // Step 4: 保存
    job.step = "saving"; job.progress = 95;
    await updateProject(job.projectId, { webDeck, status: "generated" });

    job.result = webDeck;
    job.status = "completed";
    job.progress = 100;
    job.completedAt = new Date().toISOString();
  } catch (err) {
    job.status = "failed";
    job.error = err instanceof Error ? err.message : String(err);
    job.completedAt = new Date().toISOString();
  }
}
```

```typescript
// app/api/projects/[id]/generate/submit/route.ts
export async function POST(req: NextRequest, { params }) {
  await ensureDb();
  const project = await getProject(params.id);
  if (!project) return NextResponse.json({ error: "项目不存在" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const mode = body.mode ?? project.webDeck?.mode ?? "conservative";
  const job = submitJob(params.id, mode);
  return NextResponse.json({ jobId: job.id, status: job.status }, { status: 202 });
}
```

```typescript
// app/api/projects/[id]/generate/status/route.ts
export async function GET(req: NextRequest, { params }) {
  const jobId = req.nextUrl.searchParams.get("jobId");
  if (!jobId) return NextResponse.json({ error: "缺少 jobId" }, { status: 400 });
  const job = getJob(jobId);
  if (!job) return NextResponse.json({ error: "任务不存在" }, { status: 404 });
  return NextResponse.json({
    status: job.status,
    step: job.step,
    progress: job.progress,
    error: job.error,
    // completed 时返回完整 project
    ...(job.status === "completed" ? { project: await getProject(params.id) } : {}),
  });
}
```

### 预期工期：4–5 天

### 依赖关系

- **依赖 P2.1** 完成后可一起纳入异步管线（图片提取也是耗时操作）
- 前端轮询组件**无阻塞依赖**，可提前编写

### 风险点与缓解

| 风险 | 影响 | 缓解 |
|------|------|------|
| 内存队列进程重启丢失 | 高 | 任务持久化到 SQLite `jobs` 表；重启时恢复未完成任务 |
| 并发任务过多拖垮服务器 | 中 | 限制同时运行 1 个任务（串行队列），其他排队 |
| 前端轮询频率过高 | 低 | 指数退避：1s → 2s → 4s，最大 10s |
| AbortController 在 Node.js fetch 场景不生效 | 中 | 使用 Anthropic SDK 的 abort 信号支持，或设置 HTTP timeout |

---

## P2.3 多 AI Provider 支持

### 目标

扩展 `AIProvider` 接口和 `getAIProvider` 工厂，支持 OpenAI、Gemini、本地 Ollama 等多个后端，用户可在设置中选择。每个 Provider 独立实现，共享相同的输出验证管线。

### 当前状态分析

- `lib/ai/AIProvider.ts`：接口定义为 `AIProvider`，有两个方法 `generateWebDeck` / `generateSuggestions`
- `lib/ai/getAIProvider.ts`：简单工厂，只支持 Anthropic + Mock
- `lib/ai/AnthropicAIProvider.ts`：完整的 Anthropic 实现，含 `extractJson` + 双层验证
- `lib/ai/schema.ts`：通用验证逻辑（Zod + 手写），可被所有 Provider 共享

### 需要创建/修改的文件

| 操作 | 文件 | 说明 |
|------|------|------|
| **新建** | `lib/ai/OpenAIProvider.ts` | OpenAI (GPT-4o) Provider |
| **新建** | `lib/ai/GeminiProvider.ts` | Google Gemini Provider |
| **新建** | `lib/ai/OllamaProvider.ts` | 本地 Ollama Provider |
| **修改** | `lib/ai/AIProvider.ts` | 增加 Provider 元数据（名称、描述、需key?） |
| **修改** | `lib/ai/getAIProvider.ts` | 多 Provider 工厂 + 配置驱动 |
| **新建** | `lib/ai/providerRegistry.ts` | Provider 注册与发现 |
| **新建** | `lib/ai/config.ts` | AI 配置管理（env 读取、用户偏好） |
| **修改** | `lib/ai/schema.ts` | 提取 `extractJson` 为共享工具函数 |
| **新建** | `app/api/settings/ai-provider/route.ts` | Provider 选择 API |
| **修改** | `components/editor/inspector/DesignInspector.tsx` | 增加 Provider 选择 UI |
| **新建** | `lib/__tests__/providers.test.ts` | Provider 集成测试（Mock 验证） |

### 核心代码结构

```typescript
// lib/ai/AIProvider.ts — 扩展接口
export interface AIProviderMeta {
  readonly id: string;           // "anthropic" | "openai" | "gemini" | "ollama" | "mock"
  readonly name: string;         // 显示名称
  readonly requiresKey: boolean; // 是否需要 API key
  readonly models: string[];     // 支持的模型列表
  readonly description: string;  // 描述
}

export interface AIProvider extends AIProviderMeta {
  generateWebDeck(input: GenerateWebDeckInput): Promise<WebDeck>;
  generateSuggestions(input: GenerateSuggestionsInput): Promise<EnhancementSuggestion[]>;
}
```

```typescript
// lib/ai/providerRegistry.ts
const providers = new Map<string, (config: AIConfig) => AIProvider>();

export function registerProvider(
  id: string,
  factory: (config: AIConfig) => AIProvider
) { providers.set(id, factory); }

export function getProvider(id: string, config: AIConfig): AIProvider | null {
  const factory = providers.get(id);
  return factory ? factory(config) : null;
}

export function listAvailableProviders(config: AIConfig): AIProviderMeta[] {
  // 返回所有已注册且配置有效的 Provider
}

// lib/ai/config.ts
export type AIConfig = {
  provider: string;      // 当前选择的 provider id
  model?: string;        // 可选的模型覆盖
  anthropicKey?: string;
  openaiKey?: string;
  geminiKey?: string;
  ollamaUrl?: string;    // 默认 http://localhost:11434
};

export function loadAIConfig(): AIConfig {
  return {
    provider: process.env.AI_PROVIDER || "auto",
    model: process.env.AI_MODEL,
    anthropicKey: process.env.ANTHROPIC_API_KEY,
    openaiKey: process.env.OPENAI_API_KEY,
    geminiKey: process.env.GEMINI_API_KEY,
    ollamaUrl: process.env.OLLAMA_URL || "http://localhost:11434",
  };
}

export function getAIProvider(): AIProvider {
  const config = loadAIConfig();

  // auto 模式：按优先级尝试
  if (config.provider === "auto") {
    if (config.anthropicKey) return getProvider("anthropic", config)!;
    if (config.openaiKey) return getProvider("openai", config)!;
    if (config.geminiKey) return getProvider("gemini", config)!;
    return getProvider("mock", config)!;
  }

  return getProvider(config.provider, config) ?? getProvider("mock", config)!;
}
```

```typescript
// lib/ai/OpenAIProvider.ts
import OpenAI from "openai";

export class OpenAIProvider implements AIProvider {
  readonly id = "openai";
  readonly name = "OpenAI GPT-4o";
  readonly requiresKey = true;
  readonly models = ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"];
  readonly description = "OpenAI GPT-4o 模型";
  private client: OpenAI;
  private model: string;

  constructor(config: AIConfig) {
    this.client = new OpenAI({ apiKey: config.openaiKey });
    this.model = config.model || "gpt-4o";
  }

  async generateWebDeck(input: GenerateWebDeckInput): Promise<WebDeck> {
    const res = await this.client.chat.completions.create({
      model: this.model,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: WEB_DECK_SYSTEM_PROMPT },
        { role: "user", content: buildWebDeckUserPrompt(...) },
      ],
    });
    const parsed = extractJson(res.choices[0].message.content ?? "");
    // 共享验证逻辑
    const deck = validateWebDeckWithZod(parsed) ?? validateWebDeck(parsed);
    if (deck) return finalizeDeck(deck, input);
    return mockProvider.generateWebDeck(input); // fallback
  }

  async generateSuggestions(...) { /* 类似模式 */ }
}
```

### 预期工期：3–4 天（不含 Ollama 端到端测试）

### 依赖关系

- **依赖**：当前 AIProvider 接口（已有），Zod 验证管线（已有）
- **被 P2.2 依赖**：异步管线需要支持 Provider 切换
- OpenAI 需要安装 `openai` npm 包（~1天含集成测试）

### 风险点与缓解

| 风险 | 影响 | 缓解 |
|------|------|------|
| 不同 Provider JSON 输出格式差异大 | 高 | 统一使用 `WebDeckAIOutputSchema` 放宽验证 + `extractJson` 提取 |
| OpenAI JSON mode 有时仍返回非 JSON | 中 | 双重保险：response_format + extractJson 兜底 |
| Ollama 本地模型质量差 | 中 | Mock fallback 始终可用；UI 显示 Provider 名称让用户知情 |
| 新 Provider 增加维护负担 | 低 | 接口统一，新 Provider 只需实现 2 个方法 |

---

## P2.4 自定义主题系统

### 目标

允许用户自定义主题颜色、字体、圆角、阴影等，并支持主题保存/加载/分享。在编辑器中提供可视化主题编辑器。

### 当前状态分析

- `lib/deck/theme.ts`：5 个内置主题 + `themeToCssVars` 转换，`getThemeById` 只查内置
- `types/deck.ts`：`DeckTheme` 类型完整定义
- `lib/schema/sections.ts`：`DeckThemeSchema` 已有完整 Zod schema
- `DeckRenderer.tsx`：通过 CSS vars 应用主题
- `DesignInspector.tsx`：已有主题选择下拉（仅内置主题）

### 需要创建/修改的文件

| 操作 | 文件 | 说明 |
|------|------|------|
| **新建** | `lib/deck/customThemes.ts` | 自定义主题 CRUD（SQLite 存储） |
| **修改** | `lib/deck/theme.ts` | `getThemeById` 支持查自定义主题 |
| **修改** | `lib/storage/db.ts` | 新增 `custom_themes` 表 |
| **新建** | `app/api/themes/route.ts` | 主题列表/创建 API |
| **新建** | `app/api/themes/[id]/route.ts` | 主题更新/删除 API |
| **新建** | `components/editor/ThemeEditor.tsx` | 可视化主题编辑器 |
| **修改** | `components/editor/inspector/DesignInspector.tsx` | 集成自定义主题列表 + 编辑入口 |
| **新建** | `components/editor/ColorPicker.tsx` | 颜色选择器组件 |
| **新建** | `lib/__tests__/customThemes.test.ts` | 单元测试 |

### 核心代码结构

```sql
-- 新增 SQLite 表
CREATE TABLE IF NOT EXISTS custom_themes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  colors_json TEXT NOT NULL,
  typography_json TEXT NOT NULL,
  radius TEXT NOT NULL DEFAULT 'md',
  shadow TEXT NOT NULL DEFAULT 'sm',
  spacing TEXT NOT NULL DEFAULT 'normal',
  is_builtin INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

```typescript
// lib/deck/customThemes.ts
export async function listThemes(): Promise<DeckTheme[]> {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM custom_themes ORDER BY created_at DESC")
    .all() as CustomThemeRow[];
  return rows.map(rowToTheme);
}

export async function saveTheme(theme: DeckTheme): Promise<DeckTheme> {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT OR REPLACE INTO custom_themes
    (id, name, colors_json, typography_json, radius, shadow, spacing, is_builtin, created_at, updated_at)
    VALUES (@id, @name, @colorsJson, @typographyJson, @radius, @shadow, @spacing, 0, @createdAt, @updatedAt)
  `).run({ ... });
  return theme;
}

export async function deleteTheme(id: string): Promise<boolean> { ... }
```

```typescript
// lib/deck/theme.ts — 修改 getThemeById
import { listThemes } from "./customThemes";

// 内置 + 自定义合并查询（自定义主题缓存在内存，失效时重新加载）
let _customCache: DeckTheme[] | null = null;

export async function getThemeById(id: string | undefined): Promise<DeckTheme> {
  if (!id) return DEFAULT_THEME;
  const builtin = BUILTIN_THEMES.find(t => t.id === id);
  if (builtin) return builtin;
  if (!_customCache) _customCache = await listThemes();
  return _customCache.find(t => t.id === id) ?? DEFAULT_THEME;
}
```

```tsx
// components/editor/ThemeEditor.tsx
export function ThemeEditor({ theme, onChange }: Props) {
  return (
    <div className="space-y-4">
      {/* 颜色组 */}
      <Section title="颜色">
        <ColorPicker label="背景" value={theme.colors.background} onChange={...} />
        <ColorPicker label="主色" value={theme.colors.primary} onChange={...} />
        <ColorPicker label="强调色" value={theme.colors.accent} onChange={...} />
        {/* ... */}
      </Section>

      {/* 字体 */}
      <Section title="字体">
        <FontSelect label="标题字体" value={theme.typography.headingFont} onChange={...} />
        <FontSelect label="正文字体" value={theme.typography.bodyFont} onChange={...} />
      </Section>

      {/* 属性 */}
      <Section title="样式">
        <EnumSelect label="圆角" options={["none","sm","md","lg","xl"]} ... />
        <EnumSelect label="阴影" options={["none","sm","md","lg"]} ... />
        <EnumSelect label="间距" options={["compact","normal","spacious"]} ... />
      </Section>

      {/* 实时预览 */}
      <ThemePreview theme={theme} />

      {/* 操作 */}
      <Button onClick={() => saveTheme(theme)}>保存主题</Button>
    </div>
  );
}
```

### 预期工期：3–4 天

### 依赖关系

- **无阻塞依赖**，可独立开发
- 与 P2.5（导出）有间接关系：导出时需正确应用自定义主题

### 风险点与缓解

| 风险 | 影响 | 缓解 |
|------|------|------|
| `getThemeById` 改为 async 影响所有调用方 | 高 | 保留同步版本给内置主题，异步版本仅用于自定义；或缓存预热 |
| 用户选择的 Google Fonts 在静态导出不可用 | 中 | 静态导出增加 `<link>` 引用 Google Fonts CDN |
| 颜色对比度不足导致可读性差 | 低 | 在 ThemeEditor 中增加 WCAG 对比度检查和警告 |

---

## P2.5 导出增强

### 目标

新增 PDF 导出（服务端渲染）和 PPTX 反向导出（WebDeck → .pptx），扩展已有的静态 HTML 导出能力。

### 当前状态分析

- `lib/export/exportStaticHtml.ts`：完整的静态 HTML 导出（含内联 CSS、SVG 图表、动画）
- `lib/export/renderChartStatic.ts`：图表的静态 SVG 渲染
- `app/api/projects/[id]/export-html/route.ts`：HTML 导出 API
- 每个 section 定义了 `renderStatic` 方法

### 需要创建/修改的文件

| 操作 | 文件 | 说明 |
|------|------|------|
| **新建** | `lib/export/exportPdf.ts` | PDF 导出核心（使用 Puppeteer/Playwright） |
| **新建** | `lib/export/exportPptx.ts` | PPTX 反向导出（使用 pptxgenjs） |
| **新建** | `app/api/projects/[id]/export-pdf/route.ts` | PDF 导出 API |
| **新建** | `app/api/projects/[id]/export-pptx/route.ts` | PPTX 导出 API |
| **修改** | `app/api/projects/[id]/export-html/route.ts` | 增加主题自定义支持 |
| **新建** | `lib/export/pptxSectionMapper.ts` | Section → PPTX slide 映射逻辑 |
| **新建** | `lib/export/pdfRenderer.ts` | HTML → PDF 渲染封装 |
| **修改** | `components/editor/Editor.tsx` | 导出菜单增加 PDF/PPTX 选项 |
| **新建** | `lib/__tests__/exportPdf.test.ts` | PDF 导出测试 |
| **新建** | `lib/__tests__/exportPptx.test.ts` | PPTX 导出测试 |

### 核心代码结构

```typescript
// lib/export/exportPdf.ts
// 方案：使用 @playwright/test 的 browser 或 puppeteer
// 将 exportStaticHtml 的输出渲染为 PDF

import { exportStaticHtml } from "./exportStaticHtml";

export type PdfExportOptions = {
  format?: "A4" | "Letter" | "16:9";
  margin?: { top: string; right: string; bottom: string; left: string };
  landscape?: boolean;
};

export async function exportPdf(
  deck: WebDeck,
  options: PdfExportOptions = {}
): Promise<Buffer> {
  const html = exportStaticHtml(deck);
  // 动态导入 puppeteer（避免开发环境加载）
  const puppeteer = await import("puppeteer");
  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({
      format: options.format || "A4",
      landscape: options.landscape ?? true,
      printBackground: true,
      margin: options.margin || { top: "20mm", right: "15mm", bottom: "20mm", left: "15mm" },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
```

```typescript
// lib/export/exportPptx.ts
// 方案：使用 pptxgenjs 从 WebDeck 数据反向生成 .pptx

import PptxGenJS from "pptxgenjs";
import type { WebDeck, DeckSection } from "@/types/deck";

export async function exportPptx(deck: WebDeck): Promise<Buffer> {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE"; // 16:9

  // 应用主题颜色
  const theme = deck.theme;
  pptx.defineLayout({ name: "CUSTOM", width: 13.33, height: 7.5 });

  for (const section of deck.sections) {
    const slide = pptx.addSlide();
    mapSectionToSlide(slide, section, theme);
  }

  return Buffer.from(await pptx.write({ outputType: "arraybuffer" }));
}

function mapSectionToSlide(
  slide: PptxGenJS.Slide,
  section: DeckSection,
  theme: DeckTheme
): void {
  // 根据 section.type 分发到不同映射器
  switch (section.type) {
    case "hero":
      slide.background = { color: theme.colors.background.replace("#", "") };
      slide.addText(section.title, {
        x: "10%", y: "30%", w: "80%", fontSize: 36,
        color: theme.colors.primary.replace("#", ""),
        fontFace: theme.typography.headingFont.split(",")[0],
      });
      if (section.subtitle) {
        slide.addText(section.subtitle, {
          x: "10%", y: "50%", w: "80%", fontSize: 18,
          color: theme.colors.mutedText.replace("#", ""),
        });
      }
      break;
    case "slide":
      slide.addText(section.title, { x: "5%", y: "5%", w: "90%", fontSize: 28, bold: true });
      slide.addText(
        section.bullets.map(b => ({ text: b, options: { bullet: true } })),
        { x: "5%", y: "20%", w: "90%", fontSize: 16 }
      );
      break;
    case "cards":
      // 每张卡片占一个矩形区域
      section.cards.forEach((card, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
          x: `${5 + col * 31}%`, y: `${20 + row * 35}%`,
          w: "28%", h: "30%",
          fill: { color: theme.colors.surface.replace("#", "") },
          line: { color: theme.colors.primary.replace("#", ""), width: 1 },
        });
        slide.addText(card.title, { ... });
      });
      break;
    // ... 其他 section 类型
  }
}
```

### 预期工期：5–7 天（PDF 依赖 puppeteer 安装配置较复杂）

### 依赖关系

- **依赖 P2.4**（自定义主题需在导出中正确应用）
- **依赖 P2.1**（PPTX 导出时需处理图片引用）
- PDF 导出依赖 `puppeteer` npm 包（服务器需安装 Chromium）

### 风险点与缓解

| 风险 | 影响 | 缓解 |
|------|------|------|
| Puppeteer 在 Docker/Serverless 环境安装困难 | 高 | 提供 `@sparticuz/chromium` 适配；降级为客户端 `html2pdf.js` |
| PDF 分页效果差（section 被截断） | 中 | 在 HTML 中增加 `page-break-inside: avoid` CSS |
| PPTX 反向导出的视觉效果远不如 Web 版 | 中 | 明确标注为"简化导出"，只保证内容完整 |
| pptxgenjs 不支持复杂布局 | 低 | 限制为文本+图片+形状基础组合，不追求 pixel-perfect |
| Chromium 二进制增加部署包大小 ~100MB | 中 | 使用按需下载或外部 Chromium 路径配置 |

---

## P2.6 图表渲染统一

### 目标

统一 `renderChart.tsx`（React 交互式）和 `renderChartStatic.ts`（静态 HTML 导出）的渲染逻辑，减少代码重复，确保交互版和导出版视觉一致。

### 当前状态分析

- `lib/deck/renderChart.tsx`：514 行 React SVG 渲染（bar/line/pie/donut/kpi/table）
- `lib/export/renderChartStatic.ts`：219 行静态 HTML string 渲染（同 6 种图表）
- 两者逻辑高度相似但实现不同（React JSX vs 字符串拼接）
- 颜色调色板 PALETTE 重复定义
- `lib/deck/sections/chart.ts` section 定义中调用 `renderChartStatic`

### 需要创建/修改的文件

| 操作 | 文件 | 说明 |
|------|------|------|
| **新建** | `lib/chart/chartCore.ts` | 共享图表计算逻辑（纯函数） |
| **新建** | `lib/chart/chartTypes.ts` | 图表内部类型定义 |
| **修改** | `lib/deck/renderChart.tsx` | 重构为使用 chartCore |
| **修改** | `lib/export/renderChartStatic.ts` | 重构为使用 chartCore |
| **新建** | `lib/chart/colorPalette.ts` | 统一颜色调色板 |
| **新建** | `lib/__tests__/chartCore.test.ts` | 共享逻辑单元测试 |
| **新建** | `lib/__tests__/chartConsistency.test.ts` | React vs Static 一致性测试 |

### 核心代码结构

```typescript
// lib/chart/chartTypes.ts
export type ChartGeometry = {
  viewBox: { w: number; h: number };
  padding: { t: number; r: number; b: number; l: number };
};

export type BarGeometry = {
  groups: Array<{
    x: number;
    bars: Array<{ x: number; y: number; w: number; h: number; colorIndex: number }>;
    label: string;
  }>;
  gridLines: Array<{ y: number; value: number }>;
  max: number;
};

export type LineGeometry = {
  series: Array<{
    points: Array<{ x: number; y: number }>;
    colorIndex: number;
  }>;
  labels: Array<{ x: number; label: string }>;
  gridLines: Array<{ y: number; value: number }>;
  max: number;
};

export type PieSlice = {
  path: string;     // SVG path d 属性
  colorIndex: number;
  label: string;
  value: number;
  percentage: number;
};
```

```typescript
// lib/chart/chartCore.ts — 纯计算函数，无 UI 依赖

export function resolveYKeys(data: ChartData, config: ChartConfig): string[] {
  // 提取自 renderChart.tsx 和 renderChartStatic.ts 的重复逻辑
  if (config.yKeys?.length) return config.yKeys;
  const xKey = config.xKey ?? data.columns[0];
  return data.columns.filter(c =>
    c !== xKey && data.rows.some(r => Number.isFinite(Number(r[c])))
  );
}

export function computeBarGeometry(
  data: ChartData, config: ChartConfig, geo: ChartGeometry
): BarGeometry {
  // 所有 bar chart 的布局计算
  // 返回每个 bar 的精确坐标和尺寸
}

export function computeLineGeometry(
  data: ChartData, config: ChartConfig, geo: ChartGeometry
): LineGeometry {
  // 折线图坐标计算
}

export function computePieSlices(
  data: ChartData, yKey: string, xKey: string
): PieSlice[] {
  // 饼图扇形路径计算
}

export function computeGridLines(max: number, steps: number): Array<{ y: number; value: number }> {
  // 网格线 Y 坐标计算
}

export const DEFAULT_CHART_GEO: ChartGeometry = {
  viewBox: { w: 640, h: 360 },
  padding: { t: 16, r: 16, b: 44, l: 44 },
};
```

```typescript
// lib/chart/colorPalette.ts
// 唯一的颜色定义，renderChart.tsx 和 renderChartStatic.ts 共用
export const CHART_PALETTE = [
  "var(--deck-accent)",
  "var(--deck-primary)",
  "var(--deck-secondary)",
  "color-mix(in srgb, var(--deck-accent) 60%, var(--deck-primary))",
  "color-mix(in srgb, var(--deck-primary) 60%, var(--deck-secondary))",
  "color-mix(in srgb, var(--deck-secondary) 60%, var(--deck-accent))",
  "color-mix(in srgb, var(--deck-accent) 40%, transparent)",
  "color-mix(in srgb, var(--deck-primary) 40%, transparent)",
];

export const chartColor = (i: number): string =>
  CHART_PALETTE[((i % CHART_PALETTE.length) + CHART_PALETTE.length) % CHART_PALETTE.length];
```

```typescript
// lib/deck/renderChart.tsx — 重构后
import { computeBarGeometry, resolveYKeys, DEFAULT_CHART_GEO, chartColor } from "@/lib/chart";

function BarChart({ data, config }: Props) {
  const yKeys = resolveYKeys(data, config);
  const geo = computeBarGeometry(data, config, DEFAULT_CHART_GEO);

  return (
    <Svg w={geo.viewBox.w} h={geo.viewBox.h}>
      {geo.gridLines.map(gl => (
        <line key={gl.y} y1={gl.y} ... />
      ))}
      {geo.groups.map(group => (
        <g key={group.x}>
          {group.bars.map(bar => (
            <rect x={bar.x} y={bar.y} width={bar.w} height={bar.h}
                  fill={chartColor(bar.colorIndex)} />
          ))}
        </g>
      ))}
    </Svg>
  );
}

// lib/export/renderChartStatic.ts — 重构后
function barChart(data, config, yKeys, xKey): string {
  const geo = computeBarGeometry(data, config, DEFAULT_CHART_GEO);
  const bars = geo.groups.map(group => {
    const rects = group.bars.map(bar =>
      `<rect x="${bar.x}" y="${bar.y}" width="${bar.w}" height="${bar.h}" fill="${chartColor(bar.colorIndex)}"/>`
    ).join("");
    const lbl = `<text x="${group.x}" y="${...}" ...>${esc(group.label)}</text>`;
    return rects + lbl;
  }).join("");
  return `${svgOpen(geo)}${grid(geo)}${bars}</svg>`;
}
```

### 预期工期：2–3 天

### 依赖关系

- **无阻塞依赖**，可最早执行
- 对 P2.5（导出）有益：统一后导出的图表与编辑器一致

### 风险点与缓解

| 风险 | 影响 | 缓解 |
|------|------|------|
| 重构引入视觉回退 | 中 | 写 snapshot 测试，对比重构前后的 SVG 输出 |
| React 组件和静态渲染器对 edge case 处理不同 | 低 | 共享 `resolveYKeys`、`num`、`label` 等工具函数消除差异 |

---

## 执行顺序与并行策略

```
阶段 1（第 1-3 天）— 可全部并行
├── P2.6 图表渲染统一         [2-3天] ← 无依赖，最先做，减少后续冲突
├── P2.1 PPTX 图片提取        [3-4天] ← 无依赖
└── P2.3 多 AI Provider       [3-4天] ← 无依赖

阶段 2（第 3-6 天）— 部分并行
├── P2.4 自定义主题系统        [3-4天] ← 无依赖，可与阶段 1 并行
└── P2.2 异步生成管线          [4-5天] ← 等 P2.3 完成（需支持多 Provider 切换）

阶段 3（第 6-10 天）
└── P2.5 导出增强              [5-7天] ← 等 P2.1 + P2.4 + P2.6 完成
    ├── PDF 导出依赖 Chromium 安装
    ├── PPTX 反向导出依赖 P2.1 的图片处理
    └── 主题应用依赖 P2.4 的自定义主题
```

### 甘特图

```
天数:  1   2   3   4   5   6   7   8   9   10
P2.6:  ████████
P2.1:  ████████████
P2.3:  ████████████
P2.4:  ████████████
P2.2:          ████████████████
P2.5:                  ████████████████████████
```

### 关键路径

**P2.3 → P2.2 → P2.5** 是关键路径（约 12-16 天），决定了 Phase 2 的最短完成时间。

**P2.6 + P2.1 + P2.4** 可在前期并行完成，不阻塞关键路径。

---

## 质量门控

### 每个任务的验证标准

#### P2.1 PPTX 图片提取

| 验证项 | 标准 |
|--------|------|
| 单元测试 | `extractImages.test.ts` — 使用 sample.pptx 验证图片数量、格式、dataUrl 有效性 |
| 集成测试 | 上传含图片的 PPTX → 验证 `project.assets` 非空 |
| 边界测试 | 无图 PPTX、纯 EMF 图片、超大图片（>5MB）、损坏的 rels |
| 回归 | 现有 `parsePptx` 测试不 break（返回类型改为对象需更新调用方） |

#### P2.2 异步生成管线

| 验证项 | 标准 |
|--------|------|
| 单元测试 | `jobQueue.test.ts` — submit/get/cancel 生命周期 |
| 集成测试 | submit → poll → completed 全链路（Mock Provider） |
| 边界测试 | 取消进行中的任务、重复提交、进程重启后恢复 |
| 性能 | Mock Provider 生成延迟 < 100ms |
| 回归 | 旧的同步生成 API（`/generate`）仍可用作快捷路径 |

#### P2.3 多 AI Provider

| 验证项 | 标准 |
|--------|------|
| 单元测试 | 每个 Provider 的 `generateWebDeck` 使用 Mock 返回验证 |
| 集成测试 | `getAIProvider()` 在不同 env 配置下返回正确的 Provider |
| 验证测试 | 各 Provider 输出通过 `validateWebDeckWithZod` |
| 回归 | Anthropic Provider 行为不变 |

#### P2.4 自定义主题系统

| 验证项 | 标准 |
|--------|------|
| 单元测试 | `customThemes.test.ts` — CRUD 操作、schema 验证 |
| 集成测试 | 创建自定义主题 → 应用到 deck → 导出 HTML 验证 CSS vars |
| UI 测试 | ThemeEditor 所有字段可编辑，实时预览更新 |
| 回归 | 内置主题不受影响，`getThemeById` 兼容 |

#### P2.5 导出增强

| 验证项 | 标准 |
|--------|------|
| PDF 单元测试 | 生成 PDF 的 Buffer 非空、页数 > 0 |
| PPTX 单元测试 | 生成的 .pptx 可被 JSZip 解压、含正确的 slide 数量 |
| 集成测试 | 完整 deck → PDF/PPTX 导出 → 文件可打开 |
| 主题一致性 | 导出的 PDF 使用 deck 主题颜色 |
| 回归 | 现有 HTML 导出不受影响 |

#### P2.6 图表渲染统一

| 验证项 | 标准 |
|--------|------|
| 单元测试 | `chartCore.test.ts` — 所有 6 种图表类型的 geometry 计算 |
| 一致性测试 | 对同一数据集，React 版和 Static 版输出的 SVG 路径相同 |
| 回归测试 | 现有 `parseCsv.test.ts` 不 break |
| 视觉验证 | 对比重构前后的 deck 预览截图（手动或 Playwright screenshot） |

### 集成测试策略

```
// 顶层集成测试：全链路
describe("Phase 2 集成", () => {
  test("PPTX 上传 → 图片提取 → AI 生成 → 主题应用 → PDF 导出", async () => {
    // 1. 上传 sample-with-images.pptx
    // 2. 验证 assets 包含提取的图片
    // 3. 异步生成 deck（Mock provider）
    // 4. 应用自定义主题
    // 5. 导出 PDF，验证 buffer 非空
    // 6. 导出 PPTX，验证 slide 数量
    // 7. 导出 HTML，验证主题 CSS vars 正确注入
  });

  test("多 Provider 切换一致性", async () => {
    // 使用相同输入，分别通过 Mock/Anthropic Provider 生成
    // 验证两者都通过 Zod schema 验证
  });

  test("图表渲染一致性", () => {
    // 生成含 chart section 的 deck
    // 分别用 React 和 Static 渲染器输出
    // 对比关键 SVG 元素（rect/polyline/path 数量一致）
  });
});
```

### CI 集成建议

```yaml
# 每个 PR 必须通过
- npm test          # vitest run — 所有单元测试
- npm run build     # next build — TypeScript 编译 + 构建
- npm run lint      # ESLint

# 可选
- npm run test:coverage  # 覆盖率 > 80%
```

---

## 总结

| 任务 | 预期工期 | 复杂度 | 优先级 |
|------|----------|--------|--------|
| P2.6 图表渲染统一 | 2-3 天 | 中 | ⭐⭐⭐ 最先做 |
| P2.1 PPTX 图片提取 | 3-4 天 | 中 | ⭐⭐⭐ |
| P2.3 多 AI Provider | 3-4 天 | 中 | ⭐⭐⭐ |
| P2.4 自定义主题 | 3-4 天 | 中 | ⭐⭐ |
| P2.2 异步生成管线 | 4-5 天 | 高 | ⭐⭐ |
| P2.5 导出增强 | 5-7 天 | 高 | ⭐（最后做） |

**Phase 2 总预计工期：10-16 个工作日**（考虑并行）
