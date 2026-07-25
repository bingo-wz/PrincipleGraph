"use client";

import { useEffect, useMemo, useState } from "react";
import {
  assetCatalog,
  assetCategoryLabels,
  assetsByKey,
  AssetGlyphView,
  type AssetCategory,
  type AssetLanguage,
} from "./asset-library";
import {
  DiagramRenderer,
  diagramTypeLabels,
} from "./diagram-renderers";
import {
  contentPackManifest,
  graphPages,
  incomingReferences,
  pagesBySlug,
  type DiagramType,
  type GraphNode,
} from "./graph-data";

type Origin = {
  slug: string;
  nodeKey?: string;
};

const kindLabel: Record<GraphNode["kind"], string> = {
  entry: "入口",
  exit: "出口",
  component: "组件",
  action: "处理",
  data: "数据",
  runtime: "运行时",
};

const multiplicityModeLabel = {
  exact: "固定数量",
  example: "示意数量",
  dynamic: "动态数量",
} as const;

const supportedDiagramTypes: DiagramType[] = [
  "SOFTWARE_ARCHITECTURE",
  "SEQUENCE",
  "LOGICAL_DATA_FLOW",
];

const assetCategories = Object.keys(assetCategoryLabels) as AssetCategory[];
const initialPage =
  pagesBySlug.get(contentPackManifest.entryPage) ?? graphPages[0];
const initialSlug = initialPage?.slug ?? "";
const initialNodeKey = initialPage?.nodes[0]?.key ?? null;

