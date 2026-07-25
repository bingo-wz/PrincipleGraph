# PrincipleGraph

[![CI](https://github.com/bingo-wz/PrincipleGraph/actions/workflows/ci.yml/badge.svg)](https://github.com/bingo-wz/PrincipleGraph/actions/workflows/ci.yml)

PrincipleGraph 用可下钻、可双链的结构化图谱，解释一个系统或专业知识“从表象到最底层原理”的完整过程。

首个垂直样板面向 Java 工程师：从一次 HTTP 请求进入多实例微服务系统开始，逐层展开到 Linux/Docker、Spring MVC、事务、MySQL、JVM、多线程与 `synchronized`。每一层都包含一条方向明确的完整主链路、与节点对应的解释、返回路径和跨知识点双向引用。

项目目标不止是 Java 面试知识库。稳定的 Content Schema、分层链路和双链模型最终可以用于解释任意项目架构、业务场景或专业知识体系。

> 当前阶段：M0 可点击原型与内容模型验证。欢迎 Java 技术审核、交互反馈和首批贡献者。

## 为什么做 PrincipleGraph

传统文章擅长讲一个知识点，但很难同时回答：

- 这个组件在完整请求中位于哪里？
- 点击进去后，下一层到底经历了什么？
- 多实例、多线程和连接池的“多个”如何直观看见？
- JVM、MySQL、事务和业务架构之间怎样互相引用？
- 如何在不把整张知识图变成“线团”的前提下持续扩展？

PrincipleGraph 把“知识页”作为一个稳定抽象层级：一页只解释一层，一条主链路必须有入口和出口；复杂节点继续下钻，相关知识通过双链跳转。

## 当前能力

- 8 个知识页、72 个主节点和连续 4 层以上下钻路径；
- 默认适配视口的蛇形主链路，不需要横向拖动画布寻找下一步；
- 多实例、多线程、队列和连接池的 `N/T/Q/C/K/1` 数量语义；
- 节点聚焦、说明面板、面包屑、来源返回和双向引用；
- 页面与节点搜索、异常/变体说明；
- Content Schema v1、有效/无效 fixture 和图语义自动校验；
- 生产构建、服务端渲染、交互结构与 ESLint 自动检查。

## 快速开始

要求 Node.js 22.13 或更高版本。

```bash
cd prototype
npm ci
npm run dev
```

访问开发服务器输出的本地地址。

执行全部检查：

```bash
npm run check
```

也可以在 `prototype/` 中分别运行：

```bash
npm run validate:content
npm run lint
npm test
```

## 文档

- [项目上下文](contexts/context.md)
- [五阶段总体规划](docs/project-plan.md)
- [首批 8 个知识页内容大纲](docs/m0/content-outline.md)
- [低保真原型 Brief](docs/m0/prototype-brief.md)
- [5 人可用性测试脚本](docs/m0/usability-test.md)
- [可用性测试记录表](docs/m0/usability-results.csv)
- [技术审核签字表](docs/m0/technical-review.md)
- [架构决策记录](docs/adr)
- [贡献指南](CONTRIBUTING.md)
- [安全政策](SECURITY.md)

## 仓库结构

```text
PrincipleGraph/
├── contexts/                 # 项目愿景与稳定上下文
├── docs/                     # 五阶段规划、M0 设计与 ADR
├── packages/content-schema/  # Content Schema 与校验 fixture
└── prototype/                # 可运行的 M0 Web 原型
```

## 设计原则

- 一页只解释一个抽象层级，但必须包含完整入口和出口；
- 执行流、下钻和相关引用使用不同视觉，不混为一谈；
- 图标数量与真实数量分离，明确固定、示意和动态值；
- 结构化语义是事实源，手绘风格只是表现层；
- 内容先经过 Schema、图语义、技术和教学审核，再进入发布快照；
- GitHub 是主仓库，Sites 仅作为生产部署镜像。

## 参与贡献

现在最需要三类贡献：

1. 复核 Java、Spring、MySQL、JVM 与并发链路的技术正确性；
2. 按测试脚本完成真实用户可用性测试；
3. 提议下一条可验证的知识链路，而不是一次性堆入大量节点。

提交前请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。行为规范见 [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)。

## 许可证

- 源代码使用 [Apache License 2.0](LICENSE)；
- 知识内容与文档使用 [Creative Commons Attribution 4.0](LICENSE-CONTENT.md)。
