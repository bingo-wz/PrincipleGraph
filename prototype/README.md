# PrincipleGraph M0 Prototype

用于验证分层 Java 原理图谱核心体验的可点击原型。

## 已实现

- 8 个知识页与 72 个主节点；
- 节点聚焦、显式下钻和面包屑；
- 相关知识双向引用与返回来源；
- 页面/节点搜索；
- 默认无横向滚动的蛇形主链路；
- 多实例、多线程、队列和连接池的数量语义；
- 缩放、图例、场景假设和异常分支；
- 桌面与移动端适配。

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
