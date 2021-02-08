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
      sliceIndex,
    } = action.payload
    // const oldNodes = nodes.filter(n => n.id !== expandNodeId)
    // incoming and outgoing should come pre-sliced
    // fetching, getting and setting local storage should happen in event handler/ middleware
    const newIncomingNodes = incoming.map(n => ({
      id: `IN: ${n} ${Math.floor(Math.random() * 1000)}`,
      name: n.split('.')[0],
      type: 'in',
      parent: nodeToExpand.id,
      ancestrality: 'leaf',
      sliceIndex: 0,
      emanationsIn: [],
      emanationsOut: [],
    }))

    const newOutgoingNodes = outgoing.map(n => ({
      id: `OUT: ${n} ${Math.floor(Math.random() * 1000)}`,
      name: n.split('.')[0],
      type: 'out',
      parent: nodeToExpand.id,
      ancestrality: 'leaf',
      sliceIndex: 0,
      emanationsIn: [],
      emanationsOut: [],
    }))
    const newNodes = [...newIncomingNodes, ...newOutgoingNodes]
    const newIncomingLinks = newIncomingNodes.map(({ id, name }) => ({
      source: id,
      target: nodeToExpand.id,
      leaf: true,
      parent: nodeToExpand.id,
      parentName: nodeToExpand.name,
      child: id,
      childName: name,
      _sensitivity: sensitivity,
    }))
    const newOutgoingLinks = newOutgoingNodes.map(({ id, name }) => ({
      source: nodeToExpand.id,
      target: id,
      leaf: true,
      parent: nodeToExpand.id,
      parentName: nodeToExpand.name,
      child: id,
      childName: name,
      _sensitivity: sensitivity,
    }))
    const newLinks = [...newIncomingLinks, ...newOutgoingLinks]
    //
    // const oldNodes = graphData.nodes.filter(n => n.id !== nodeToExpand.id)
    //
    if (nodeToExpand.ancestrality === 'leaf') {
      nodeToExpand.ancestrality = 'parent'
    }
    nodeToExpand.sliceIndex = sliceIndex
    nodeToExpand.emanationsIn = [
      ...nodeToExpand.emanationsIn,
      ...newIncomingLinks,
    ]
    nodeToExpand.emanationsOut = [
      ...nodeToExpand.emanationsOut,
      ...newOutgoingLinks,
    ]

    const existingNodes = state.graphData.nodes
    existingNodes.forEach(node => {
      if (node.id === nodeToExpand.parent) {
        nodeToExpand.ancestrality = 'grandparent+'
      }
    })
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
    return state
  } else {
    return state
  }
}

export function getRelativePageRanks(
  subgraphPageRanks,
  globalPageRanks,
  sensitivity
) {
  if (!globalPageRanks) return
  return (
    subgraphPageRanks &&
    Object.entries(subgraphPageRanks)
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

export async function getUpdatedExpansions(
  globalPageRanks,
  nodes,
  sensitivity
) {
  let add = {}
  let remove = {}
  nodes.forEach(node => {
    const leavesIn = node.emanationsIn
      .filter(link => link.leaf)
      .map(link => link.childName)
    const leavesOut = node.emanationsOut
      .filter(link => link.leaf)
      .map(link => link.childName)
    const { incoming, outgoing } = JSON.parse(localStorage.getItem(node.name))
    const topIncoming = getRelativePageRanks(
      incoming,
      globalPageRanks,
      sensitivity
    ).slice(0, leavesIn.length)
    const topOutgoing = getRelativePageRanks(
      outgoing,
      globalPageRanks,
      sensitivity
    ).slice(0, leavesOut.length)
    add = [
      ...add,
      ...topIncoming
        .filter(child => !leavesIn.contains(child))
        .map(n => ({ source: n, target: node.id })),
      ...topOutgoing
        .filter(child => !leavesOut.contains(child))
        .map(n => ({ source: node.id, target: n })),
    ]
    remove = [
      ...remove,
      ...leavesIn.filter(child => !topIncoming.contains(child)),
      ...leavesOut.filter(child => !topOutgoing.contains(child)),
    ]
  })
  return { add, remove }
}

const verticesAtOnce = 2
export async function getExpansion(globalPageRanks, nodeToExpand, sensitivity) {
  // use caching based on total parameters here as well as api params
  const storedValue = JSON.parse(localStorage.getItem(nodeToExpand.name))
  let incoming, outgoing
  if (storedValue) {
    ;({ incoming, outgoing } = storedValue)
  } else {
    ;({ incoming, outgoing } = await fetch(
      `http://127.0.0.1:8000/nodes/${nodeToExpand.name}.gov`
    ).then(response => response.json()))
    localStorage.setItem(
      nodeToExpand.name,
      JSON.stringify({
        incoming,
        outgoing,
      })
    )
  }
  const relativeIncoming = getRelativePageRanks(
    incoming,
    globalPageRanks,
    sensitivity
  )
  const relativeOutgoing = getRelativePageRanks(
    outgoing,
    globalPageRanks,
    sensitivity
  )
  if (
    nodeToExpand.sliceIndex >
    Math.max(relativeIncoming.length, relativeOutgoing.length)
  ) {
    return { incoming: null, outgoing: null }
  }
  const newSliceIndex = nodeToExpand.sliceIndex + verticesAtOnce
  const newIncoming = Object.keys(relativeIncoming).slice(
    nodeToExpand.sliceIndex,
    newSliceIndex
  )

  const newOutgoing = Object.keys(relativeOutgoing).slice(
    nodeToExpand.sliceIndex,
    newSliceIndex
  )
  return {
    incoming: newIncoming,
    outgoing: newOutgoing,
    sliceIndex: newSliceIndex,
  }
}
