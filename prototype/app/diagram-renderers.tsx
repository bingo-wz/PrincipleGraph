import { AssetGlyphView } from "./asset-library";
import type { DiagramType, GraphNode } from "./graph-data";

type RendererProps = {
  nodes: GraphNode[];
  selectedKey: string | null;
  onSelect: (node: GraphNode) => void;
  onDrill: (slug: string) => void;
};

export const diagramTypeLabels: Record<
  DiagramType,
  { zh: string; en: string }
> = {
  SOFTWARE_ARCHITECTURE: {
    zh: "软件架构图",
    en: "Software Architecture",
  },
  SEQUENCE: { zh: "序列图", en: "Sequence Diagram" },
  LOGICAL_DATA_FLOW: {
    zh: "逻辑数据流图",
    en: "Logical Data Flow",
  },
};

function MultiplicityMark({ node }: { node: GraphNode }) {
  if (!node.multiplicity) return null;

  return (
    <span
      className={`renderer-multiplicity multiplicity-${node.multiplicity.mode}`}
      title={node.multiplicity.note}
    >
      <span className="replica-icons" aria-hidden="true">
        {Array.from({ length: node.multiplicity.visualCount }).map(
          (_, index) => (
            <i
              className={
                index < (node.multiplicity?.selectedCount ?? 0) ? "active" : ""
              }
              key={index}
            />
          ),
        )}
      </span>
      <b>{node.multiplicity.value}</b>
    </span>
  );
}

function DiagramNode({
  node,
  selected,
  onSelect,
  onDrill,
  variant,
}: {
  node: GraphNode;
  selected: boolean;
  onSelect: (node: GraphNode) => void;
  onDrill: (slug: string) => void;
  variant: "architecture" | "sequence" | "data-flow";
}) {
  return (
    <div className={`diagram-node-shell variant-${variant}`}>
      <button
        className={`diagram-node kind-${node.kind}${selected ? " selected" : ""}`}
        onClick={() => onSelect(node)}
        onDoubleClick={() => node.drillTo && onDrill(node.drillTo)}
        aria-pressed={selected}
        aria-label={`${node.label}${node.multiplicity ? `，${node.multiplicity.value}${node.multiplicity.unit}` : ""}`}
      >
        <AssetGlyphView assetKey={node.assetKey} label={node.label} />
        <span className="diagram-node-copy">
          <strong>{node.label}</strong>
          <small>{node.description}</small>
        </span>
        <MultiplicityMark node={node} />
      </button>
      {node.drillTo && (
        <button
          className="diagram-drill"
          onClick={() => onDrill(node.drillTo!)}
          aria-label={`进入 ${node.label} 的下一层原理`}
        >
          ↘
        </button>
      )}
    </div>
  );
}

