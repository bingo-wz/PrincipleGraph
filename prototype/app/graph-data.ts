import {
  activeContentRuntime,
  type ContentEdge,
  type ContentNode,
  type ContentPage,
} from "./content-engine";

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
  aliases: string[];
  tags: string[];
  contentPackKey: string;
};

const nodeKindByType: Record<ContentNode["type"], NodeKind> = {
  ENTRY: "entry",
  EXIT: "exit",
  COMPONENT: "component",
  ACTION: "action",
  DATASTORE: "data",
  RUNTIME: "runtime",
  GROUP: "runtime",
  NOTE: "component",
};

function orderNodes(page: ContentPage) {
  const nodeByKey = new Map(page.nodes.map((node) => [node.key, node]));
  const orderedEdges = page.edges
    .filter((edge) => edge.type !== "ERROR")
    .sort(
      (left, right) =>
        (left.sequence ?? Number.MAX_SAFE_INTEGER) -
        (right.sequence ?? Number.MAX_SAFE_INTEGER),
    );
  const orderedKeys = [page.entryNodeKey];

  for (const edge of orderedEdges) {
    if (!orderedKeys.includes(edge.from)) orderedKeys.push(edge.from);
    if (!orderedKeys.includes(edge.to)) orderedKeys.push(edge.to);
  }
  for (const node of page.nodes) {
    if (!orderedKeys.includes(node.key)) orderedKeys.push(node.key);
  }

  return orderedKeys
    .map((key) => nodeByKey.get(key))
    .filter((node): node is ContentNode => Boolean(node));
}

function outgoingEdgeLabel(edges: ContentEdge[], nodeKey: string) {
  return edges
    .filter((edge) => edge.from === nodeKey && edge.type !== "ERROR")
    .sort(
      (left, right) =>
        (left.sequence ?? Number.MAX_SAFE_INTEGER) -
        (right.sequence ?? Number.MAX_SAFE_INTEGER),
    )[0]?.label;
}

function compileNode(node: ContentNode, edges: ContentEdge[]): GraphNode {
  return {
    key: node.key,
    label: node.label,
    kind: nodeKindByType[node.type],
    description: node.subtitle ?? node.label,
    detail: node.description,
    ...(node.assetKey ? { assetKey: node.assetKey } : {}),
    ...(node.multiplicity
      ? {
          multiplicity: {
            ...node.multiplicity,
            mode: node.multiplicity.mode.toLocaleLowerCase() as
              | "exact"
              | "example"
              | "dynamic",
          },
        }
      : {}),
    ...(node.drillTo ? { drillTo: node.drillTo } : {}),
    ...(outgoingEdgeLabel(edges, node.key)
      ? { edgeLabel: outgoingEdgeLabel(edges, node.key) }
      : {}),
  };
}

function compilePage(page: ContentPage): GraphPage {
  const related = (page.references ?? []).map((reference) => {
    const target = activeContentRuntime.pageBySlug.get(reference.targetPage);
    return {
      slug: reference.targetPage,
      label: target?.title ?? reference.targetPage,
      relation: reference.label ?? reference.relation,
    };
  });
  const assumptions = page.explanations
    .filter((explanation) => explanation.kind === "PREREQUISITE")
    .sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0));
  const branches = page.explanations
    .filter(
      (explanation) =>
        explanation.kind === "BRANCH" || explanation.kind === "ERROR",
    )
    .sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0))
    .map((explanation) => explanation.body);

  return {
    slug: page.slug,
    level: `L${page.depthHint ?? 0}`,
    domain: page.domainLabel ?? page.domain,
    diagramType: page.layout?.diagramType ?? "SOFTWARE_ARCHITECTURE",
    title: page.title,
    question: page.question ?? page.summary,
    summary: page.summary,
    assumption:
      page.assumption ??
      assumptions[0]?.body ??
      "本页采用 Content Pack 中声明的默认场景。",
    nodes: orderNodes(page).map((node) => compileNode(node, page.edges)),
    branches,
    related,
    ...(page.sources?.[0]
      ? {
          source: {
            label: page.sources[0].title,
            url: page.sources[0].url,
          },
        }
      : {}),
    aliases: page.aliases ?? [],
    tags: page.tags ?? [],
    contentPackKey: activeContentRuntime.pack.space.key,
  };
}

export const graphPages: GraphPage[] =
  activeContentRuntime.pack.pages.map(compilePage);

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

export const contentPackManifest = {
  spaceName: activeContentRuntime.pack.space.name,
  spaceKey: activeContentRuntime.pack.space.key,
  version: activeContentRuntime.pack.packVersion ?? "未标记",
  status: activeContentRuntime.pack.status ?? "DRAFT",
  updatedAt: activeContentRuntime.pack.updatedAt,
  authors: activeContentRuntime.pack.authors ?? [],
  entryPage: activeContentRuntime.entryPage,
  ...activeContentRuntime.stats,
};
