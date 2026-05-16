import type { UIJSON, CatalogJSON } from "../types";

export function deriveCatalog(ui: UIJSON): CatalogJSON {
  const node = ui.type.charAt(0).toUpperCase() + ui.type.slice(1);

  const children: CatalogJSON[] = [];

  if (ui.children) {
    for (const child of ui.children) {
      children.push(deriveCatalog(child));
    }
  }

  if (ui.props.title) {
    children.push({ node: "Text", props: { value: ui.props.title } });
  }
  if (ui.props.description) {
    children.push({ node: "Text", props: { value: ui.props.description } });
  }
  if (ui.props.label) {
    children.push({ node: "Text", props: { value: ui.props.label } });
  }

  children.push({
    node: "Layout",
    props: { w: ui.layout?.w ?? 200, h: ui.layout?.h ?? 160 },
  });

  return { node, props: { ...ui.props }, children };
}