function ArchitectureRenderer({
  nodes,
  selectedKey,
  onSelect,
  onDrill,
}: RendererProps) {
  const chunkSize = Math.ceil(nodes.length / 3);
  const zones = [
    {
      label: "Client / Edge",
      nodes: nodes.slice(0, chunkSize),
    },
    {
      label: "Routing / Runtime",
      nodes: nodes.slice(chunkSize, chunkSize * 2),
    },
    {
      label: "Application / Return",
      nodes: nodes.slice(chunkSize * 2),
    },
  ].filter((zone) => zone.nodes.length > 0);

  return (
    <div
      className="architecture-renderer"
      aria-label={`软件架构图，共 ${nodes.length} 个步骤`}
    >
      {zones.map((zone, zoneIndex) => (
        <section
          className={`architecture-zone${zoneIndex % 2 === 1 ? " reverse" : ""}`}
          key={zone.label}
        >
          <span className="zone-label">{zone.label}</span>
          <div className="architecture-zone-nodes">
            {(zoneIndex % 2 === 1
              ? [...zone.nodes].reverse()
              : zone.nodes
            ).map((node) => {
              const index = nodes.findIndex(
                (candidate) => candidate.key === node.key,
              );
              const zoneEnd =
                node.key === zone.nodes[zone.nodes.length - 1]?.key;
              return (
                <div className="architecture-step" key={node.key}>
                  <span className="step-number">{index + 1}</span>
                  <DiagramNode
                    node={node}
                    selected={selectedKey === node.key}
                    onSelect={onSelect}
                    onDrill={onDrill}
                    variant="architecture"
                  />
                  {!zoneEnd && (
                    <span className="architecture-connector" aria-hidden="true">
                      <small>{node.edgeLabel ?? "继续"}</small>
                      <i />
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          {zoneIndex < zones.length - 1 && (
            <span
              className={`architecture-zone-bridge ${zoneIndex % 2 === 1 ? "top" : "bottom"}`}
              aria-hidden="true"
            >
              <small>
                {zone.nodes[zone.nodes.length - 1]?.edgeLabel ?? "进入下一域"}
              </small>
              <i />
            </span>
          )}
        </section>
      ))}
    </div>
  );
}

const sequenceLanes = [
  { key: "entry", label: "Caller" },
  { key: "component", label: "Framework" },
  { key: "runtime", label: "Runtime" },
  { key: "data", label: "Data" },
  { key: "exit", label: "Response" },
] as const;

const laneIndex = (node: GraphNode) => {
  if (node.kind === "action") return 1;
  return Math.max(
    0,
    sequenceLanes.findIndex((lane) => lane.key === node.kind),
  );
};

function SequenceRenderer({
  nodes,
  selectedKey,
  onSelect,
  onDrill,
}: RendererProps) {
  return (
    <div
      className="sequence-renderer"
      aria-label={`序列图，共 ${nodes.length} 个消息步骤`}
    >
      <div className="sequence-head">
        {sequenceLanes.map((lane) => (
          <div className="sequence-actor" key={lane.key}>
            <span>{lane.label}</span>
            <i />
          </div>
        ))}
      </div>
      <div className="sequence-body">
        <div className="sequence-lifelines" aria-hidden="true">
          {sequenceLanes.map((lane) => (
            <i key={lane.key} />
          ))}
        </div>
        {nodes.map((node, index) => {
          const currentLane = laneIndex(node);
          const previousLane = index === 0 ? 0 : laneIndex(nodes[index - 1]);
          const start = Math.min(previousLane, currentLane);
          const end = Math.max(previousLane, currentLane);
          const reverse = currentLane < previousLane;

          return (
            <div className="sequence-row" key={node.key}>
              <button
                className={`sequence-message${reverse ? " reverse" : ""}${selectedKey === node.key ? " selected" : ""}${start === end ? " self" : ""}`}
                style={{
                  gridColumn: `${start + 1} / ${Math.min(end + 2, 6)}`,
                }}
                onClick={() => onSelect(node)}
                onDoubleClick={() => node.drillTo && onDrill(node.drillTo)}
                aria-pressed={selectedKey === node.key}
              >
                <span className="sequence-index">{index + 1}</span>
                <span className="sequence-label">
                  <strong>{node.edgeLabel ?? node.label}</strong>
                  <small>{node.label}</small>
                </span>
                <span className="sequence-target">
                  <AssetGlyphView
                    assetKey={node.assetKey}
                    label={node.label}
                    compact
                  />
                  <MultiplicityMark node={node} />
                </span>
              </button>
              {node.drillTo && (
                <button
                  className="sequence-drill"
                  onClick={() => onDrill(node.drillTo!)}
                  aria-label={`进入 ${node.label} 的下一层原理`}
                >
                  ↘
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LogicalDataFlowRenderer({
  nodes,
  selectedKey,
  onSelect,
  onDrill,
}: RendererProps) {
  const rows = Array.from(
    { length: Math.ceil(nodes.length / 3) },
    (_, rowIndex) => nodes.slice(rowIndex * 3, rowIndex * 3 + 3),
  );

  return (
    <div
      className="data-flow-renderer"
      aria-label={`逻辑数据流图，共 ${nodes.length} 个处理步骤`}
    >
      {rows.map((row, rowIndex) => {
        const reverse = rowIndex % 2 === 1;
        return (
          <div className="data-flow-row-wrap" key={`data-row-${rowIndex}`}>
            <div className={`data-flow-row${reverse ? " reverse" : ""}`}>
              {row.map((node) => {
                const index = nodes.findIndex(
                  (candidate) => candidate.key === node.key,
                );
                return (
                  <div className="data-flow-step" key={node.key}>
                    <span className="step-number">{index + 1}</span>
                    <DiagramNode
                      node={node}
                      selected={selectedKey === node.key}
                      onSelect={onSelect}
                      onDrill={onDrill}
                      variant="data-flow"
                    />
                    {index < nodes.length - 1 && (
                      <span className="data-flow-connector" aria-hidden="true">
                        <small>{node.edgeLabel ?? "数据流"}</small>
                        <i />
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            {rowIndex < rows.length - 1 && (
              <span
                className={`data-flow-turn${reverse ? " left" : " right"}`}
                aria-hidden="true"
              >
                <i />
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function DiagramRenderer({
  type,
  ...props
}: RendererProps & { type: DiagramType }) {
  if (type === "SEQUENCE") {
    return <SequenceRenderer {...props} />;
  }
  if (type === "LOGICAL_DATA_FLOW") {
    return <LogicalDataFlowRenderer {...props} />;
  }
  return <ArchitectureRenderer {...props} />;
}
