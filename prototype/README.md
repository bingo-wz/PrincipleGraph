# PrincipleGraph M1 Prototype

由 Content Pack 驱动的分层 Java 原理图谱原型。

## 已实现

- 8 个知识页与 72 个主节点；
- 节点聚焦、显式下钻和面包屑；
- 相关知识双向引用与返回来源；
- 页面/节点搜索；
- 默认无横向滚动的蛇形主链路；
- 多实例、多线程、队列和连接池的数量语义；
- 缩放、图例、场景假设和异常分支；
- 桌面与移动端适配。
- 页面、边、解释、双链、素材与数量全部从
  `content/packs/java-http-request.json` 加载；
- Content Pack Schema、图语义和发布要求自动校验。

## 新增知识页

在 `content/packs/java-http-request.json` 的 `pages` 中新增结构化页面，并从
上层节点配置 `drillTo`。导航、搜索、双链和统计会自动更新，不需要修改 React
渲染代码。

## 本地运行

```bash
npm install
npm run dev
```

## 验证

```bash
npm run validate:content
npm run lint
npm test
```
