export function networkReducer(state, action) {
  const { globalPageRanks, nodes, links } = state
  const { type: actionType, payload } = action
  if (actionType === 'SET_GLOBAL_PAGERANKS') {
    return {
      nodes,
      links,
      globalPageRanks: payload,
    }
  } else if (action.type === 'NODE_EXPANSION') {
    if (!globalPageRanks) return state
    // there is still a potential problem here.
    // they can "use up" vertcices by clicking before load.
    // currently handling it in UI but should be handling in state logic
    const {
      incoming,
      outgoing,
      nodeToExpand: { id: expandNodeId }, // , type: expandNodeType },
    } = payload
    // const oldNodes = nodes.filter(n => n.id !== expandNodeId)
    // incoming and outgoing should come pre-sliced
    // fetching, getting and setting local storage should happen in event handler/ middleware
    const newIncomingNodes = incoming.map(n => ({
      id: `IN: ${n} ${Math.floor(Math.random() * 100)}`,
      name: n.split('.')[0],
      type: 'in',
      parent: expandNodeId,
      // parentNode: expandNodeNode,
    }))

    const newOutgoingNodes = outgoing.map(n => ({
      id: `OUT: ${n} ${Math.floor(Math.random() * 100)}`,
      name: n.split('.')[0],
      type: 'out',
      parent: expandNodeId,
      // parentNode: expandNodeNode,
    }))
    const newNodes = [...newIncomingNodes, ...newOutgoingNodes]
    const newIncomingLinks = newIncomingNodes.map(({ id }) => ({
      source: id,
      target: expandNodeId,
    }))
    const newOutgoingLinks = newOutgoingNodes.map(({ id }) => ({
      source: expandNodeId,
      target: id,
    }))
    const newLinks = [...newIncomingLinks, ...newOutgoingLinks]
    return {
      ...state,
      nodes: [
        ...nodes,
        // ...oldNodes,
        // { id: expandNodeId, type: expandNodeType, children: newNodes },
        ...newNodes,
      ],
      links: [...links, ...newLinks],
    }
  }
}

export function getRelativePageRanks(
  subgraphPageRanks,
  globalPageRanks,
  sensitivity = 0.75
) {
  console.log({ globalPageRanks })
  if (!globalPageRanks) return
  const normalize = ranks => {
    console.log({ ranks })
    return (
      ranks &&
      Object.entries(ranks)
        .map(([vertex, score]) => ({
          [vertex]: score / globalPageRanks[vertex] ** sensitivity,
        }))
        .sort((a, b) => {
          return Object.values(b)[0] - Object.values(a)[0]
        })
        .slice(0, 10)
        .reduce((a, b) => ({ ...a, ...b }))
    )
  }
  const { node, incoming, outgoing } = subgraphPageRanks

  return { node, incoming: normalize(incoming), outgoing: normalize(outgoing) }
}

const verticesAtOnce = 2
export async function getExpansion(globalPageRanks, expandNodeId) {
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
    console.log({ incoming, sliceIndex })
  }
  localStorage.setItem(
    expandNodeName,
    JSON.stringify({
      incoming,
      outgoing,
      sliceIndex: sliceIndex + verticesAtOnce,
    })
  )

  if (sliceIndex > Math.max(incoming.length, outgoing.length)) {
    return { incoming: null, outgoing: null }
  }

  const newIncoming = Object.keys(incoming).slice(
    sliceIndex,
    sliceIndex + verticesAtOnce
  )

  const newOutgoing = Object.keys(outgoing).slice(
    sliceIndex,
    sliceIndex + verticesAtOnce
  )
  // console.log({ newIncoming })
  return { incoming: newIncoming, outgoing: newOutgoing }
}
