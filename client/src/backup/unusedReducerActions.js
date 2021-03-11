if (action.type === 'NODE_EXPANSION') {
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
  // const existingNodes = state.graphData.nodes
  // const existingLinks = state.graphData.links
  const {
    graphData: { nodes: existingNodes, links: existingLinks },
    linkDetails,
    nodeDetails,
    childrenOut,
    childrenIn,
  } = state

  const newIncomingNodes = incoming.map(name => ({
    id: genIdFromName(name, 'in'),
    name: name,
    displayName: displayNameForName(name),
    type: 'in',
    parent: nodeToExpand.id,
    sliceIndex: 0,
  }))

  const newOutgoingNodes = outgoing.map(name => ({
    id: genIdFromName(name, 'out'),
    name: name,
    displayName: displayNameForName(name),
    type: 'out',
    parent: nodeToExpand.id,
    sliceIndex: 0,
  }))
  const newNodes = [...newIncomingNodes, ...newOutgoingNodes]
  const newIncomingLinks = newIncomingNodes.map(({ id }) => ({
    source: id,
    target: nodeToExpand.id,
    parent: nodeToExpand.id,
    type: 'in',
    child: id,
    _sensitivity: sensitivity,
  }))
  const newOutgoingLinks = newOutgoingNodes.map(({ id }) => ({
    source: nodeToExpand.id,
    target: id,
    parent: nodeToExpand.id,
    type: 'out',
    child: id,
    _sensitivity: sensitivity,
  }))
  const newLinks = [...newIncomingLinks, ...newOutgoingLinks]
  newLinks.forEach(link => {
    const linkId = idForLink(link)
    linkDetails[linkId] = { leaf: true }
  })
  nodeToExpand.sliceIndex = sliceIndex

  const newchildrenOut = {
    ...childrenOut,
    [nodeToExpand.id]: [
      ...childrenOut[nodeToExpand.id],
      ...newOutgoingNodes.map(n => ({ id: n.id, name: n.name, leaf: true })),
    ],
    ...newOutgoingNodes
      .map(({ id }) => ({ [id]: [] }))
      .reduce((a, b) => ({ ...a, ...b })),
    ...newIncomingNodes
      .map(({ id }) => ({ [id]: [] }))
      .reduce((a, b) => ({ ...a, ...b })),
  }

  const newchildrenIn = {
    ...childrenIn,
    [nodeToExpand.id]: [
      ...childrenIn[nodeToExpand.id],
      ...newIncomingNodes.map(n => ({ id: n.id, name: n.name, leaf: true })),
    ],
    ...newOutgoingNodes
      .map(({ id }) => ({ [id]: [] }))
      .reduce((a, b) => ({ ...a, ...b })),
    ...newIncomingNodes
      .map(({ id }) => ({ [id]: [] }))
      .reduce((a, b) => ({ ...a, ...b })),
  }

  existingNodes.forEach(node => {
    if (node.id === nodeToExpand.parent) {
      if (nodeToExpand.type === 'in') {
        newchildrenIn[nodeToExpand.parent].forEach(emanNode => {
          if (emanNode.id === nodeToExpand.id) {
            emanNode.leaf = false
          }
        })
      } else if (nodeToExpand.type === 'out') {
        newchildrenOut[nodeToExpand.parent].forEach(emanNode => {
          if (emanNode.id === nodeToExpand.id) {
            emanNode.leaf = false
          }
        })
      }
    }
  })

  existingLinks.forEach(link => {
    if (link.child === nodeToExpand.id) {
      link.leaf = false
    }
  })
  const nodes = [...existingNodes, ...newNodes]
  return {
    ...state,
    graphData: {
      nodes,
      links: [...existingLinks, ...newLinks],
    },
    childrenIn: newchildrenIn,
    childrenOut: newchildrenOut,
    nodeDetails,
    linkDetails,
  }
} else if (action.type === 'SENSITIVITY_UPDATE') {
  action.payload.remove.forEach(({ source, target, child }) => {
    for (const link of state.graphData.links) {
      if (link.source.id === source && link.target.id === target) {
        link.shouldBeDeleted = true
        break
      }
    }
    for (const node of state.graphData.nodes) {
      if (node.id === child) {
        node.shouldBeDeleted = true
      }
    }
  })
  let updatedLinks = state.graphData.links.filter(link => !link.shouldBeDeleted)
  let updatedNodes = state.graphData.nodes.filter(node => !node.shouldBeDeleted)
  action.payload.add.forEach(({ source, target, parent, child }) => {
    if (source === parent) {
      //  i.e. it is outgoing
      const childId = genIdFromName(child, 'out')
      updatedLinks = [
        ...updatedLinks,
        {
          source: source,
          target: childId,
          parent: parent,
          child: childId,
          _sensitivity: action.payload.sensitivity,
        },
      ]
      updatedNodes = [
        ...updatedNodes,
        {
          id: childId,
          name: target,
          type: 'out',
          parent: parent,
          sliceIndex: 0,
        },
      ]
    } else {
      // i.e. it is incoming
      const childId = genIdFromName(child, 'in')
      updatedLinks = [
        ...updatedLinks,
        {
          source: childId,
          target: parent,
          parent: parent,
          child: childId,
          _sensitivity: action.payload.sensitivity,
        },
      ]
      updatedNodes = [
        ...updatedNodes,
        {
          id: childId,
          name: source,
          type: 'in',
          parent: parent,
          sliceIndex: 0,
        },
      ]
    }
  })
  return {
    ...state,
    graphData: {
      nodes: updatedNodes,
      links: updatedLinks,
    },
  }
}
