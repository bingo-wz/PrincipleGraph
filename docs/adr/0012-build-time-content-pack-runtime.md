# ADR-0012：M1 使用构建期 Content Pack 作为唯一内容事实源

- 状态：Accepted
- 日期：2026-07-25

## 背景

M0 原型把 8 个知识页写在 `graph-data.ts`，素材文案写在
`asset-library.tsx`。这种方式可以快速验证交互，但新增页面、节点、边或
素材都需要修改 React/TypeScript，内容审核也无法证明 Schema 校验的文件
就是线上实际渲染的数据。

M1 首要目标是让内容作者只修改结构化内容文件，渲染器、导航、搜索、双链和
统计自动消费同一份数据。

## 决策

### 单一事实源

仓库中的 `prototype/content/packs/*.json` 是可发布内容事实源。每个 Content
Pack 同时包含：

- 空间、场景入口、版本、状态、作者和更新时间；
- 知识页、节点、边、解释、下钻目标、双向引用和官方来源；
- 页面默认图型与布局提示；
- 双语素材目录及 `assetKey`；
- 多实例、线程池、队列和连接池的 `Multiplicity`。

React 组件不得再维护知识页或素材文案副本。

### 构建期加载与编译

M1 使用构建期 JSON import：

1. `content-engine.ts` 加载 Content Pack 并建立页面、素材索引和统计；
2. `graph-data.ts` 把 Schema 模型编译成当前三种渲染器需要的只读视图；
3. 页面入口、导航、搜索、素材库、双链和数量统计均来自该运行时；
4. CI 对仓库内所有 Content Pack 执行 Schema、图语义和发布要求校验。

内容边的 `sequence` 决定当前 MVP 的主链路顺序，`ERROR` 边不参与主链路排序。

## 选择理由

- 内容文件与线上渲染使用同一来源，消除 fixture 与 UI 数据漂移；
- 构建期加载不增加公开 Demo 的数据库、鉴权和运行时网络依赖；
- JSON 可以被 JSON Schema、Git diff、Code Review 和 CI 直接处理；
- 现有渲染器无需理解存储格式，只消费编译后的稳定视图；
- 未来切换到 API 或发布快照时，可保留 Content Pack 和编译边界。

## 备选与取舍

### 继续维护 TypeScript 常量

类型提示直接，但内容作者必须修改代码，Schema 不能成为真实发布门禁，不采用。

### 首次迁移就引入数据库和管理后台

可以运行时发布和编辑，但会提前引入鉴权、修订、数据库迁移与回滚成本。当前只读
M1 先验证内容工作流，不采用。

### 同时支持 YAML 和 JSON

YAML 对长文更友好，但需要额外解析器、错误定位和规范化输出。M1 只支持 JSON；
后续可增加 YAML authoring，再在 CI 中规范化为相同 Content Pack JSON。

### 浏览器运行时请求 Content Pack

可独立更新内容，但增加加载状态、缓存、失败恢复和版本兼容。当前内容随站点版本
发布，使用构建期 import。

## 异常与补偿

- Schema 不合法：CI 阻断构建和发布；
- 入口场景不存在：运行时初始化失败，CI 测试捕获；
- 悬空边、下钻、引用、解释锚点或素材：语义校验阻断发布；
- 出口不可达或下钻成环：语义校验阻断发布；
- 缺少版本、作者、问题、场景假设、图型或唯一主链路说明：发布校验阻断；
- 新内容导致渲染失败：Sites 保留上一生产版本，可回滚到上一发布快照。

## 监控指标

- `content_pack_validation_failure_total{code}`；
- `content_pack_build_total{packVersion,status}`；
- `content_page_render_failure_total{slug}`；
- `broken_reference_total`，正式发布目标为 0；
- `content_pack_pages/nodes/edges/references/assets`；
- 内容变更从 PR 提交到可预览版本的时间。

## 验收

- 8 个现有知识页和 20 个素材全部迁移到仓库 Content Pack；
- `graph-data.ts` 和 `asset-library.tsx` 不再包含具体知识页或素材目录；
- 新增当前内容包内的知识页无需修改 React 渲染代码；
- 入口、导航数量、节点数量、流程边数量和素材数量自动计算；
- 仓库 Content Pack 与正反例共同进入 CI；
- 公开 Demo 保持原有下钻、双链、搜索、数量和三种图型能力。

## 演进

当需要内容独立发布、多人编辑或项目私有知识库时，把同一 Content Pack 导入不可变
修订版与 Publication Snapshot，并将加载器替换为 `/api/v1` 数据源。

