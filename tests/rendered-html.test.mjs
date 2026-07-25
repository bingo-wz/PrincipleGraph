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
  assert.match(html, /进入原理/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/);
  assert.doesNotMatch(html, /react-loading-skeleton/);
});

test("原型保留核心交互与可访问性结构", async () => {
  const [page, layout, css, packageJson, graphData] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../app/graph-data.ts", import.meta.url), "utf8"),
  ]);

  assert.match(layout, /lang="zh-CN"/);
  assert.match(page, /aria-label="搜索知识页和节点"/);
  assert.match(page, /aria-label="当前路径"/);
  assert.match(page, /onDoubleClick/);
  assert.match(page, /openReference/);
  assert.match(page, /returnToOrigin/);
  assert.match(layout, /globals\.css/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /\.graph-node\.selected/);
  assert.match(graphData, /synchronized-and-jmm/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  assert.doesNotMatch(page, /_sites-preview|SkeletonPreview/);

  await assert.rejects(
    access(new URL("../app/_sites-preview", import.meta.url)),
  );
  await assert.rejects(
    access(new URL("public/_sites-preview", templateRoot)),
  );
});
