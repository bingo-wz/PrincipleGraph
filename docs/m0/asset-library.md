# M0 系统设计素材库

## 定位

素材库为知识节点提供可复用的视觉身份，不替代节点、流程边或数量模型。首批目录参考用户提供的 Excalidraw 系统设计素材分类，但使用 PrincipleGraph 自有图形实现，不提交来源和许可证尚未确认的原始几何数据。

## 分类与双语目录

| 分类 | 中文 | English | 首批素材 |
|---|---|---|---|
| `client` | 客户端 | Client | Web 应用、移动客户端 |
| `network` | 网络与边缘 | Network & Edge | 云环境、DNS、CDN、负载均衡器 |
| `compute` | 计算与运行时 | Compute & Runtime | 应用服务器、多实例服务 |
| `data` | 数据库与缓存 | Database & Cache | 关系型、文档型、列式、图数据库、缓存 |
| `storage` | 存储 | Storage | 对象存储、冷存储、栈式存储、归档 |
| `messaging` | 消息与流程 | Messaging & Flow | 消息队列、处理管道 |
| `security` | 安全与身份 | Security & Identity | 认证与 IAM |

## 使用规则

1. 内容节点只保存 `assetKey`，例如 `relational-database`；
2. 素材名称和说明必须同时提供 `zh`、`en`；
3. 多实例数量继续由 `Multiplicity` 表达，不能复制素材来伪造真实数量；
4. 同一素材可以同时出现在软件架构图、序列图和逻辑数据流图；
5. 业务专有名称保留在节点上，素材只表达通用组件类型；
6. 引入外部素材包前必须记录作者、来源、许可证和允许的再分发范围。

## M1 扩展

- 素材版本和 deprecated 替代关系；
- 作者端拖拽插入与键盘插入；
- 自定义项目素材与公共素材的命名空间；
- Excalidraw/Figma 导入器和许可证检查；
- 云厂商官方图标包按版本独立维护。

