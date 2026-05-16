import type { ComponentType, ReactNode } from "react";
import Card from "./Card";
import Button from "./Button";
import Text from "./Text";
import Input from "./Input";
import Select from "./Select";
import Badge from "./Badge";
import Alert from "./Alert";
import Progress from "./Progress";
import Image from "./Image";
import Checkbox from "./Checkbox";
import Toggle from "./Toggle";
import Avatar from "./Avatar";
import Divider from "./Divider";
import Layout from "./Layout";
import { MathBlock, FilterBlock, MergeBlock, SwitchBlock, TemplateBlock, HttpBlock } from "./LogicBlock";

export type ComponentDescriptor = {
  type: string;
  name: string;
  propNames: string[];
  example: Record<string, unknown>;
  render: () => ReactNode;
  component: ComponentType<Record<string, string | undefined>>;
  composite?: boolean;
};

export const COMPONENTS: ComponentDescriptor[] = [
  {
    type: "card", name: "Card",
    propNames: ["title", "description"],
    example: { type: "card", props: { title: "Weather", description: "Sunny, 72°F" }, layout: { x: 0, y: 0, w: 300, h: 180 } },
    render: () => <Card title="Sample Card" description="This is a card block" />,
    component: Card,
  },
  {
    type: "button", name: "Button",
    propNames: ["label"],
    example: { type: "button", props: { label: "Click Me" }, layout: { x: 0, y: 0, w: 200, h: 60 } },
    render: () => <Button label="Sample Button" />,
    component: Button,
  },
  {
    type: "text", name: "Text",
    propNames: ["title", "description", "label"],
    example: { type: "text", props: { title: "Hello World" }, layout: { x: 0, y: 0, w: 240, h: 80 } },
    render: () => <Text title="Sample text block" />,
    component: Text,
  },
  {
    type: "input", name: "Input",
    propNames: ["label", "placeholder", "disabled"],
    example: { type: "input", props: { label: "Email", placeholder: "Enter your email" }, layout: { x: 0, y: 0, w: 280, h: 70 } },
    render: () => <Input label="Email" placeholder="Enter your email" />,
    component: Input,
  },
  {
    type: "select", name: "Select",
    propNames: ["label", "options"],
    example: { type: "select", props: { label: "Country", options: "USA,Canada,UK" }, layout: { x: 0, y: 0, w: 280, h: 70 } },
    render: () => <Select label="Country" options="USA,Canada,UK" />,
    component: Select,
  },
  {
    type: "badge", name: "Badge",
    propNames: ["label", "color"],
    example: { type: "badge", props: { label: "New", color: "green" }, layout: { x: 0, y: 0, w: 100, h: 30 } },
    render: () => <Badge label="New" color="green" />,
    component: Badge,
  },
  {
    type: "alert", name: "Alert",
    propNames: ["title", "description", "variant"],
    example: { type: "alert", props: { title: "Success", description: "Operation completed", variant: "success" }, layout: { x: 0, y: 0, w: 300, h: 80 } },
    render: () => <Alert title="Success" description="Operation completed" variant="success" />,
    component: Alert,
  },
  {
    type: "progress", name: "Progress",
    propNames: ["label", "value"],
    example: { type: "progress", props: { label: "Loading", value: "65" }, layout: { x: 0, y: 0, w: 280, h: 50 } },
    render: () => <Progress label="Loading" value="65" />,
    component: Progress,
  },
  {
    type: "image", name: "Image",
    propNames: ["src", "alt", "width", "height"],
    example: { type: "image", props: { src: "https://placehold.co/400x200", alt: "Placeholder" }, layout: { x: 0, y: 0, w: 300, h: 200 } },
    render: () => <Image src="https://placehold.co/400x200/e5e7eb/9ca3af?text=Preview" alt="Preview" />,
    component: Image,
  },
  {
    type: "checkbox", name: "Checkbox",
    propNames: ["label", "checked", "disabled"],
    example: { type: "checkbox", props: { label: "Accept terms", checked: "true" }, layout: { x: 0, y: 0, w: 200, h: 40 } },
    render: () => <Checkbox label="Accept terms" checked="true" />,
    component: Checkbox,
  },
  {
    type: "toggle", name: "Toggle",
    propNames: ["label", "checked"],
    example: { type: "toggle", props: { label: "Enable notifications", checked: "true" }, layout: { x: 0, y: 0, w: 220, h: 40 } },
    render: () => <Toggle label="Enable notifications" checked="true" />,
    component: Toggle,
  },
  {
    type: "avatar", name: "Avatar",
    propNames: ["name", "src", "size"],
    example: { type: "avatar", props: { name: "John Doe", size: "40" }, layout: { x: 0, y: 0, w: 60, h: 60 } },
    render: () => <Avatar name="John Doe" size="40" />,
    component: Avatar,
  },
  {
    type: "divider", name: "Divider",
    propNames: ["label"],
    example: { type: "divider", props: { label: "or" }, layout: { x: 0, y: 0, w: 300, h: 30 } },
    render: () => <Divider label="or" />,
    component: Divider,
  },
  {
    type: "layout", name: "Layout",
    propNames: ["label"],
    example: { type: "layout", props: {}, layout: { x: 0, y: 0, w: 320, h: 260 }, children: [{ type: "text", props: { title: "Form" }, layout: { x: 0, y: 0, w: 280, h: 30 } }, { type: "input", props: { label: "Name" }, layout: { x: 0, y: 0, w: 280, h: 60 } }, { type: "button", props: { label: "Submit" }, layout: { x: 0, y: 0, w: 280, h: 40 } }] },
    render: () => <Layout label="Layout (3 children)" />,
    component: Layout,
    composite: true,
  },

  {
    type: "math", name: "Math",
    propNames: ["label", "operation"],
    example: { type: "math", props: { label: "Add", operation: "add" }, layout: { x: 0, y: 0, w: 180, h: 140 } },
    render: () => <MathBlock typeLabel="Math" label="Add" operation="add" />,
    component: MathBlock,
  },
  {
    type: "filter", name: "Filter",
    propNames: ["label", "condition"],
    example: { type: "filter", props: { label: "Truthy", condition: "truthy" }, layout: { x: 0, y: 0, w: 180, h: 140 } },
    render: () => <FilterBlock typeLabel="Filter" label="Truthy" condition="truthy" />,
    component: FilterBlock,
  },
  {
    type: "merge", name: "Merge",
    propNames: ["label"],
    example: { type: "merge", props: { label: "Merge" }, layout: { x: 0, y: 0, w: 180, h: 120 } },
    render: () => <MergeBlock typeLabel="Merge" label="Merge" />,
    component: MergeBlock,
  },
  {
    type: "switch", name: "Switch",
    propNames: ["label", "cases"],
    example: { type: "switch", props: { label: "Router", cases: "a,b,c" }, layout: { x: 0, y: 0, w: 180, h: 140 } },
    render: () => <SwitchBlock typeLabel="Switch" label="Router" cases="a,b,c" />,
    component: SwitchBlock,
  },
  {
    type: "template", name: "Template",
    propNames: ["label"],
    example: { type: "template", props: { label: "String Tpl" }, layout: { x: 0, y: 0, w: 180, h: 120 } },
    render: () => <TemplateBlock typeLabel="Template" label="String Tpl" />,
    component: TemplateBlock,
  },
  {
    type: "http", name: "HTTP",
    propNames: ["label"],
    example: { type: "http", props: { label: "API Call" }, layout: { x: 0, y: 0, w: 180, h: 120 } },
    render: () => <HttpBlock typeLabel="HTTP" label="API Call" />,
    component: HttpBlock,
  },
];

export const registry: Record<string, ComponentType<Record<string, string | undefined>>> = {};
for (const c of COMPONENTS) {
  registry[c.type] = c.component;
}
