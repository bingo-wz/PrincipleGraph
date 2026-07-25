export type AssetLanguage = "zh" | "en";

export type AssetCategory =
  | "client"
  | "network"
  | "compute"
  | "data"
  | "storage"
  | "messaging"
  | "security";

export type AssetGlyph =
  | "web"
  | "mobile"
  | "cloud"
  | "dns"
  | "cdn"
  | "load-balancer"
  | "server"
  | "multi-server"
  | "database"
  | "document-db"
  | "graph-db"
  | "cache"
  | "object-storage"
  | "archive"
  | "queue"
  | "pipeline"
  | "auth";

export type AssetDefinition = {
  key: string;
  category: AssetCategory;
  glyph: AssetGlyph;
  name: {
    zh: string;
    en: string;
  };
  description: {
    zh: string;
    en: string;
  };
  aliases: string[];
};

export const assetCategoryLabels: Record<
  AssetCategory,
  { zh: string; en: string }
> = {
  client: { zh: "客户端", en: "Client" },
  network: { zh: "网络与边缘", en: "Network & Edge" },
  compute: { zh: "计算与运行时", en: "Compute & Runtime" },
  data: { zh: "数据库与缓存", en: "Database & Cache" },
  storage: { zh: "存储", en: "Storage" },
  messaging: { zh: "消息与流程", en: "Messaging & Flow" },
  security: { zh: "安全与身份", en: "Security & Identity" },
};

