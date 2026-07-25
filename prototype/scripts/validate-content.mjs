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
const contentPackRoot = path.resolve(currentDir, "../content/packs");

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
  const assetKeys = new Set();

  for (const asset of pack.assetLibrary ?? []) {
    if (assetKeys.has(asset.key)) {
      violations.push(`DUPLICATE_ASSET:${asset.key}`);
    }
    assetKeys.add(asset.key);
  }

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
      if (
        node.multiplicity?.selectedCount !== undefined &&
        node.multiplicity.selectedCount > node.multiplicity.visualCount
      ) {
        violations.push(
          `MULTIPLICITY_SELECTION_OVERFLOW:${page.slug}:${node.key}`,
        );
      }
      if (node.assetKey && !assetKeys.has(node.assetKey)) {
        violations.push(
          `ASSET_NOT_FOUND:${page.slug}:${node.key}:${node.assetKey}`,
        );
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
      if (
        reference.sourceAnchorType === "NODE" &&
        !nodeKeys.has(reference.sourceAnchorKey)
      ) {
        violations.push(
          `REFERENCE_SOURCE_NODE_NOT_FOUND:${page.slug}:${reference.sourceAnchorKey}`,
        );
      }
      if (
        reference.sourceAnchorType === "EDGE" &&
        !edgeKeys.has(reference.sourceAnchorKey)
      ) {
        violations.push(
          `REFERENCE_SOURCE_EDGE_NOT_FOUND:${page.slug}:${reference.sourceAnchorKey}`,
        );
      }
      const targetPage = pageBySlug.get(reference.targetPage);
      if (
        reference.targetAnchorKey &&
        targetPage &&
        !targetPage.nodes.some(
          (node) => node.key === reference.targetAnchorKey,
        ) &&
        !targetPage.edges.some(
          (edge) => edge.key === reference.targetAnchorKey,
        )
      ) {
        violations.push(
          `REFERENCE_TARGET_ANCHOR_NOT_FOUND:${page.slug}:${reference.targetPage}:${reference.targetAnchorKey}`,
        );
      }
    }

    const explanationKeys = new Set();
    for (const explanation of page.explanations) {
      if (explanationKeys.has(explanation.key)) {
        violations.push(
          `DUPLICATE_EXPLANATION:${page.slug}:${explanation.key}`,
        );
      }
      explanationKeys.add(explanation.key);
      if (
        explanation.anchorType === "NODE" &&
        !nodeKeys.has(explanation.anchorKey)
      ) {
        violations.push(
          `EXPLANATION_NODE_NOT_FOUND:${page.slug}:${explanation.anchorKey}`,
        );
      }
      if (
        explanation.anchorType === "EDGE" &&
        !edgeKeys.has(explanation.anchorKey)
      ) {
        violations.push(
          `EXPLANATION_EDGE_NOT_FOUND:${page.slug}:${explanation.anchorKey}`,
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

function validatePublishablePack(pack) {
  const violations = [];

  if (!pack.packVersion) violations.push("PACK_VERSION_REQUIRED");
  if (!pack.status) violations.push("PACK_STATUS_REQUIRED");
  if (!pack.updatedAt) violations.push("PACK_UPDATED_AT_REQUIRED");
  if (!pack.authors?.length) violations.push("PACK_AUTHORS_REQUIRED");

  for (const page of pack.pages) {
    if (!page.question) {
      violations.push(`PAGE_QUESTION_REQUIRED:${page.slug}`);
    }
    if (!page.assumption) {
      violations.push(`PAGE_ASSUMPTION_REQUIRED:${page.slug}`);
    }
    if (!page.layout?.diagramType) {
      violations.push(`PAGE_DIAGRAM_TYPE_REQUIRED:${page.slug}`);
    }
    const mainFlowCount = page.explanations.filter(
      (explanation) => explanation.kind === "MAIN_FLOW",
    ).length;
    if (mainFlowCount !== 1) {
      violations.push(
        `MAIN_FLOW_EXPLANATION_COUNT:${page.slug}:${mainFlowCount}`,
      );
    }
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

const contentPackFiles = fs
  .readdirSync(contentPackRoot)
  .filter((fileName) => fileName.endsWith(".json"))
  .sort();
assert(contentPackFiles.length > 0, "content/packs 中至少需要一个内容包");

for (const fileName of contentPackFiles) {
  const pack = JSON.parse(
    fs.readFileSync(path.join(contentPackRoot, fileName), "utf8"),
  );
  assert(
    validateSchema(pack),
    `${fileName} 未通过 Schema：${JSON.stringify(validateSchema.errors)}`,
  );
  const semanticViolations = validateSemantics(pack);
  assert(
    semanticViolations.length === 0,
    `${fileName} 未通过语义校验：${semanticViolations.join(", ")}`,
  );
  const publishViolations = validatePublishablePack(pack);
  assert(
    publishViolations.length === 0,
    `${fileName} 不满足发布要求：${publishViolations.join(", ")}`,
  );
}

assert(
  !validateSchema(invalidSchemaFixture),
  "Schema 反例应被拒绝，但校验结果为通过",
);

const invalidDiagramTypeFixture = structuredClone(validFixture);
invalidDiagramTypeFixture.pages[0].layout.diagramType = "GENERIC_WHITEBOARD";
assert(
  !validateSchema(invalidDiagramTypeFixture),
  "非法图型应被 Schema 拒绝，但校验结果为通过",
);

const invalidAssetFixture = structuredClone(validFixture);
invalidAssetFixture.pages[0].nodes[0].assetKey = "missing-asset";
assert(
  validateSemantics(invalidAssetFixture).includes(
    "ASSET_NOT_FOUND:http-request-panorama:browser:missing-asset",
  ),
  "语义校验未拒绝不存在的素材引用",
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
console.log(
  `Content Pack：${contentPackFiles.length} 个仓库内容包通过发布校验`,
);
console.log("Schema 反例：已正确拒绝");
console.log("图型反例：已正确拒绝");
console.log("素材引用反例：已正确拒绝");
console.log(`语义反例：已正确拒绝（${semanticViolations.join(", ")}）`);
