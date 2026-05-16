import { describe, it, expect, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { act } from "@testing-library/react";
import { useStore } from "../store/useStore";
import BlockView from "./BlockView";
import type { Block } from "../types";

function makeBlock(id: string, type: string, overrides: Partial<Block> = {}): Block {
  return {
    id,
    position: { x: 0, y: 0 },
    size: { w: 240, h: 160 },
    ui_json: { type, props: {}, layout: { x: 0, y: 0, w: 240, h: 160 } },
    catalog_json: { node: type },
    static_code: "",
    ...overrides,
  };
}

beforeEach(() => {
  act(() =>
    useStore.setState({
      blocks: {},
      selectedBlockIds: [],
      runtimeResults: {},
      isExecuting: false,
    })
  );
});

describe("BlockView port rendering", () => {
  it("renders output port circles for button blocks", () => {
    const block = makeBlock("b1", "button");
    render(<BlockView block={block} />);
    const outputPorts = document.querySelectorAll("[data-port-direction='output']");
    expect(outputPorts.length).toBeGreaterThan(0);
    expect(outputPorts[0].getAttribute("data-port")).toBe("click");
  });

  it("renders output port circles for input blocks", () => {
    const block = makeBlock("b1", "input");
    render(<BlockView block={block} />);
    const outputPorts = document.querySelectorAll("[data-port-direction='output']");
    expect(outputPorts.length).toBe(2);
    const portIds = Array.from(outputPorts).map((el) => el.getAttribute("data-port"));
    expect(portIds).toContain("value");
    expect(portIds).toContain("change");
  });

  it("renders input port circles for text blocks", () => {
    const block = makeBlock("b1", "text");
    render(<BlockView block={block} />);
    const inputPorts = document.querySelectorAll("[data-port-direction='input']");
    expect(inputPorts.length).toBe(1);
    expect(inputPorts[0].getAttribute("data-port")).toBe("value");
  });

  it("renders no ports for divider blocks", () => {
    const block = makeBlock("b1", "divider");
    render(<BlockView block={block} />);
    expect(document.querySelectorAll("[data-port]").length).toBe(0);
  });

  it("renders input and output ports for math logic blocks", () => {
    const block = makeBlock("b1", "math");
    render(<BlockView block={block} />);
    const inputs = document.querySelectorAll("[data-port-direction='input']");
    const outputs = document.querySelectorAll("[data-port-direction='output']");
    expect(inputs.length).toBe(2);
    expect(outputs.length).toBe(1);
    expect(outputs[0].getAttribute("data-port")).toBe("result");
  });

  it("sets data-port-type attribute on input ports", () => {
    const block = makeBlock("b1", "card");
    render(<BlockView block={block} />);
    const inputPorts = document.querySelectorAll("[data-port-direction='input']");
    expect(inputPorts.length).toBe(2);
    for (const port of inputPorts) {
      expect(port.getAttribute("data-port-type")).toBeTruthy();
    }
  });

  it("sets data-block-id on the containing element", () => {
    const block = makeBlock("b1", "button");
    render(<BlockView block={block} />);
    const container = document.querySelector("[data-block-id='b1']");
    expect(container).toBeTruthy();
  });
});
