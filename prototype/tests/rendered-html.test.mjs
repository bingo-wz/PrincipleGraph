import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const templateRoot = new URL("../", import.meta.url);

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("服务端渲染 PrincipleGraph 首层链路", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>PrincipleGraph · Java 原理链路<\/title>/i);
  assert.match(html, /一次 HTTP 请求全景/);
  assert.match(html, /DNS 解析/);
  assert.match(html, /API Gateway/);
  assert.match(html, /Java 服务实例/);
  assert.match(html, /个 Java 实例/);
  assert.match(html, /素材库/);
  assert.match(html, /软件架构图/);
  assert.match(html, /下一层原理/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/);
  assert.doesNotMatch(html, /react-loading-skeleton/);
});

test("原型保留核心交互与可访问性结构", async () => {
  const [
    page,
    layout,
    css,
    packageJson,
    graphData,
    assetLibrary,
    diagramRenderers,
  ] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../app/graph-data.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/asset-library.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/diagram-renderers.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(layout, /lang="zh-CN"/);
  assert.match(layout, /og-v2\.png/);
  assert.match(page, /aria-label="搜索知识页和节点"/);
  assert.match(page, /aria-label="当前路径"/);
  assert.match(diagramRenderers, /onDoubleClick/);
  assert.match(page, /openReference/);
  assert.match(page, /returnToOrigin/);
  assert.match(page, /DiagramRenderer/);
  assert.match(page, /assetLibraryOpen/);
  assert.match(page, /assetLanguage/);
  assert.match(page, /aria-label="系统设计素材库"/);
  assert.match(page, /aria-label="图型切换"/);
  assert.match(page, /quantity-detail/);
  assert.match(layout, /globals\.css/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /\.diagram-node\.selected/);
  assert.match(
    css,
    /\.canvas-viewport\s*\{[^}]*overflow-x:\s*hidden/s,
  );
  assert.match(css, /\.replica-icons i\.active/);
  assert.match(css, /\.architecture-renderer/);
  assert.match(css, /\.sequence-renderer/);
  assert.match(css, /\.data-flow-renderer/);
  assert.match(css, /\.asset-library-panel/);
  assert.match(css, /\.glyph-database/);
  assert.match(graphData, /synchronized-and-jmm/);
  assert.match(graphData, /multiplicity/);
  assert.match(graphData, /diagramType/);
  assert.match(graphData, /SOFTWARE_ARCHITECTURE/);
  assert.match(graphData, /SEQUENCE/);
  assert.match(graphData, /LOGICAL_DATA_FLOW/);
  assert.match(graphData, /assetKey/);
  assert.match(graphData, /个 Java 实例/);
  assert.match(graphData, /个 Worker/);
  assert.match(assetLibrary, /系统设计素材库|assetCatalog/);
  assert.match(assetLibrary, /Web Application/);
  assert.match(assetLibrary, /Relational Database/);
  assert.match(assetLibrary, /Auth & IAM/);
  assert.match(diagramRenderers, /ArchitectureRenderer/);
  assert.match(diagramRenderers, /SequenceRenderer/);
  assert.match(diagramRenderers, /LogicalDataFlowRenderer/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  assert.doesNotMatch(page, /_sites-preview|SkeletonPreview/);

  await assert.rejects(
    access(new URL("../app/_sites-preview", import.meta.url)),
  );
  await assert.rejects(
    access(new URL("public/_sites-preview", templateRoot)),
  );
});
