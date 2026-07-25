import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const schemaRoot = path.resolve(
  currentDir,
  "../../packages/content-schema",
);

const readJson = (relativePath) =>
  JSON.parse(fs.readFileSync(path.join(schemaRoot, relativePath), "utf8"));

const schema = readJson("schema/content-pack.schema.json");
const validFixture = readJson("fixtures/valid-http-request-pack.json");
const invalidSchemaFixture = readJson(
  "fixtures/invalid-schema-enum.json",
);
const invalidSemanticFixture = readJson(
  "fixtures/invalid-semantic-broken-edge.json",
);

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const validateSchema = ajv.compile(schema);

function validateSemantics(pack) {
  const violations = [];
  const pageBySlug = new Map();

  for (const page of pack.pages) {
    if (pageBySlug.has(page.slug)) {
      violations.push(`DUPLICATE_PAGE:${page.slug}`);
    }
    pageBySlug.set(page.slug, page);
  }

  for (const scenario of pack.scenarios) {
    if (!pageBySlug.has(scenario.entryPage)) {
      violations.push(
        `SCENARIO_ENTRY_NOT_FOUND:${scenario.key}:${scenario.entryPage}`,
      );
    }
  }

  for (const page of pack.pages) {
    const nodeKeys = new Set();
    const adjacency = new Map();

    for (const node of page.nodes) {
      if (nodeKeys.has(node.key)) {
        violations.push(`DUPLICATE_NODE:${page.slug}:${node.key}`);
      }
      nodeKeys.add(node.key);
      adjacency.set(node.key, []);
    }

    if (!nodeKeys.has(page.entryNodeKey)) {
      violations.push(`ENTRY_NOT_FOUND:${page.slug}:${page.entryNodeKey}`);
    }

    for (const exitKey of page.exitNodeKeys) {
      if (!nodeKeys.has(exitKey)) {
        violations.push(`EXIT_NOT_FOUND:${page.slug}:${exitKey}`);
      }
    }

    const edgeKeys = new Set();
    for (const edge of page.edges) {
      if (edgeKeys.has(edge.key)) {
        violations.push(`DUPLICATE_EDGE:${page.slug}:${edge.key}`);
      }
      edgeKeys.add(edge.key);
      if (!nodeKeys.has(edge.from)) {
        violations.push(`EDGE_SOURCE_NOT_FOUND:${page.slug}:${edge.key}`);
      }
      if (!nodeKeys.has(edge.to)) {
        violations.push(`EDGE_TARGET_NOT_FOUND:${page.slug}:${edge.key}`);
      }
      if (
        edge.type !== "ERROR" &&
        adjacency.has(edge.from) &&
        nodeKeys.has(edge.to)
      ) {
        adjacency.get(edge.from).push(edge.to);
      }
    }

    const visited = new Set();
    const queue = nodeKeys.has(page.entryNodeKey)
      ? [page.entryNodeKey]
      : [];
    while (queue.length > 0) {
      const current = queue.shift();
      if (visited.has(current)) continue;
      visited.add(current);
      for (const next of adjacency.get(current) ?? []) {
        if (!visited.has(next)) queue.push(next);
      }
    }

    for (const exitKey of page.exitNodeKeys) {
      if (nodeKeys.has(exitKey) && !visited.has(exitKey)) {
        violations.push(`UNREACHABLE_EXIT:${page.slug}:${exitKey}`);
      }
    }

    for (const node of page.nodes) {
      if (node.drillTo && !pageBySlug.has(node.drillTo)) {
        violations.push(
          `DRILL_TARGET_NOT_FOUND:${page.slug}:${node.key}:${node.drillTo}`,
        );
      }
    }

    for (const reference of page.references ?? []) {
      if (!pageBySlug.has(reference.targetPage)) {
        violations.push(
          `REFERENCE_TARGET_NOT_FOUND:${page.slug}:${reference.targetPage}`,
        );
      }
    }
  }

  const drillAdjacency = new Map(
    pack.pages.map((page) => [
      page.slug,
      page.nodes
        .map((node) => node.drillTo)
        .filter((target) => target && pageBySlug.has(target)),
    ]),
  );
  const visiting = new Set();
  const visitedPages = new Set();

  const visitPage = (slug, pathStack) => {
    if (visiting.has(slug)) {
      const cycleStart = pathStack.indexOf(slug);
      violations.push(
        `DRILL_CYCLE:${[...pathStack.slice(cycleStart), slug].join("->")}`,
      );
      return;
    }
    if (visitedPages.has(slug)) return;

    visiting.add(slug);
    for (const target of drillAdjacency.get(slug) ?? []) {
      visitPage(target, [...pathStack, slug]);
    }
    visiting.delete(slug);
    visitedPages.add(slug);
  };

  for (const page of pack.pages) {
    visitPage(page.slug, []);
  }

  return violations;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(
  validateSchema(validFixture),
  `有效 fixture 未通过 Schema：${JSON.stringify(validateSchema.errors)}`,
);
assert(
  validateSemantics(validFixture).length === 0,
  `有效 fixture 未通过语义校验：${validateSemantics(validFixture).join(", ")}`,
);

assert(
  !validateSchema(invalidSchemaFixture),
  "Schema 反例应被拒绝，但校验结果为通过",
);

assert(
  validateSchema(invalidSemanticFixture),
  `语义反例应先通过 Schema：${JSON.stringify(validateSchema.errors)}`,
);
const semanticViolations = validateSemantics(invalidSemanticFixture);
assert(
  semanticViolations.includes(
    "EDGE_TARGET_NOT_FOUND:broken-page:broken-edge",
  ),
  "语义反例未检测到悬空边",
);
assert(
  semanticViolations.includes("UNREACHABLE_EXIT:broken-page:exit"),
  "语义反例未检测到不可达出口",
);

console.log("Content Schema v1：有效 fixture 通过");
console.log("Schema 反例：已正确拒绝");
console.log(`语义反例：已正确拒绝（${semanticViolations.join(", ")}）`);
