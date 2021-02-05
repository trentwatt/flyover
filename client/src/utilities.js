export function networkReducer(state, action) {
  if (action.type === 'SET_GLOBAL_PAGERANKS') {
    return {
      graphData: state.graphData,
      globalPageRanks: action.payload,
    }
  } else if (action.type === 'NODE_EXPANSION') {
    if (!state.globalPageRanks) return state
    const {
      incoming,
      outgoing,
      nodeToExpand, // , type: expandNodeType },
      sensitivity,
    } = action.payload
    console.log({ sensitivity })
    // const oldNodes = nodes.filter(n => n.id !== expandNodeId)
    // incoming and outgoing should come pre-sliced
    // fetching, getting and setting local storage should happen in event handler/ middleware
    const newIncomingNodes = incoming.map(n => ({
      id: `IN: ${n} ${Math.floor(Math.random() * 1000)}`,
      name: n.split('.')[0],
      type: 'in',
      parent: nodeToExpand.id,
      leaf: true,
      sliceIndex: 0,
      // parentNode: expandNodeNode,
    }))

    const newOutgoingNodes = outgoing.map(n => ({
      id: `OUT: ${n} ${Math.floor(Math.random() * 100)}`,
      name: n.split('.')[0],
      type: 'out',
      parent: nodeToExpand.id,
      leaf: true,
      sliceIndex: 0,
      // parentNode: expandNodeNode,
    }))
    const newNodes = [...newIncomingNodes, ...newOutgoingNodes]
    const newIncomingLinks = newIncomingNodes.map(({ id }) => ({
      source: id,
      target: nodeToExpand.id,
      leaf: true,
      child: id,
    }))
    const newOutgoingLinks = newOutgoingNodes.map(({ id }) => ({
      source: nodeToExpand.id,
      target: id,
      leaf: true,
      child: id,
    }))
    const newLinks = [...newIncomingLinks, ...newOutgoingLinks]
    // const oldNodes = graphData.nodes.filter(n => n.id !== nodeToExpand.id)
    nodeToExpand.leaf = false
    const existingNodes = state.graphData.nodes
    const existingLinks = state.graphData.links
    existingLinks.forEach(link => {
      if (link.child === nodeToExpand.id) {
        link.leaf = false
      }
    })
    return {
      ...state,
      graphData: {
        nodes: [
          ...existingNodes,
          // ...oldNodes,
          // {
          //   ...nodeToExpand, // type: expandNodeType,
          //   leaf: false,
          // },
          ...newNodes,
        ],
        links: [...existingLinks, ...newLinks],
      },
    }
  } else if (action.type === 'SENSITIVITY_UPDATE') {
    console.log(action.payload)
    return state
  } else {
    return state
  }
}

export function getRelativePageRanks(
  subgraphPageRanks,
  globalPageRanks,
  sensitivity = 0.75
) {
  if (!globalPageRanks) return
  const normalize = ranks => {
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
export async function getExpansion(globalPageRanks, nodeToExpand) {
  console.log({ nodeToExpand })
  const storedValue = JSON.parse(localStorage.getItem(nodeToExpand.name))
  let incoming, outgoing, sliceIndex
  if (storedValue) {
    ;({ incoming, outgoing, sliceIndex } = storedValue)
  } else {
    ;({ incoming, outgoing } = await fetch(
      `http://127.0.0.1:8000/nodes/${nodeToExpand.name}.gov`
    )
      .then(response => response.json())
      .then(subgraphPageRanks =>
        getRelativePageRanks(subgraphPageRanks, globalPageRanks)
      ))
    sliceIndex = 0
  }
  localStorage.setItem(
    nodeToExpand.name,
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
  return { incoming: newIncoming, outgoing: newOutgoing }
}
