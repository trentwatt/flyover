export default function graphReducer(state, action) {
  const { nodes: oldNodes, links: oldLinks } = state
  const { node: centerNode, incoming, outgoing } = action.payload

  const newIncomingNodes = Object.entries(incoming).map(([node, score]) => ({
    id: node,
    name: node,
    val: score,
  }))
  const newIncomingLinks = Object.entries(incoming).map(([node, score]) => ({
    source: node,
    target: centerNode,
  }))
  const newOutgoingNodes = Object.entries(outgoing).map(([node, score]) => ({
    id: node,
    name: node,
    val: score,
  }))
  const newOutgoingLinks = Object.entries(outgoing).map(([node, score]) => ({
    source: centerNode,
    target: node,
  }))

  const newNodes = [...oldNodes, ...newIncomingNodes, ...newOutgoingNodes]
  const newLinks = [...oldLinks, ...newIncomingLinks, ...newOutgoingLinks]

  return { nodes: newNodes, links: newLinks }
}
