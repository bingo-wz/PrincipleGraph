# Changelog

PrincipleGraph 使用语义化版本记录可公开验证的产品能力。日期采用
`YYYY-MM-DD`，尚未发布的变更记录在 `Unreleased`。

## [Unreleased]

### 计划

- 将原型知识页迁移为由 Content Pack 加载和编译的数据驱动内容。

## [0.2.0] - 2026-07-25

### 新增

- 软件架构图、序列图和逻辑数据流图三种可切换渲染器；
- 20 个双语系统设计素材，覆盖 7 个分类；
- 素材搜索、分类筛选、复用统计和反向跳转；
- 多实例、线程池、连接池、队列和竞争线程的数量表达；
- Content Schema 中的图型、素材与数量约束；
- 素材库与多图型渲染策略的架构决策记录。

### 改进

- 主链路使用分区和折返布局，减少横向滚动；
- 更新公开 Demo 的社交分享预览图；
- 扩展内容语义、服务端渲染和可访问性自动检查。

## [0.1.0-m0] - 2026-07-25

### 新增

- 建立 PrincipleGraph 开源项目基线；
- 提供 8 个 Java 原理知识页和首个可点击原型；
- 建立 Content Schema v1、语义校验、CI 与开源治理文件。

[Unreleased]: https://github.com/bingo-wz/PrincipleGraph/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/bingo-wz/PrincipleGraph/compare/v0.1.0-m0...v0.2.0
[0.1.0-m0]: https://github.com/bingo-wz/PrincipleGraph/releases/tag/v0.1.0-m0
