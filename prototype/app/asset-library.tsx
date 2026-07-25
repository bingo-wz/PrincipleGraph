import { activeContentRuntime, type ContentAsset } from "./content-engine";

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

const categoryByContentType: Record<
  ContentAsset["category"],
  AssetCategory
> = {
  CLIENT: "client",
  NETWORK: "network",
  COMPUTE: "compute",
  DATA: "data",
  STORAGE: "storage",
  MESSAGING: "messaging",
  SECURITY: "security",
};

const supportedGlyphs = new Set<AssetGlyph>([
  "web",
  "mobile",
  "cloud",
  "dns",
  "cdn",
  "load-balancer",
  "server",
  "multi-server",
  "database",
  "document-db",
  "graph-db",
  "cache",
  "object-storage",
  "archive",
  "queue",
  "pipeline",
  "auth",
]);

function normalizeGlyph(glyphKey: string): AssetGlyph {
  return supportedGlyphs.has(glyphKey as AssetGlyph)
    ? (glyphKey as AssetGlyph)
    : "server";
}

export const assetCatalog: AssetDefinition[] = (
  activeContentRuntime.pack.assetLibrary ?? []
).map((asset) => ({
  key: asset.key,
  category: categoryByContentType[asset.category],
  glyph: normalizeGlyph(asset.glyphKey),
  name: asset.name,
  description: asset.description,
  aliases: asset.aliases ?? [],
}));

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
  const fallback = assetCatalog[0];
  const asset = assetsByKey.get(assetKey ?? "") ?? fallback;

  if (!asset) return null;

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

