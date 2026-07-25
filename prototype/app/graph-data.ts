export type NodeKind =
  | "entry"
  | "exit"
  | "component"
  | "action"
  | "data"
  | "runtime";

export type DiagramType =
  | "SOFTWARE_ARCHITECTURE"
  | "SEQUENCE"
  | "LOGICAL_DATA_FLOW";

export type Multiplicity = {
  mode: "exact" | "example" | "dynamic";
  value: string;
  unit: string;
  visualCount: number;
  selectedCount?: number;
  note: string;
};

export type GraphNode = {
  key: string;
  label: string;
  kind: NodeKind;
  description: string;
  detail: string;
  assetKey?: string;
  multiplicity?: Multiplicity;
  drillTo?: string;
  edgeLabel?: string;
};

export type GraphPage = {
  slug: string;
  level: string;
  domain: string;
  diagramType: DiagramType;
  title: string;
  question: string;
  summary: string;
  assumption: string;
  nodes: GraphNode[];
  branches: string[];
  related: { slug: string; label: string; relation: string }[];
  source?: { label: string; url: string };
};

export const graphPages: GraphPage[] = [
  {
    slug: "http-request-panorama",
    level: "L0",
    domain: "系统全景",
    diagramType: "SOFTWARE_ARCHITECTURE",
    title: "一次 HTTP 请求全景",
    question: "外部请求如何找到 Java 实例、执行业务并返回？",
    summary:
      "这一层只看系统级路由。沿主链路从浏览器出发，经过边缘组件与服务实例，再沿已有连接返回。",
    assumption:
      "假设动态 HTTPS 请求需要回源；连接可能被 keep-alive 或 HTTP/2 复用。",
    nodes: [
      {
        key: "browser",
        label: "浏览器",
        kind: "entry",
        assetKey: "web-application",
        description: "入口",
        detail: "组装 URL、Header、Cookie 与请求体，然后发送 HTTPS 请求。",
        edgeLabel: "解析域名",
      },
      {
        key: "dns",
        label: "DNS 解析",
        kind: "component",
        assetKey: "dns",
        description: "名称 → 地址",
        detail: "把域名解析为可访问的边缘地址；DNS 不会直接执行 Java Controller。",
        edgeLabel: "连接边缘",
      },
      {
        key: "edge",
        label: "CDN / WAF",
        kind: "component",
        assetKey: "cdn",
        description: "TLS 与安全边界",
        detail: "完成边缘安全检查。本场景假设没有静态命中，请求继续回源。",
        edgeLabel: "动态回源",
      },
      {
        key: "load-balancer",
        label: "负载均衡器",
        kind: "component",
        assetKey: "load-balancer",
        description: "选择 Gateway",
        detail: "从健康的 Gateway 节点中选择一个目标，转发连接或请求。",
        drillTo: "edge-routing-and-discovery",
        edgeLabel: "转发",
      },
      {
        key: "gateway",
        label: "API Gateway",
        kind: "component",
        assetKey: "multi-instance-server",
        description: "路由 · 鉴权 · 限流",
        detail: "把路径匹配到逻辑服务，获取候选实例并选择健康目标。",
        multiplicity: {
          mode: "dynamic",
          value: "G",
          unit: "个 Gateway",
          visualCount: 2,
          selectedCount: 1,
          note: "Gateway 副本数由部署与健康状态动态决定；当前请求只经过其中 1 个实例。",
        },
        drillTo: "edge-routing-and-discovery",
        edgeLabel: "选择实例",
      },
      {
        key: "service",
        label: "Java 服务实例",
        kind: "runtime",
        assetKey: "multi-instance-server",
        description: "容器内运行",
        detail: "请求到达服务器和容器后，由 Servlet 容器接收。",
        multiplicity: {
          mode: "dynamic",
          value: "N",
          unit: "个 Java 实例",
          visualCount: 3,
          selectedCount: 1,
          note: "三个图标仅用于表达多实例；实际副本数是动态 N，本次请求命中其中 1 个。",
        },
        drillTo: "server-container-path",
        edgeLabel: "进入业务",
      },
      {
        key: "business",
        label: "业务与数据访问",
        kind: "action",
        assetKey: "pipeline",
        description: "规则 · 事务 · SQL",
        detail: "Controller 调用应用服务，事务代理包围数据访问。",
        drillTo: "service-business-transaction",
        edgeLabel: "生成结果",
      },
      {
        key: "response-path",
        label: "响应回程",
        kind: "component",
        assetKey: "message-queue",
        description: "沿已有连接返回",
        detail: "响应按代理和连接上下文反向穿过 Gateway 与边缘组件。",
        edgeLabel: "HTTP Response",
      },
      {
        key: "browser-response",
        label: "浏览器收到响应",
        kind: "exit",
        assetKey: "web-application",
        description: "出口",
        detail: "解析状态码、响应 Header 和响应体。",
      },
    ],
    branches: [
      "CDN 静态命中时，可在边缘直接返回。",
      "DNS、TLS、Gateway、服务实例或数据库超时，失败位置和补偿策略不同。",
    ],
    related: [
      {
        slug: "jvm-thread-execution",
        label: "JVM 线程执行",
        relation: "Java 实例最终在线程中运行请求",
      },
      {
        slug: "mysql-query-and-index",
        label: "MySQL 查询与索引",
        relation: "数据访问的底层路径",
      },
    ],
  },
  {
    slug: "edge-routing-and-discovery",
    level: "L1",
    domain: "微服务",
    diagramType: "LOGICAL_DATA_FLOW",
    title: "边缘路由与服务发现",
    question: "Gateway 如何把请求路由到一个健康服务实例？",
    summary:
      "控制面提供候选实例，数据面匹配路由、过滤候选并选择目标。鉴权或限流失败时不会继续选实例。",
    assumption:
      "不绑定 Eureka、Nacos 或 Consul；实例列表允许有短暂缓存。",
    nodes: [
      {
        key: "gateway-ingress",
        label: "Gateway 入站",
        kind: "entry",
        assetKey: "multi-instance-server",
        description: "入口",
        detail: "接收外部负载均衡器转发的 HTTP 请求。",
        edgeLabel: "解析",
      },
      {
        key: "normalize",
        label: "请求规范化",
        kind: "action",
        assetKey: "pipeline",
        description: "Host · Path · Method",
        detail: "解析路由所需的 Host、Path、Method 和关键 Header。",
        edgeLabel: "身份上下文",
      },
      {
        key: "security",
        label: "鉴权",
        kind: "component",
        assetKey: "auth-iam",
        description: "401 / 403 边界",
        detail: "验证身份和权限；失败时直接返回，不进入后续实例选择。",
        edgeLabel: "通过",
      },
      {
        key: "rate-limit",
        label: "限流",
        kind: "component",
        assetKey: "pipeline",
        description: "配额与流量保护",
        detail: "检查租户、用户或路由配额；失败通常返回 429。",
        edgeLabel: "通过",
      },
      {
        key: "route-match",
        label: "路由匹配",
        kind: "action",
        description: "请求 → 服务 ID",
        detail: "把请求特征映射到一个逻辑服务 ID。",
        edgeLabel: "查实例",
      },
      {
        key: "instance-supplier",
        label: "实例列表",
        kind: "data",
        assetKey: "multi-instance-server",
        description: "发现缓存 / 注册中心",
        detail: "从服务发现实现中取得候选 ServiceInstance 列表。",
        multiplicity: {
          mode: "dynamic",
          value: "N",
          unit: "个候选实例",
          visualCount: 4,
          note: "候选数量随注册、下线、健康检查和缓存时效变化，图标数量不代表实时值。",
        },
        edgeLabel: "过滤",
      },
      {
        key: "health-filter",
        label: "健康与元数据过滤",
        kind: "action",
        description: "zone · hint · health",
        detail: "去除不健康或不满足 zone、版本、hint 的实例。",
        edgeLabel: "候选集",
      },
      {
        key: "load-balance",
        label: "负载均衡策略",
        kind: "component",
        assetKey: "load-balancer",
        description: "Round Robin / 权重",
        detail: "从候选集选择一个实例；重试必须考虑请求幂等性。",
        edgeLabel: "重写 URI",
      },
      {
        key: "selected-instance",
        label: "目标实例",
        kind: "exit",
        assetKey: "application-server",
        description: "出口",
        detail: "使用目标地址重写 URI 并建立下游请求。",
        multiplicity: {
          mode: "exact",
          value: "1",
          unit: "个已选实例",
          visualCount: 1,
          selectedCount: 1,
          note: "本页描述一次负载均衡决策，因此主链路只选择 1 个目标实例。",
        },
        drillTo: "server-container-path",
      },
    ],
    branches: [
      "候选实例为空时返回 503，而不是随机选择已下线实例。",
      "实例缓存减少注册中心压力，但会带来短暂陈旧。",
      "重试次数必须与超时预算和请求幂等性共同设计。",
    ],
    related: [
      {
        slug: "http-request-panorama",
        label: "HTTP 请求全景",
        relation: "本页是 Gateway 节点的下层原理",
      },
      {
        slug: "spring-web-request-chain",
        label: "Spring Web 请求链路",
        relation: "目标实例接收请求后的下一段",
      },
    ],
    source: {
      label: "Spring Cloud LoadBalancer",
      url: "https://docs.spring.io/spring-cloud-commons/reference/spring-cloud-commons/loadbalancer.html",
    },
  },
  {
    slug: "server-container-path",
    level: "L1",
    domain: "Linux / Docker",
    diagramType: "SOFTWARE_ARCHITECTURE",
    title: "服务器与 Docker 入站",
    question: "网络包到达宿主机后，怎样进入容器里的 Java 进程？",
    summary:
      "这一页以 Linux + Docker user-defined bridge + 发布端口为前提，沿宿主机网络栈、bridge 和容器 network namespace 进入 JVM socket。",
    assumption:
      "host、overlay 等网络模式走不同路径，应作为场景变体单独表达。",
    nodes: [
      {
        key: "host-nic",
        label: "宿主机网卡",
        kind: "entry",
        assetKey: "server",
        description: "入口",
        detail: "接收发往宿主机地址的网络帧和数据包。",
        edgeLabel: "进入内核",
      },
      {
        key: "linux-stack",
        label: "Linux 网络栈",
        kind: "runtime",
        assetKey: "server",
        description: "IP · TCP",
        detail: "完成 IP、TCP 处理，并进入本机转发/输入决策。",
        edgeLabel: "端口发布规则",
      },
      {
        key: "netfilter",
        label: "Netfilter / NAT",
        kind: "component",
        description: "目标改写与转发",
        detail: "Docker 根据端口发布配置安装网络规则，将流量导向容器。",
        edgeLabel: "桥接",
      },
      {
        key: "bridge",
        label: "Docker bridge",
        kind: "component",
        assetKey: "cloud",
        description: "宿主机软件网桥",
        detail: "连接同一 Docker daemon 上的容器虚拟接口并提供隔离。",
        edgeLabel: "veth",
      },
      {
        key: "host-veth",
        label: "Host veth",
        kind: "component",
        description: "虚拟网卡一端",
        detail: "veth pair 的宿主机一侧连接到 Docker bridge。",
        edgeLabel: "跨 namespace",
      },
      {
        key: "container-netns",
        label: "容器网络命名空间",
        kind: "runtime",
        assetKey: "multi-instance-server",
        description: "隔离网络栈",
        detail: "通过容器侧 veth 进入独立接口、路由和 socket 视图。",
        multiplicity: {
          mode: "dynamic",
          value: "N",
          unit: "个容器副本",
          visualCount: 3,
          selectedCount: 1,
          note: "系统可以有多个容器副本；本层只展开当前请求命中的 1 个容器网络命名空间。",
        },
        edgeLabel: "端口匹配",
      },
      {
        key: "container-port",
        label: "容器监听端口",
        kind: "component",
        description: "例如 8080",
        detail: "容器网络栈把连接匹配到 Java 进程监听的 socket。",
        edgeLabel: "socket 就绪",
      },
      {
        key: "jvm-socket",
        label: "JVM / Tomcat socket",
        kind: "exit",
        assetKey: "application-server",
        description: "出口",
        detail: "连接进入 Tomcat Connector 的处理范围。",
        drillTo: "spring-web-request-chain",
      },
    ],
    branches: [
      "安全组、防火墙或 Netfilter 规则可在进入容器前丢弃流量。",
      "未发布端口默认不能从其他网络直接访问。",
      "host 网络不会经过同样的 bridge/veth 路径。",
    ],
    related: [
      {
        slug: "jvm-thread-execution",
        label: "JVM 线程执行",
        relation: "socket 任务如何在线程中运行",
      },
      {
        slug: "http-request-panorama",
        label: "HTTP 请求全景",
        relation: "本页对应 Java 实例的服务器内部路径",
      },
    ],
    source: {
      label: "Docker bridge network driver",
      url: "https://docs.docker.com/engine/network/drivers/bridge/",
    },
  },
  {
    slug: "spring-web-request-chain",
    level: "L2",
    domain: "Spring MVC",
    diagramType: "SEQUENCE",
    title: "Spring Web 请求链路",
    question: "Tomcat 接收请求后，Spring MVC 如何调用 Controller？",
    summary:
      "Servlet FilterChain 在 Spring MVC 之前运行；DispatcherServlet 再通过 HandlerMapping 与 HandlerAdapter 定位并调用 Controller。",
    assumption: "只描述 Servlet 栈的同步主链路，不混入 WebFlux 或 async dispatch。",
    nodes: [
      {
        key: "connector",
        label: "Tomcat Connector",
        kind: "entry",
        assetKey: "application-server",
        description: "入口",
        detail: "处理客户端连接并解析 HTTP 协议。",
        edgeLabel: "提交任务",
      },
      {
        key: "executor",
        label: "Executor 工作线程",
        kind: "runtime",
        assetKey: "multi-instance-server",
        description: "线程池",
        detail: "Connector 使用内部线程池或共享 Executor 执行请求。",
        multiplicity: {
          mode: "dynamic",
          value: "T",
          unit: "个工作线程",
          visualCount: 4,
          selectedCount: 1,
          note: "线程池包含动态或配置数量的 Worker；当前请求在其中 1 个线程上执行。",
        },
        drillTo: "jvm-thread-execution",
        edgeLabel: "Servlet 调用",
      },
      {
        key: "filter-chain",
        label: "Servlet FilterChain",
        kind: "component",
        assetKey: "pipeline",
        description: "安全 · 日志 · 编码",
        detail: "Filter 可在进入 Spring MVC 前处理或提前终止请求。",
        edgeLabel: "继续链路",
      },
      {
        key: "dispatcher",
        label: "DispatcherServlet",
        kind: "component",
        assetKey: "application-server",
        description: "Front Controller",
        detail: "协调 Handler 查找、调用、返回值处理与异常解析。",
        edgeLabel: "查找 Handler",
      },
      {
        key: "mapping",
        label: "HandlerMapping",
        kind: "action",
        description: "请求 → Handler",
        detail: "根据路径、方法等条件找到 Handler 和拦截器链。",
        edgeLabel: "交给适配器",
      },
      {
        key: "adapter",
        label: "HandlerAdapter",
        kind: "component",
        description: "调用适配",
        detail: "选择支持目标 Handler 的适配器并准备调用。",
        edgeLabel: "解析参数",
      },
      {
        key: "arguments",
        label: "参数解析与校验",
        kind: "action",
        description: "Header · Path · Body",
        detail: "解析方法参数、读取消息体并执行 Bean Validation。",
        edgeLabel: "调用",
      },
      {
        key: "controller",
        label: "Controller 方法",
        kind: "component",
        assetKey: "application-server",
        description: "Web 入口方法",
        detail: "接收应用请求并调用 Service；不应承载复杂业务规则。",
        drillTo: "service-business-transaction",
        edgeLabel: "返回对象",
      },
      {
        key: "return-value",
        label: "返回值与消息转换",
        kind: "action",
        description: "HttpMessageConverter",
        detail: "处理返回值并序列化为响应体。",
        edgeLabel: "退出 Filter",
      },
      {
        key: "response",
        label: "写回响应",
        kind: "exit",
        assetKey: "web-application",
        description: "出口",
        detail: "响应经过拦截器与 Filter 退出路径后写入连接。",
      },
    ],
    branches: [
      "Filter 可以提前写响应，后续 DispatcherServlet 不再执行。",
      "找不到 Handler、参数校验失败或消息转换失败都不会进入正常业务。",
      "Controller 异常可由 HandlerExceptionResolver 转换为错误响应。",
    ],
    related: [
      {
        slug: "server-container-path",
        label: "服务器与 Docker 入站",
        relation: "请求到达 Connector 之前的路径",
      },
      {
        slug: "jvm-thread-execution",
        label: "JVM 线程执行",
        relation: "Executor 工作线程的底层视角",
      },
      {
        slug: "service-business-transaction",
        label: "业务与事务链路",
        relation: "Controller 之后的应用层",
      },
    ],
    source: {
      label: "Spring MVC DispatcherServlet Processing",
      url: "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-servlet/sequence.html",
    },
  },
  {
    slug: "service-business-transaction",
    level: "L2",
    domain: "Spring Transaction",
    diagramType: "LOGICAL_DATA_FLOW",
    title: "业务与事务链路",
    question: "Service 调用中，声明式事务如何包围数据库操作？",
    summary:
      "外部调用先经过 Spring AOP 代理，TransactionInterceptor 使用事务元数据和事务管理器开启或加入事务，再调用业务方法。",
    assumption:
      "命令型同步请求、默认代理模式、PlatformTransactionManager 与关系数据库本地事务。",
    nodes: [
      {
        key: "controller-call",
        label: "Controller 调用 Service",
        kind: "entry",
        assetKey: "application-server",
        description: "入口",
        detail: "从 Web 层进入应用服务公开方法。",
        edgeLabel: "代理拦截",
      },
      {
        key: "proxy",
        label: "Spring AOP 代理",
        kind: "component",
        assetKey: "pipeline",
        description: "方法边界",
        detail: "拦截从代理外部进入的调用；默认代理下内部自调用可能绕过拦截。",
        edgeLabel: "读取元数据",
      },
      {
        key: "interceptor",
        label: "TransactionInterceptor",
        kind: "component",
        assetKey: "pipeline",
        description: "@Transactional",
        detail: "读取传播、隔离、只读和回滚规则。",
        edgeLabel: "事务决策",
      },
      {
        key: "transaction-manager",
        label: "事务管理器",
        kind: "component",
        assetKey: "application-server",
        description: "开启 / 加入事务",
        detail: "根据传播行为创建或加入事务，并把资源绑定到当前线程。",
        edgeLabel: "调用目标",
      },
      {
        key: "business-rule",
        label: "业务规则",
        kind: "action",
        description: "校验 · 计算 · 编排",
        detail: "检查业务状态并编排数据访问。",
        edgeLabel: "访问数据",
      },
      {
        key: "repository",
        label: "Repository / Mapper",
        kind: "component",
        assetKey: "pipeline",
        description: "持久化边界",
        detail: "使用当前事务资源执行 SQL 或 ORM 操作。",
        edgeLabel: "SQL",
      },
      {
        key: "mysql",
        label: "MySQL 操作",
        kind: "data",
        assetKey: "relational-database",
        description: "查询 / 写入",
        detail: "执行 SQL，并受数据库事务与锁语义约束。",
        drillTo: "mysql-query-and-index",
        edgeLabel: "结果 / 异常",
      },
      {
        key: "complete-tx",
        label: "提交或回滚",
        kind: "action",
        description: "结束事务",
        detail: "正常返回时提交；异常是否回滚取决于回滚规则。",
        edgeLabel: "代理返回",
      },
      {
        key: "service-result",
        label: "返回 Controller",
        kind: "exit",
        assetKey: "application-server",
        description: "出口",
        detail: "返回结果或重新抛出异常，由 Web 层生成响应。",
      },
    ],
    branches: [
      "默认代理模式下，同类内部自调用可能让 @Transactional 不生效。",
      "imperative 事务通常绑定当前线程，不会自动传播到新建线程。",
      "Redis cache-aside 不受 MySQL 本地事务原子保护。",
      "默认回滚规则不等于所有 Exception 都回滚。",
    ],
    related: [
      {
        slug: "spring-web-request-chain",
        label: "Spring Web 请求链路",
        relation: "调用 Service 的上层入口",
      },
      {
        slug: "jvm-thread-execution",
        label: "JVM 线程执行",
        relation: "线程绑定事务的运行时基础",
      },
      {
        slug: "mysql-query-and-index",
        label: "MySQL 查询与索引",
        relation: "SQL 的存储引擎路径",
      },
    ],
    source: {
      label: "Spring Declarative Transaction Implementation",
      url: "https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/tx-decl-explained.html",
    },
  },
  {
    slug: "mysql-query-and-index",
    level: "L3",
    domain: "MySQL / InnoDB",
    diagramType: "LOGICAL_DATA_FLOW",
    title: "MySQL 查询与索引",
    question: "普通二级索引查询如何找到 InnoDB 完整行？",
    summary:
      "优化器选择二级索引后，叶子记录给出主键；非覆盖查询再使用主键查聚簇索引。Buffer Pool 未命中时才读取存储页。",
    assumption: "MySQL 8.4、InnoDB、命中二级 B+Tree 的非覆盖查询。",
    nodes: [
      {
        key: "jdbc",
        label: "JDBC 发送 SQL",
        kind: "entry",
        assetKey: "application-server",
        description: "入口",
        detail: "通过已有 MySQL 连接发送参数化 SQL。",
        multiplicity: {
          mode: "dynamic",
          value: "C",
          unit: "条池化连接",
          visualCount: 3,
          selectedCount: 1,
          note: "连接池可维护 C 条连接；当前 SQL 只借用其中 1 条连接并对应 1 个 MySQL Session。",
        },
        edgeLabel: "MySQL Protocol",
      },
      {
        key: "session",
        label: "MySQL Session",
        kind: "runtime",
        assetKey: "relational-database",
        description: "连接上下文",
        detail: "接收命令并保留认证、事务和会话状态。",
        edgeLabel: "解析",
      },
      {
        key: "parse",
        label: "解析与预处理",
        kind: "action",
        description: "语法树 · 对象解析",
        detail: "解析 SQL，解析表和列并完成必要校验。",
        edgeLabel: "候选计划",
      },
      {
        key: "optimizer",
        label: "优化器",
        kind: "component",
        description: "选择访问路径",
        detail: "基于统计信息与代价选择索引、连接顺序和执行方式。",
        edgeLabel: "执行计划",
      },
      {
        key: "executor",
        label: "Executor / Handler",
        kind: "component",
        description: "调用存储引擎",
        detail: "按计划调用 InnoDB 的访问接口。",
        edgeLabel: "查二级索引",
      },
      {
        key: "secondary-index",
        label: "二级索引 B+Tree",
        kind: "data",
        assetKey: "stack-storage",
        description: "索引键 → 主键",
        detail: "沿 B+Tree 定位叶子记录，得到索引列和主键列。",
        edgeLabel: "取得主键",
      },
      {
        key: "primary-key",
        label: "主键值",
        kind: "action",
        description: "回表依据",
        detail: "InnoDB 二级索引记录包含对应行的主键列。",
        edgeLabel: "回表",
      },
      {
        key: "clustered-index",
        label: "聚簇索引",
        kind: "data",
        assetKey: "relational-database",
        description: "主键 → 完整行",
        detail: "非覆盖查询使用主键再次定位保存完整行数据的叶子页。",
        edgeLabel: "访问页面",
      },
      {
        key: "buffer-pool",
        label: "Buffer Pool",
        kind: "runtime",
        assetKey: "cache",
        description: "缓存数据页",
        detail: "页面命中内存时直接读取；未命中才从存储载入。",
        edgeLabel: "结果行",
      },
      {
        key: "result-set",
        label: "结果集返回",
        kind: "exit",
        assetKey: "application-server",
        description: "出口",
        detail: "过滤和投影后，经 MySQL 协议返回应用。",
      },
    ],
    branches: [
      "覆盖索引包含查询所需列时，可以跳过聚簇索引回表。",
      "优化器可能选择其他索引或全表扫描，B+Tree 不是所有 SQL 的固定路径。",
      "Buffer Pool 未命中才触发存储页读取。",
      "长主键会放大所有二级索引记录。",
    ],
    related: [
      {
        slug: "service-business-transaction",
        label: "业务与事务链路",
        relation: "SQL 发起方和事务边界",
      },
      {
        slug: "jvm-thread-execution",
        label: "JVM 线程执行",
        relation: "同步 JDBC 等待会占用工作线程",
      },
      {
        slug: "http-request-panorama",
        label: "HTTP 请求全景",
        relation: "数据库是全景链路的底层分支",
      },
    ],
    source: {
      label: "MySQL 8.4 Clustered and Secondary Indexes",
      url: "https://dev.mysql.com/doc/refman/8.4/en/innodb-index-types.html",
    },
  },
  {
    slug: "jvm-thread-execution",
    level: "L3",
    domain: "JVM",
    diagramType: "SEQUENCE",
    title: "JVM 线程执行",
    question: "Tomcat 工作线程如何在 JVM 中执行同步请求？",
    summary:
      "请求任务从 Executor 队列进入 Worker，在线程自己的 Java 栈上执行解释或 JIT 代码，并在堆上分配对象；同步和 I/O 是条件节点。",
    assumption: "Java 21 平台线程的同步 Servlet 请求；GC 不是每个请求的固定步骤。",
    nodes: [
      {
        key: "queue",
        label: "工作队列",
        kind: "entry",
        assetKey: "message-queue",
        description: "入口",
        detail: "请求任务等待可用 Worker；队列长度构成排队延迟。",
        multiplicity: {
          mode: "dynamic",
          value: "Q",
          unit: "个排队任务",
          visualCount: 4,
          note: "Q 会随并发与处理速度变化；图标表达队列中可能同时存在多个任务。",
        },
        edgeLabel: "Worker 取任务",
      },
      {
        key: "worker",
        label: "Java 工作线程",
        kind: "runtime",
        assetKey: "multi-instance-server",
        description: "Executor Worker",
        detail: "取得任务并开始在当前 Java 线程上执行。",
        multiplicity: {
          mode: "dynamic",
          value: "T",
          unit: "个 Worker",
          visualCount: 4,
          selectedCount: 1,
          note: "线程池中有 T 个 Worker；高亮图标表示当前请求实际占用的 1 个线程。",
        },
        edgeLabel: "方法调用",
      },
      {
        key: "stack",
        label: "Java 栈与栈帧",
        kind: "runtime",
        assetKey: "stack-storage",
        description: "线程私有",
        detail: "保存局部变量、操作数栈、动态链接和返回信息。",
        edgeLabel: "执行",
      },
      {
        key: "compiled-code",
        label: "解释器 / JIT 代码",
        kind: "component",
        description: "字节码或机器码",
        detail: "方法可能被解释执行，也可能运行已经编译优化的机器码。",
        edgeLabel: "创建对象",
      },
      {
        key: "heap",
        label: "堆对象分配",
        kind: "data",
        assetKey: "object-storage",
        description: "DTO · 集合 · 业务对象",
        detail: "请求处理中创建的对象通常在堆上分配，具体路径属于 JVM 实现。",
        edgeLabel: "需要时同步",
      },
      {
        key: "sync",
        label: "同步点",
        kind: "component",
        description: "锁 / volatile",
        detail: "只有代码确实访问同步结构时才进入，不是每个请求固定步骤。",
        drillTo: "synchronized-and-jmm",
        edgeLabel: "继续",
      },
      {
        key: "blocking-io",
        label: "数据库 / 网络等待",
        kind: "runtime",
        assetKey: "relational-database",
        description: "阻塞或 park",
        detail: "同步 I/O 等待期间，平台线程不能处理其他请求任务。",
        edgeLabel: "I/O 完成",
      },
      {
        key: "unwind",
        label: "返回与栈帧退出",
        kind: "action",
        description: "结果 / 异常",
        detail: "结果或异常沿调用栈返回，栈帧依次退出。",
        edgeLabel: "任务结束",
      },
      {
        key: "complete",
        label: "线程归还池",
        kind: "exit",
        assetKey: "multi-instance-server",
        description: "出口",
        detail: "Worker 结束当前任务，继续从队列取得下一个任务。",
      },
    ],
    branches: [
      "队列满或达到线程上限时，需要拒绝、背压或上游限流。",
      "GC 与 safepoint 是运行时事件，不是每个请求固定步骤。",
      "未捕获异常由容器边界处理，Worker 通常继续服务后续任务。",
      "虚拟线程的挂载与卸载需要单独版本页。",
    ],
    related: [
      {
        slug: "spring-web-request-chain",
        label: "Spring Web 请求链路",
        relation: "请求任务的框架级调用路径",
      },
      {
        slug: "service-business-transaction",
        label: "业务与事务链路",
        relation: "线程绑定事务发生在本运行时上下文",
      },
      {
        slug: "synchronized-and-jmm",
        label: "synchronized 与 JMM",
        relation: "同步点的下一层原理",
      },
    ],
  },
  {
    slug: "synchronized-and-jmm",
    level: "L4",
    domain: "Java Concurrency",
    diagramType: "SEQUENCE",
    title: "synchronized 与 JMM",
    question: "进入和退出临界区时，互斥与可见性如何建立？",
    summary:
      "线程获取同一 monitor 后进入临界区，退出时释放；unlock happens-before 后续对同一 monitor 的 lock。",
    assumption:
      "以 Java 语言与 JVM 规范为真相；对象头、快路径和 park 属于 HotSpot 版本实现。",
    nodes: [
      {
        key: "entry",
        label: "到达同步点",
        kind: "entry",
        assetKey: "multi-instance-server",
        description: "入口",
        detail: "求值锁对象，或确定 synchronized 方法对应的 monitor。",
        edgeLabel: "请求 monitor",
      },
      {
        key: "acquire",
        label: "尝试获取 monitor",
        kind: "component",
        assetKey: "auth-iam",
        description: "互斥入口",
        detail: "同一时刻只有持有者可以进入受该 monitor 保护的临界区。",
        edgeLabel: "竞争判断",
      },
      {
        key: "contention",
        label: "无竞争 / 发生竞争",
        kind: "runtime",
        assetKey: "multi-instance-server",
        description: "等待策略是实现细节",
        detail: "竞争线程需要等待；JVM 实现可选择自旋、阻塞或 park。",
        multiplicity: {
          mode: "dynamic",
          value: "K",
          unit: "个竞争线程",
          visualCount: 4,
          selectedCount: 1,
          note: "K 表示同一 monitor 上的动态竞争线程数；高亮线程最终获得 monitor。",
        },
        edgeLabel: "获取成功",
      },
      {
        key: "critical",
        label: "执行临界区",
        kind: "action",
        description: "持有 monitor",
        detail: "持有者执行受保护代码；synchronized 对同一线程可重入。",
        multiplicity: {
          mode: "exact",
          value: "1",
          unit: "个持有线程",
          visualCount: 1,
          selectedCount: 1,
          note: "对同一个 monitor，同一时刻只有 1 个线程持有并执行受保护临界区。",
        },
        edgeLabel: "读写状态",
      },
      {
        key: "shared-state",
        label: "共享状态",
        kind: "data",
        assetKey: "cache",
        description: "一致同步协议",
        detail: "其他线程的相关访问也必须遵守同一同步协议，否则仍可能数据竞争。",
        edgeLabel: "退出",
      },
      {
        key: "release",
        label: "释放 monitor",
        kind: "component",
        assetKey: "auth-iam",
        description: "正常或异常退出",
        detail: "同步块正常完成或抛出异常时都必须释放 monitor。",
        edgeLabel: "内存顺序",
      },
      {
        key: "happens-before",
        label: "建立 happens-before",
        kind: "action",
        description: "可见性保证",
        detail: "对同一 monitor 的 unlock happens-before 后续的 lock。",
        edgeLabel: "唤醒竞争",
      },
      {
        key: "exit",
        label: "后继线程继续",
        kind: "exit",
        assetKey: "multi-instance-server",
        description: "出口",
        detail: "当前线程继续执行，等待者获得后续竞争机会。",
      },
    ],
    branches: [
      "同步块通常使用 monitorenter/monitorexit，同步方法由 ACC_SYNCHRONIZED 表达。",
      "获取锁不会阻止其他线程进行未同步访问。",
      "wait 会释放 monitor，sleep 不会释放 monitor。",
      "偏向锁、锁升级与对象头布局不是 Java 语义保证。",
    ],
    related: [
      {
        slug: "jvm-thread-execution",
        label: "JVM 线程执行",
        relation: "同步点所在的请求运行时路径",
      },
      {
        slug: "spring-web-request-chain",
        label: "Spring Web 请求链路",
        relation: "共享 Bean 可能被多个请求线程并发调用",
      },
      {
        slug: "service-business-transaction",
        label: "业务与事务链路",
        relation: "事务互斥与 Java monitor 不是同一机制",
      },
    ],
    source: {
      label: "JLS 17.4.5 Happens-before Order",
      url: "https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html#jls-17.4.5",
    },
  },
];

export const pagesBySlug = new Map(
  graphPages.map((page) => [page.slug, page]),
);

export const incomingReferences = (slug: string) =>
  graphPages.flatMap((page) =>
    page.related
      .filter((reference) => reference.slug === slug)
      .map((reference) => ({
        slug: page.slug,
        label: page.title,
        relation: reference.relation,
      })),
  );
