export const getInitialNetwork = () => {
  const root = d3.hierarchy(data)
  const links = root
    .links()
    .map(l => ({ source: l.source.data.name, target: l.target.data.name }))
  const nodes = root.descendants().map(n => ({
    id: n.data.name,
    children: n.children && n.children.map(c => c.data.name),
  }))
  return { nodes, links }
}
