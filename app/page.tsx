"use client";

import { useMemo, useState } from "react";
import {
  graphPages,
  incomingReferences,
  pagesBySlug,
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

export default function Home() {
  const [currentSlug, setCurrentSlug] = useState("http-request-panorama");
  const [trail, setTrail] = useState<string[]>(["http-request-panorama"]);
  const [selectedKey, setSelectedKey] = useState<string | null>("browser");
  const [origin, setOrigin] = useState<Origin | null>(null);
  const [query, setQuery] = useState("");
  const [zoom, setZoom] = useState(1);
  const [legendOpen, setLegendOpen] = useState(false);

  const page = pagesBySlug.get(currentSlug) ?? graphPages[0];
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
        const pageMatched = `${candidate.title} ${candidate.domain} ${candidate.question}`
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

  const openDirect = (slug: string, nodeKey?: string) => {
    const next = pagesBySlug.get(slug);
    if (!next) return;
    setCurrentSlug(slug);
    setTrail([slug]);
    setOrigin(null);
    setSelectedKey(nodeKey ?? next.nodes[0]?.key ?? null);
    setQuery("");
    setZoom(1);
  };

  const drill = (slug: string) => {
    const next = pagesBySlug.get(slug);
    if (!next) return;
    setCurrentSlug(slug);
    setTrail((current) => [...current, slug]);
    setOrigin(null);
    setSelectedKey(next.nodes[0]?.key ?? null);
    setZoom(1);
  };

  const openReference = (slug: string) => {
    const next = pagesBySlug.get(slug);
    if (!next) return;
    setOrigin({ slug: currentSlug, nodeKey: selectedKey ?? undefined });
    setCurrentSlug(slug);
    setTrail([slug]);
    setSelectedKey(next.nodes[0]?.key ?? null);
    setZoom(1);
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
  };

  const returnToOrigin = () => {
    if (!origin) return;
    const next = pagesBySlug.get(origin.slug);
    setCurrentSlug(origin.slug);
    setTrail([origin.slug]);
    setSelectedKey(origin.nodeKey ?? next?.nodes[0]?.key ?? null);
    setOrigin(null);
    setZoom(1);
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
          onClick={() => openDirect("http-request-panorama")}
          aria-label="返回 HTTP 请求全景"
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

        <div className="top-status">
          <span className="status-dot" />
          <span>内容样板 v0.1</span>
        </div>
      </header>

      <aside className="sidebar">
        <div className="sidebar-heading">
          <span>知识主干</span>
          <small>8 层级页</small>
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
                    {candidate.level} · {candidate.domain}
                  </small>
                </span>
                {active && <span className="nav-active-mark" />}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-note">
          <span>当前样板</span>
          <strong>72 个主节点</strong>
          <small>每页一条完整主链路</small>
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

        <div className="canvas-viewport">
          <div className="paper-grid" />
          <div
            className="flow-canvas"
            key={page.slug}
            style={{ transform: `scale(${zoom})` }}
          >
            <div className="flow-strip">
              {page.nodes.map((node, index) => {
                const active = node.key === selectedKey;
                return (
                  <div className="flow-step" key={node.key}>
                    <button
                      className={`graph-node kind-${node.kind}${active ? " selected" : ""}`}
                      onClick={() => selectNode(node)}
                      onDoubleClick={() => node.drillTo && drill(node.drillTo)}
                      aria-pressed={active}
                    >
                      <span className="node-kind">{kindLabel[node.kind]}</span>
                      <strong>{node.label}</strong>
                      <small>{node.description}</small>
                      {node.drillTo && (
                        <span
                          className="drill-affordance"
                          onClick={(event) => {
                            event.stopPropagation();
                            drill(node.drillTo!);
                          }}
                          role="button"
                          tabIndex={0}
                        >
                          进入原理 ↘
                        </span>
                      )}
                    </button>
                    {index < page.nodes.length - 1 && (
                      <div
                        className={
                          node.kind === "exit"
                            ? "flow-edge return-edge"
                            : "flow-edge"
                        }
                        aria-hidden="true"
                      >
                        <span>{index + 1}</span>
                        <i />
                        <small>{node.edgeLabel ?? "继续"}</small>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

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
          <button onClick={() => setZoom(1)}>适配主链路</button>
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
    </main>
  );
}