export default function Home() {
  const [currentSlug, setCurrentSlug] = useState(initialSlug);
  const [trail, setTrail] = useState<string[]>([initialSlug]);
  const [selectedKey, setSelectedKey] = useState<string | null>(
    initialNodeKey,
  );
  const [origin, setOrigin] = useState<Origin | null>(null);
  const [query, setQuery] = useState("");
  const [zoom, setZoom] = useState(1);
  const [legendOpen, setLegendOpen] = useState(false);
  const [viewOverride, setViewOverride] = useState<DiagramType | null>(null);
  const [assetLibraryOpen, setAssetLibraryOpen] = useState(false);
  const [assetLanguage, setAssetLanguage] = useState<AssetLanguage>("zh");
  const [assetCategory, setAssetCategory] = useState<AssetCategory | "all">(
    "all",
  );
  const [assetQuery, setAssetQuery] = useState("");
  const [selectedAssetKey, setSelectedAssetKey] = useState(
    "multi-instance-server",
  );

  const page = pagesBySlug.get(currentSlug) ?? graphPages[0];
  const activeDiagramType = viewOverride ?? page.diagramType;
  const selectedNode =
    page.nodes.find((node) => node.key === selectedKey) ?? null;
  const selectedIndex = selectedNode
    ? page.nodes.findIndex((node) => node.key === selectedNode.key)
    : -1;

  const searchResults = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return [];

    return graphPages
      .flatMap((candidate) => {
        const pageMatched = `${candidate.title} ${candidate.domain} ${candidate.question} ${candidate.aliases.join(" ")} ${candidate.tags.join(" ")}`
          .toLocaleLowerCase()
          .includes(normalized);
        const nodeMatches = candidate.nodes.filter((node) =>
          `${node.label} ${node.description} ${node.detail}`
            .toLocaleLowerCase()
            .includes(normalized),
        );
        if (!pageMatched && nodeMatches.length === 0) return [];
        return [
          {
            page: candidate,
            node: nodeMatches[0],
            matchedBy: pageMatched ? "知识页" : "节点",
          },
        ];
      })
      .slice(0, 6);
  }, [query]);

  const filteredAssets = useMemo(() => {
    const normalized = assetQuery.trim().toLocaleLowerCase();
    return assetCatalog.filter((asset) => {
      const categoryMatched =
        assetCategory === "all" || asset.category === assetCategory;
      const queryMatched =
        normalized.length === 0 ||
        [
          asset.key,
          asset.name.zh,
          asset.name.en,
          asset.description.zh,
          asset.description.en,
          ...asset.aliases,
        ]
          .join(" ")
          .toLocaleLowerCase()
          .includes(normalized);
      return categoryMatched && queryMatched;
    });
  }, [assetCategory, assetQuery]);

  const selectedAsset =
    assetsByKey.get(selectedAssetKey) ?? assetCatalog[0];
  const selectedAssetUsages = useMemo(
    () =>
      graphPages.flatMap((candidate) =>
        candidate.nodes
          .filter((node) => node.assetKey === selectedAssetKey)
          .map((node) => ({ page: candidate, node })),
      ),
    [selectedAssetKey],
  );

  useEffect(() => {
    if (!assetLibraryOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAssetLibraryOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [assetLibraryOpen]);

  const openDirect = (slug: string, nodeKey?: string) => {
    const next = pagesBySlug.get(slug);
    if (!next) return;
    setCurrentSlug(slug);
    setTrail([slug]);
    setOrigin(null);
    setSelectedKey(nodeKey ?? next.nodes[0]?.key ?? null);
    setQuery("");
    setZoom(1);
    setViewOverride(null);
  };

  const drill = (slug: string) => {
    const next = pagesBySlug.get(slug);
    if (!next) return;
    setCurrentSlug(slug);
    setTrail((current) => [...current, slug]);
    setOrigin(null);
    setSelectedKey(next.nodes[0]?.key ?? null);
    setZoom(1);
    setViewOverride(null);
  };

  const openReference = (slug: string) => {
    const next = pagesBySlug.get(slug);
    if (!next) return;
    setOrigin({ slug: currentSlug, nodeKey: selectedKey ?? undefined });
    setCurrentSlug(slug);
    setTrail([slug]);
    setSelectedKey(next.nodes[0]?.key ?? null);
    setZoom(1);
    setViewOverride(null);
  };

  const goBack = () => {
    if (trail.length < 2) return;
    const nextTrail = trail.slice(0, -1);
    const slug = nextTrail[nextTrail.length - 1];
    const next = pagesBySlug.get(slug);
    setTrail(nextTrail);
    setCurrentSlug(slug);
    setSelectedKey(next?.nodes[0]?.key ?? null);
    setZoom(1);
    setViewOverride(null);
  };

  const returnToOrigin = () => {
    if (!origin) return;
    const next = pagesBySlug.get(origin.slug);
    setCurrentSlug(origin.slug);
    setTrail([origin.slug]);
    setSelectedKey(origin.nodeKey ?? next?.nodes[0]?.key ?? null);
    setOrigin(null);
    setZoom(1);
    setViewOverride(null);
  };

  const selectNode = (node: GraphNode) => {
    setSelectedKey(node.key);
  };

  const incoming = incomingReferences(page.slug);
  const previousNode = selectedIndex > 0 ? page.nodes[selectedIndex - 1] : null;
  const nextNode =
    selectedIndex >= 0 && selectedIndex < page.nodes.length - 1
      ? page.nodes[selectedIndex + 1]
      : null;

  return (
    <main className="app-shell">
      <header className="topbar">
        <button
          className="brand"
          onClick={() => openDirect(initialSlug)}
          aria-label={`返回 ${initialPage?.title ?? "入口知识页"}`}
        >
          <span className="brand-mark">P</span>
          <span>
            <strong>PrincipleGraph</strong>
            <small>Java 原理链路</small>
          </span>
        </button>

        <div className="search-wrap">
          <span className="search-icon" aria-hidden="true">
            ⌕
          </span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索 JVM、Spring MVC、索引、synchronized…"
            aria-label="搜索知识页和节点"
          />
          <kbd>⌘ K</kbd>
          {searchResults.length > 0 && (
            <div className="search-results" role="listbox">
              {searchResults.map((result) => (
                <button
                  key={result.page.slug}
                  onClick={() =>
                    openDirect(result.page.slug, result.node?.key)
                  }
                  role="option"
                  aria-selected={false}
                >
                  <span className="result-level">{result.page.level}</span>
                  <span>
                    <strong>{result.page.title}</strong>
                    <small>
                      {result.matchedBy}
                      {result.node ? ` · ${result.node.label}` : ""}
                    </small>
                  </span>
                  <span aria-hidden="true">↗</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="top-tools">
          <button
            className="asset-library-trigger"
            onClick={() => setAssetLibraryOpen(true)}
          >
            <span aria-hidden="true">⌘</span>
            素材库
            <b>{assetCatalog.length}</b>
          </button>
          <div className="top-status">
            <span className="status-dot" />
            <span>Content Pack v{contentPackManifest.version}</span>
          </div>
        </div>
      </header>

      <aside className="sidebar">
        <div className="sidebar-heading">
          <span>知识主干</span>
          <small>{contentPackManifest.pages} 个知识页</small>
        </div>
        <nav aria-label="知识页">
          {graphPages.map((candidate, index) => {
            const active = candidate.slug === page.slug;
            return (
              <button
                key={candidate.slug}
                className={active ? "nav-item active" : "nav-item"}
                onClick={() => openDirect(candidate.slug)}
              >
                <span className="nav-index">{String(index + 1).padStart(2, "0")}</span>
                <span className="nav-copy">
                  <strong>{candidate.title}</strong>
                  <small>
                    {candidate.level} ·{" "}
                    {diagramTypeLabels[candidate.diagramType].zh}
                  </small>
                </span>
                {active && <span className="nav-active-mark" />}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-note">
          <span>当前样板</span>
          <strong>{contentPackManifest.nodes} 个主节点</strong>
          <small>
            {contentPackManifest.edges} 条流程边 · 数据驱动
          </small>
        </div>
      </aside>

      <section className="workspace">
        <div className="workspace-head">
          <div>
            <div className="breadcrumbs" aria-label="当前路径">
              {trail.map((slug, index) => {
                const item = pagesBySlug.get(slug);
                return (
                  <span key={`${slug}-${index}`}>
                    {index > 0 && <i>›</i>}
                    <button
                      onClick={() => {
                        const nextTrail = trail.slice(0, index + 1);
                        setTrail(nextTrail);
                        setCurrentSlug(slug);
                        setSelectedKey(item?.nodes[0]?.key ?? null);
                        setViewOverride(null);
                      }}
                    >
                      {item?.title}
                    </button>
                  </span>
                );
              })}
            </div>
            <div className="page-title-row">
              <span className="level-badge">{page.level}</span>
              <div>
                <h1>{page.title}</h1>
                <p>{page.question}</p>
              </div>
            </div>
            <div className="diagram-switcher" aria-label="图型切换">
              {supportedDiagramTypes.map((type) => (
                <button
                  className={activeDiagramType === type ? "active" : ""}
                  key={type}
                  onClick={() =>
                    setViewOverride(type === page.diagramType ? null : type)
                  }
                  aria-pressed={activeDiagramType === type}
                  title={diagramTypeLabels[type].en}
                >
                  {page.diagramType === type && <i />}
                  {diagramTypeLabels[type].zh}
                </button>
              ))}
            </div>
          </div>
          <div className="workspace-actions">
            <button onClick={goBack} disabled={trail.length < 2}>
              ← 返回上层
            </button>
            <button onClick={() => setSelectedKey(null)}>查看本层说明</button>
          </div>
        </div>

        {origin && (
          <button className="origin-banner" onClick={returnToOrigin}>
            <span>双向引用</span>
            返回来源：{pagesBySlug.get(origin.slug)?.title}
            <b>↩</b>
          </button>
        )}

        <div
          className={`canvas-viewport${zoom > 1 ? " zoomed" : ""}`}
        >
          <div className="paper-grid" />
          <div
            className="flow-canvas"
            key={`${page.slug}-${activeDiagramType}`}
            style={{ transform: `scale(${zoom})` }}
          >
            <div className="diagram-caption">
              <span>{diagramTypeLabels[activeDiagramType].zh}</span>
              <small>{diagramTypeLabels[activeDiagramType].en}</small>
              {viewOverride && viewOverride !== page.diagramType && (
                <b>预览视图</b>
              )}
            </div>
            <DiagramRenderer
              type={activeDiagramType}
              nodes={page.nodes}
              selectedKey={selectedKey}
              onSelect={selectNode}
              onDrill={drill}
            />

            <div className="branch-lane">
              <span className="branch-label">异常 / 变体</span>
              {page.branches.map((branch, index) => (
                <button
                  key={branch}
                  onClick={() => setSelectedKey(null)}
                  className="branch-note"
                >
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  {branch}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="canvas-toolbar">
          <button
            onClick={() => setZoom((value) => Math.max(0.7, value - 0.1))}
            aria-label="缩小画布"
          >
            −
          </button>
          <span>{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom((value) => Math.min(1.2, value + 0.1))}
            aria-label="放大画布"
          >
            +
          </button>
          <i />
          <button onClick={() => setZoom(1)}>适配整页</button>
          <button onClick={() => setLegendOpen((value) => !value)}>
            图例 {legendOpen ? "×" : "?"}
          </button>
          {legendOpen && (
            <div className="legend">
              <span>
                <i className="legend-line" /> 执行流
              </span>
              <span>
                <i className="legend-drill" /> 下钻
              </span>
              <span>
                <i className="legend-error" /> 异常 / 变体
              </span>
              <span>
                <i className="legend-multiplicity">
                  <b />
                  <b />
                  <b />
                </i>
                数量 / 当前落点
              </span>
              <span>
                ↔ 双向引用
              </span>
            </div>
          )}
        </div>
      </section>

      <aside className="inspector">
        {selectedNode ? (
          <div className="inspector-content" key={selectedNode.key}>
            <div className="eyebrow">
              <span>{kindLabel[selectedNode.kind]}</span>
              <small>
                {selectedIndex + 1} / {page.nodes.length}
              </small>
            </div>
            <h2>{selectedNode.label}</h2>
            <p className="lead">{selectedNode.detail}</p>

            {selectedNode.assetKey && assetsByKey.has(selectedNode.assetKey) && (
              <button
                className="node-asset-reference"
                onClick={() => {
                  setSelectedAssetKey(selectedNode.assetKey!);
                  setAssetLibraryOpen(true);
                }}
              >
                <AssetGlyphView
                  assetKey={selectedNode.assetKey}
                  label={selectedNode.label}
                  compact
                />
                <span>
                  <small>复用素材</small>
                  <strong>
                    {assetsByKey.get(selectedNode.assetKey)?.name.zh}
                  </strong>
                </span>
                <b>查看 ↗</b>
              </button>
            )}

            {selectedNode.multiplicity && (
              <div className="quantity-detail">
                <span>
                  {multiplicityModeLabel[selectedNode.multiplicity.mode]}
                </span>
                <strong>
                  {selectedNode.multiplicity.value}
                  {selectedNode.multiplicity.unit}
                </strong>
                <p>{selectedNode.multiplicity.note}</p>
              </div>
            )}

            <dl className="neighbors">
              <div>
                <dt>上一步</dt>
                <dd>{previousNode?.label ?? "本层入口"}</dd>
              </div>
              <div>
                <dt>下一步</dt>
                <dd>{nextNode?.label ?? "本层出口"}</dd>
              </div>
            </dl>

            {selectedNode.drillTo && (
              <button
                className="primary-action"
                onClick={() => drill(selectedNode.drillTo!)}
              >
                进入下一层
                <span>{pagesBySlug.get(selectedNode.drillTo)?.title} ↘</span>
              </button>
            )}

            <div className="inspector-section">
              <h3>相关知识</h3>
              {page.related.map((reference) => (
                <button
                  className="reference-row"
                  key={reference.slug}
                  onClick={() => openReference(reference.slug)}
                >
                  <span>↔</span>
                  <span>
                    <strong>{reference.label}</strong>
                    <small>{reference.relation}</small>
                  </span>
                  <b>↗</b>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="inspector-content page-overview">
            <div className="eyebrow">
              <span>本层说明</span>
              <small>{page.domain}</small>
            </div>
            <h2>{page.title}</h2>
            <p className="lead">{page.summary}</p>

            <div className="assumption">
              <span>场景假设</span>
              <p>{page.assumption}</p>
            </div>

            <div className="inspector-section">
              <h3>引用此页</h3>
              {incoming.length > 0 ? (
                incoming.map((reference) => (
                  <button
                    className="reference-row"
                    key={reference.slug}
                    onClick={() => openReference(reference.slug)}
                  >
                    <span>←</span>
                    <span>
                      <strong>{reference.label}</strong>
                      <small>{reference.relation}</small>
                    </span>
                    <b>↗</b>
                  </button>
                ))
              ) : (
                <p className="empty-copy">当前没有上游引用。</p>
              )}
            </div>

            {page.source && (
              <a
                className="source-link"
                href={page.source.url}
                target="_blank"
                rel="noreferrer"
              >
                官方依据 · {page.source.label} ↗
              </a>
            )}
          </div>
        )}
      </aside>

      {assetLibraryOpen && (
        <div
          className="asset-library-layer"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setAssetLibraryOpen(false);
            }
          }}
        >
          <section
            className="asset-library-panel"
            role="dialog"
            aria-modal="true"
            aria-label="系统设计素材库"
          >
            <header className="asset-library-head">
              <div>
                <span>Reusable system assets</span>
                <h2>系统设计素材库</h2>
                <p>
                  统一素材键、双语名称与分类，在不同知识页和图型之间复用。
                </p>
              </div>
              <div className="asset-library-head-actions">
                <div className="language-switch" aria-label="素材语言">
                  <button
                    className={assetLanguage === "zh" ? "active" : ""}
                    onClick={() => setAssetLanguage("zh")}
                    aria-pressed={assetLanguage === "zh"}
                  >
                    中文
                  </button>
                  <button
                    className={assetLanguage === "en" ? "active" : ""}
                    onClick={() => setAssetLanguage("en")}
                    aria-pressed={assetLanguage === "en"}
                  >
                    EN
                  </button>
                </div>
                <button
                  className="asset-library-close"
                  onClick={() => setAssetLibraryOpen(false)}
                  aria-label="关闭素材库"
                >
                  ×
                </button>
              </div>
            </header>

            <div className="asset-library-controls">
              <label>
                <span aria-hidden="true">⌕</span>
                <input
                  value={assetQuery}
                  onChange={(event) => setAssetQuery(event.target.value)}
                  placeholder={
                    assetLanguage === "zh"
                      ? "搜索 DNS、数据库、队列…"
                      : "Search DNS, database, queue…"
                  }
                  aria-label="搜索素材"
                />
              </label>
              <div className="asset-category-tabs" aria-label="素材分类">
                <button
                  className={assetCategory === "all" ? "active" : ""}
                  onClick={() => setAssetCategory("all")}
                >
                  {assetLanguage === "zh" ? "全部" : "All"}
                </button>
                {assetCategories.map((category) => (
                  <button
                    className={assetCategory === category ? "active" : ""}
                    key={category}
                    onClick={() => setAssetCategory(category)}
                  >
                    {assetCategoryLabels[category][assetLanguage]}
                  </button>
                ))}
              </div>
            </div>

            <div className="asset-library-content">
              <div className="asset-grid" aria-label="素材列表">
                {filteredAssets.map((asset) => {
                  const usageCount = graphPages.reduce(
                    (count, candidate) =>
                      count +
                      candidate.nodes.filter(
                        (node) => node.assetKey === asset.key,
                      ).length,
                    0,
                  );
                  return (
                    <button
                      className={
                        selectedAssetKey === asset.key
                          ? "asset-card selected"
                          : "asset-card"
                      }
                      key={asset.key}
                      onClick={() => setSelectedAssetKey(asset.key)}
                      aria-pressed={selectedAssetKey === asset.key}
                    >
                      <AssetGlyphView
                        assetKey={asset.key}
                        label={asset.name[assetLanguage]}
                      />
                      <span>
                        <strong>{asset.name[assetLanguage]}</strong>
                        <small>
                          {assetCategoryLabels[asset.category][assetLanguage]}
                        </small>
                      </span>
                      <b>{usageCount}</b>
                    </button>
                  );
                })}
                {filteredAssets.length === 0 && (
                  <p className="asset-empty">没有匹配的素材。</p>
                )}
              </div>

              <aside className="asset-detail">
                <AssetGlyphView
                  assetKey={selectedAsset.key}
                  label={selectedAsset.name[assetLanguage]}
                />
                <span className="asset-detail-category">
                  {assetCategoryLabels[selectedAsset.category][assetLanguage]}
                </span>
                <h3>{selectedAsset.name[assetLanguage]}</h3>
                <small>{selectedAsset.name[assetLanguage === "zh" ? "en" : "zh"]}</small>
                <p>{selectedAsset.description[assetLanguage]}</p>
                <code>{selectedAsset.key}</code>
                <div className="asset-tags">
                  {selectedAsset.aliases.slice(0, 5).map((alias) => (
                    <span key={alias}>{alias}</span>
                  ))}
                </div>
                <div className="asset-usage">
                  <strong>
                    {assetLanguage === "zh" ? "已复用位置" : "Used in"}
                    <b>{selectedAssetUsages.length}</b>
                  </strong>
                  {selectedAssetUsages.slice(0, 5).map((usage) => (
                    <button
                      key={`${usage.page.slug}-${usage.node.key}`}
                      onClick={() => {
                        openDirect(usage.page.slug, usage.node.key);
                        setAssetLibraryOpen(false);
                      }}
                    >
                      <span>{usage.page.level}</span>
                      <span>
                        <strong>{usage.node.label}</strong>
                        <small>{usage.page.title}</small>
                      </span>
                      <b>↗</b>
                    </button>
                  ))}
                  {selectedAssetUsages.length === 0 && (
                    <p>该素材已入库，等待首个知识节点引用。</p>
                  )}
                </div>
              </aside>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
