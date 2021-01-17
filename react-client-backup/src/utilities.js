const verticesAtOnce = 2

export async function expandNetwork(state, action) {
  if (action.type === 'INITIAL_DOWNLOAD') {
    return { globalPageRanks: action.payload }
  }
  const { globalPageRanks, nodes, links } = state
  if (!globalPageRanks) return state
  const { id: expandNodeId, type: expandNodeType } = action.payload
  const expandNodeName = expandNodeId.split(' ')[1]
  const storedValue = JSON.parse(localStorage.getItem(expandNodeName))
  let incoming, outgoing, sliceIndex
  if (storedValue) {
    ;({ incoming, outgoing, sliceIndex } = storedValue)
  } else {
    ;({ incoming, outgoing } = await fetch(
      `http://127.0.0.1:8000/nodes/${expandNodeName}`
    )
      .then(response => response.json())
      .then(subgraphPageRanks =>
        getRelativePageRanks(subgraphPageRanks, globalPageRanks)
      ))
    sliceIndex = 0
  }

  if (sliceIndex > Math.max(incoming.length, outgoing.length)) {
    return { nodes, links }
  }

  const oldNodes = nodes.filter(n => n.id !== expandNodeId)
  const newIncoming = Object.keys(incoming)
    .slice(sliceIndex, sliceIndex + verticesAtOnce)
    .map(n => ({
      id: `IN: ${n} ${Math.floor(Math.random() * 100)}`,
      name: n,
      type: 'in',
      parent: expandNodeId,
      // parentNode: expandNodeNode,
    }))

  const newOutgoing = Object.keys(outgoing)
    .slice(sliceIndex, sliceIndex + verticesAtOnce)
    .map(n => ({
      id: `OUT: ${n} ${Math.floor(Math.random() * 100)}`,
      name: n,
      type: 'out',
      parent: expandNodeId,
      // parentNode: expandNodeNode,
    }))

  localStorage.setItem(
    expandNodeName,
    JSON.stringify({
      incoming,
      outgoing,
      sliceIndex: sliceIndex + verticesAtOnce,
    })
  )
  const newNodes = [...newIncoming, ...newOutgoing]
  const newLinks = newNodes.map(({ id }) => ({
    source: expandNodeId,
    target: id,
  }))
  return {
    nodes: [
      ...oldNodes,
      { id: expandNodeId, type: expandNodeType, children: newNodes },
      ...newNodes,
    ],
    links: [...links, ...newLinks],
  }
}

export function getRelativePageRanks(
  subgraphsPageRanks,
  globalPageRanks,
  sensitivity = 0.75
) {
  if (!globalPageRanks) return
  const normalize = subgraphRanks =>
    subgraphRanks &&
    Object.entries(subgraphRanks)
      .map(([vertex, score]) => ({
        [vertex]: score / globalPageRanks[vertex] ** sensitivity,
      }))
      .sort((a, b) => {
        return Object.values(b)[0] - Object.values(a)[0]
      })
      .slice(0, 10)
      .reduce((a, b) => ({ ...a, ...b }))
  const { node, incoming, outgoing } = subgraphsPageRanks
  return { node, incoming: normalize(incoming), outgoing: normalize(outgoing) }
}
