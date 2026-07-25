import javaHttpRequestPack from "../content/packs/java-http-request.json";

export type ContentDiagramType =
  | "SOFTWARE_ARCHITECTURE"
  | "SEQUENCE"
  | "LOGICAL_DATA_FLOW";

export type ContentNodeType =
  | "ENTRY"
  | "EXIT"
  | "COMPONENT"
  | "ACTION"
  | "DATASTORE"
  | "RUNTIME"
  | "GROUP"
  | "NOTE";

export type ContentMultiplicity = {
  mode: "EXACT" | "EXAMPLE" | "DYNAMIC";
  value: string;
  unit: string;
  visualCount: number;
  selectedCount?: number;
  note: string;
};

export type ContentNode = {
  key: string;
  type: ContentNodeType;
  label: string;
  subtitle?: string;
  description: string;
  assetKey?: string;
  multiplicity?: ContentMultiplicity;
  drillTo?: string;
  tags?: string[];
};

export type ContentEdge = {
  key: string;
  from: string;
  to: string;
  type: "SYNC" | "ASYNC" | "DATA" | "ERROR" | "RETURN";
  label?: string;
  sequence?: number;
  condition?: string;
};

export type ContentExplanation = {
  key: string;
  kind:
    | "OVERVIEW"
    | "MAIN_FLOW"
    | "BRANCH"
    | "ERROR"
    | "PREREQUISITE"
    | "VERSION_NOTE";
  anchorType: "PAGE" | "NODE" | "EDGE";
  anchorKey?: string;
  title: string;
  body: string;
  sortOrder?: number;
};

export type ContentReference = {
  sourceAnchorType: "PAGE" | "NODE" | "EDGE";
  sourceAnchorKey?: string;
  targetPage: string;
  targetAnchorKey?: string;
  relation:
    | "RELATED"
    | "DEPENDS_ON"
    | "CONTRASTS"
    | "USED_BY"
    | "PREREQUISITE";
  label?: string;
};

export type ContentPage = {
  slug: string;
  title: string;
  question?: string;
  summary: string;
  assumption?: string;
  domain: string;
  domainLabel?: string;
  depthHint?: number;
  aliases?: string[];
  tags?: string[];
  entryNodeKey: string;
  exitNodeKeys: string[];
  layout?: {
    diagramType: ContentDiagramType;
    direction: "RIGHT" | "DOWN";
    engine?: "MANUAL" | "ELK";
    nodeSpacing?: number;
    layerSpacing?: number;
    viewportMode?: "FIT_VIEWPORT" | "FREE_CANVAS";
    maxColumns?: number;
  };
  nodes: ContentNode[];
  edges: ContentEdge[];
  explanations: ContentExplanation[];
  references?: ContentReference[];
  sources?: {
    title: string;
    url: string;
    accessedOn: string;
  }[];
};

export type ContentAsset = {
  key: string;
  category:
    | "CLIENT"
    | "NETWORK"
    | "COMPUTE"
    | "DATA"
    | "STORAGE"
    | "MESSAGING"
    | "SECURITY";
  glyphKey: string;
  name: { zh: string; en: string };
  description: { zh: string; en: string };
  aliases?: string[];
};

export type ContentPack = {
  schemaVersion: 1;
  packVersion?: string;
  status?: "DRAFT" | "IN_REVIEW" | "PUBLISHED" | "DEPRECATED";
  updatedAt?: string;
  authors?: string[];
  space: {
    key: string;
    name: string;
    type: "PUBLIC_LIBRARY" | "PROJECT";
  };
  scenarios: {
    key: string;
    title: string;
    summary: string;
    type: "LEARNING" | "BUSINESS" | "INCIDENT";
    entryPage: string;
    sortOrder: number;
    context?: Record<string, string | number | boolean>;
  }[];
  assetLibrary?: ContentAsset[];
  pages: ContentPage[];
};

export type ContentPackRuntime = {
  pack: ContentPack;
  pageBySlug: Map<string, ContentPage>;
  assetByKey: Map<string, ContentAsset>;
  entryPage: string;
  stats: {
    pages: number;
    nodes: number;
    edges: number;
    references: number;
    assets: number;
  };
};

export function createContentPackRuntime(pack: ContentPack): ContentPackRuntime {
  const pageBySlug = new Map(pack.pages.map((page) => [page.slug, page]));
  const assetByKey = new Map(
    (pack.assetLibrary ?? []).map((asset) => [asset.key, asset]),
  );
  const firstScenario = [...pack.scenarios].sort(
    (left, right) => left.sortOrder - right.sortOrder,
  )[0];

  if (!firstScenario || !pageBySlug.has(firstScenario.entryPage)) {
    throw new Error("Content Pack 缺少可访问的入口场景");
  }

  return {
    pack,
    pageBySlug,
    assetByKey,
    entryPage: firstScenario.entryPage,
    stats: {
      pages: pack.pages.length,
      nodes: pack.pages.reduce((count, page) => count + page.nodes.length, 0),
      edges: pack.pages.reduce((count, page) => count + page.edges.length, 0),
      references: pack.pages.reduce(
        (count, page) => count + (page.references?.length ?? 0),
        0,
      ),
      assets: pack.assetLibrary?.length ?? 0,
    },
  };
}

export const activeContentRuntime = createContentPackRuntime(
  javaHttpRequestPack as ContentPack,
);