export const assetCatalog: AssetDefinition[] = [
  {
    key: "web-application",
    category: "client",
    glyph: "web",
    name: { zh: "Web 应用", en: "Web Application" },
    description: {
      zh: "浏览器或 Web 前端入口。",
      en: "Browser or web frontend entry point.",
    },
    aliases: ["browser", "frontend", "web", "浏览器", "前端"],
  },
  {
    key: "mobile-client",
    category: "client",
    glyph: "mobile",
    name: { zh: "移动客户端", en: "Mobile Client" },
    description: {
      zh: "iOS、Android 或小程序客户端。",
      en: "iOS, Android, or mini-app client.",
    },
    aliases: ["mobile", "phone", "app", "移动端", "手机"],
  },
  {
    key: "cloud",
    category: "network",
    glyph: "cloud",
    name: { zh: "云环境", en: "Cloud" },
    description: {
      zh: "云平台、外部网络或受管边界。",
      en: "Cloud platform, external network, or managed boundary.",
    },
    aliases: ["cloud", "internet", "云", "公网"],
  },
  {
    key: "dns",
    category: "network",
    glyph: "dns",
    name: { zh: "DNS 服务", en: "DNS Service" },
    description: {
      zh: "将域名解析为网络地址。",
      en: "Resolves domain names to network addresses.",
    },
    aliases: ["dns", "domain", "域名", "解析"],
  },
  {
    key: "cdn",
    category: "network",
    glyph: "cdn",
    name: { zh: "CDN / 边缘节点", en: "CDN / Edge" },
    description: {
      zh: "边缘缓存、TLS 终止和安全防护。",
      en: "Edge caching, TLS termination, and protection.",
    },
    aliases: ["cdn", "edge", "waf", "边缘", "缓存"],
  },
  {
    key: "load-balancer",
    category: "network",
    glyph: "load-balancer",
    name: { zh: "负载均衡器", en: "Load Balancer" },
    description: {
      zh: "在多个健康目标之间分配请求。",
      en: "Distributes requests across healthy targets.",
    },
    aliases: ["lb", "load balancer", "负载均衡", "流量"],
  },
  {
    key: "application-server",
    category: "compute",
    glyph: "server",
    name: { zh: "应用服务器", en: "Application Server" },
    description: {
      zh: "承载应用进程、容器或服务实例。",
      en: "Hosts an application process, container, or service instance.",
    },
    aliases: ["server", "service", "java", "tomcat", "服务器", "服务"],
  },
  {
    key: "multi-instance-server",
    category: "compute",
    glyph: "multi-server",
    name: { zh: "多实例服务", en: "Multi-instance Service" },
    description: {
      zh: "表示同一服务的多个副本，实际数量由 Multiplicity 决定。",
      en: "Represents replicas of one service; Multiplicity carries the count.",
    },
    aliases: ["replica", "cluster", "instance", "集群", "实例", "副本"],
  },
  {
    key: "relational-database",
    category: "data",
    glyph: "database",
    name: { zh: "关系型数据库", en: "Relational Database" },
    description: {
      zh: "使用表、行、约束和事务组织数据。",
      en: "Organizes data with tables, rows, constraints, and transactions.",
    },
    aliases: ["mysql", "postgresql", "sql", "rdbms", "关系数据库"],
  },
  {
    key: "document-database",
    category: "data",
    glyph: "document-db",
    name: { zh: "文档数据库", en: "Document Database" },
    description: {
      zh: "以 JSON 或文档结构保存聚合数据。",
      en: "Stores aggregate data as JSON-like documents.",
    },
    aliases: ["mongodb", "document", "json", "文档数据库"],
  },
  {
    key: "columnar-database",
    category: "data",
    glyph: "database",
    name: { zh: "列式数据库", en: "Columnar Database" },
    description: {
      zh: "按列组织分析型数据。",
      en: "Stores analytical data by column.",
    },
    aliases: ["column", "olap", "clickhouse", "列存"],
  },
  {
    key: "graph-database",
    category: "data",
    glyph: "graph-db",
    name: { zh: "图数据库", en: "Graph Database" },
    description: {
      zh: "以节点和关系表达高连接度数据。",
      en: "Models highly connected data as nodes and relationships.",
    },
    aliases: ["graph", "neo4j", "图数据库", "关系"],
  },
  {
    key: "cache",
    category: "data",
    glyph: "cache",
    name: { zh: "缓存", en: "Cache" },
    description: {
      zh: "保存热点键值或中间结果。",
      en: "Stores hot key-value data or intermediate results.",
    },
    aliases: ["redis", "cache", "kv", "缓存", "键值"],
  },
  {
    key: "object-storage",
    category: "storage",
    glyph: "object-storage",
    name: { zh: "对象存储", en: "Object Storage" },
    description: {
      zh: "按对象与 Key 保存文件和大对象。",
      en: "Stores files and blobs as keyed objects.",
    },
    aliases: ["s3", "r2", "oss", "blob", "对象存储"],
  },
  {
    key: "cold-storage",
    category: "storage",
    glyph: "archive",
    name: { zh: "冷存储", en: "Cold Storage" },
    description: {
      zh: "低频访问、较长恢复时间的归档介质。",
      en: "Archive medium for infrequent access and slower retrieval.",
    },
    aliases: ["cold", "glacier", "冷存储", "归档"],
  },
  {
    key: "stack-storage",
    category: "storage",
    glyph: "archive",
    name: { zh: "栈式存储", en: "Stack Storage" },
    description: {
      zh: "用于表达栈帧、分层页面或顺序数据。",
      en: "Represents stack frames, layered pages, or ordered data.",
    },
    aliases: ["stack", "page", "栈", "栈帧", "页面"],
  },
  {
    key: "archive",
    category: "storage",
    glyph: "archive",
    name: { zh: "归档", en: "Archive" },
    description: {
      zh: "长期保存的历史文件或快照。",
      en: "Long-term historical files or snapshots.",
    },
    aliases: ["archive", "snapshot", "归档", "快照"],
  },
  {
    key: "message-queue",
    category: "messaging",
    glyph: "queue",
    name: { zh: "消息队列", en: "Message Queue" },
    description: {
      zh: "缓冲、解耦并异步传递消息。",
      en: "Buffers, decouples, and asynchronously delivers messages.",
    },
    aliases: ["mq", "kafka", "rabbitmq", "queue", "消息队列"],
  },
  {
    key: "pipeline",
    category: "messaging",
    glyph: "pipeline",
    name: { zh: "处理管道", en: "Pipeline" },
    description: {
      zh: "串联过滤、转换或构建步骤。",
      en: "Chains filtering, transformation, or build stages.",
    },
    aliases: ["pipeline", "filter", "chain", "管道", "过滤器链"],
  },
  {
    key: "auth-iam",
    category: "security",
    glyph: "auth",
    name: { zh: "认证与 IAM", en: "Auth & IAM" },
    description: {
      zh: "身份认证、授权和访问控制边界。",
      en: "Authentication, authorization, and access-control boundary.",
    },
    aliases: ["auth", "iam", "security", "鉴权", "认证", "授权"],
  },
];

export const assetsByKey = new Map(
  assetCatalog.map((asset) => [asset.key, asset]),
);

export function AssetGlyphView({
  assetKey,
  label,
  compact = false,
}: {
  assetKey?: string;
  label?: string;
  compact?: boolean;
}) {
  const asset = assetsByKey.get(assetKey ?? "") ?? assetCatalog[6];
  const monogram =
    asset.glyph === "dns"
      ? "DNS"
      : asset.glyph === "cdn"
        ? "CDN"
        : asset.glyph === "database"
          ? "DB"
          : asset.glyph === "document-db"
            ? "{ }"
            : asset.glyph === "cache"
              ? "KV"
              : "";

  return (
    <span
      className={`asset-glyph glyph-${asset.glyph}${compact ? " compact" : ""}`}
      aria-label={label ?? asset.name.zh}
      role="img"
    >
      <span className="glyph-shape" aria-hidden="true">
        <i />
        <i />
        <i />
        <b>{monogram}</b>
      </span>
    </span>
  );
}

