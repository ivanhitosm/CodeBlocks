export type UIJSON = {
  type: string;
  props: Record<string, string | undefined>;
  layout: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  children?: UIJSON[];
};

export type CatalogJSON = {
  node: string;
  props?: Record<string, unknown>;
  children?: CatalogJSON[];
};

export type StaticCode = string;

export type Block = {
  id: string;
  position: { x: number; y: number };
  size: { w: number; h: number };
  ui_json: UIJSON;
  catalog_json: CatalogJSON;
  static_code: string;
};

export type ViewTab = "ui" | "json" | "catalog" | "code";

export type GenerationEvent = {
  id: string;
  blockId?: string;
  type: "prompt" | "response" | "validation" | "repair" | "error" | "system";
  timestamp: number;
  content: string;
  metadata?: Record<string, unknown>;
};

export type CanvasView = {
  id: string;
  name: string;
  target?: "mobile" | "tablet" | "desktop";
  blockIds: string[];
  createdAt: number;
};

export type CatalogEntry = {
  id: string;
  name: string;
  description?: string;
  tags?: string[];
  ui: UIJSON;
  createdAt: number;
  sourceBlockId?: string;
  composite?: boolean;
};

export type PortDirection = "input" | "output";

export type PortDescriptor = {
  id: string;
  label: string;
  type: string;
  direction: PortDirection;
};

export type Connection = {
  id: string;
  sourceBlockId: string;
  sourcePortId: string;
  targetBlockId: string;
  targetPortId: string;
};

export type RuntimeValue = string | number | boolean | null;

export type ExecutionStatus = "idle" | "running" | "success" | "error";

export type ExecutionResult = {
  outputs: Record<string, RuntimeValue>;
  status: ExecutionStatus;
  error?: string;
  timestamp: number;
};
