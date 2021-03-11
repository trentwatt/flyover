Object.entries(childrenOut).forEach(([nodeId, nodeEmanOut]) => {
  const leavesOut = nodeEmanOut.filter(n => n.leaf)
  const nonLeavesOut = nodeEmanOut.filter(n => !n.leaf)
  const displayName = displayNameForName(nameForId(nodeId))
  const storedValue = JSON.parse(localStorage.getItem(displayName))
  if (leavesOut.length === 0 || !storedValue) {
    return
  }
  const { outgoing } = storedValue
  const topOutgoing = Object.entries(
    getRelativePageRanks(outgoing, globalPageRanks, sensitivity)
  )
    .map(([nodeName, _]) => nodeName)
    .filter(x => !nonLeavesOut.map(n => n.name).includes(x))
    .slice(0, leavesOut.length)
  const addOutgoingEdges = topOutgoing
    .filter(nodeName => !nodeEmanOut.map(n => n.name).includes(nodeName))
    .map(nodeName => ({
      source: nodeId,
      target: nodeName,
      parent: nodeId,
      child: nodeName,
      type: 'out',
    }))
  const removeOutgoingEdges = leavesOut
    .filter(child => !topOutgoing.includes(child.name))
    .map(n => ({
      source: nodeId,
      target: n.id,
      parent: nodeId,
      child: n.id,
      type: 'out',
    }))

  add = [...add, ...addOutgoingEdges]
  remove = [...remove, ...removeOutgoingEdges]
})
Object.entries(childrenIn).forEach(([parent, children]) => {
  const leavesIn = children.filter(n => n.leaf)
  const nonLeavesIn = children.filter(n => !n.leaf)

  const storedValue = JSON.parse(localStorage.getItem(nameForId(parent)))
  if (leavesIn.length === 0 || !storedValue) {
    return
  }
  const { incoming } = storedValue
  const topIncoming = Object.entries(
    getRelativePageRanks(incoming, globalPageRanks, sensitivity)
  )
    .map(([vertex, score]) => vertex.split('.')[0])
    .filter(x => !nonLeavesIn.map(n => n.name).includes(x))
    .slice(0, leavesIn.length)

  const addIncomingEdges = topIncoming
    .filter(childName => !children.map(n => n.name).includes(childName))
    .map(childName => ({
      source: childName,
      parent: parent,
      target: parent,
      child: childName,
      type: 'in',
    }))

  const removeIncomingEdges = leavesIn
    .filter(n => !topIncoming.includes(n.name))
    .map(n => ({
      source: n.id,
      target: parent,
      parent: parent,
      child: n.id,
      type: 'in',
    }))

  add = [...add, ...addIncomingEdges]
  remove = [...remove, ...removeIncomingEdges]
})
return { add, remove }
