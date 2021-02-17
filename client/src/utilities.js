import { v4 as uuid } from 'uuid'
function nameForId(id) {
  return id.split(' ')[1]
}

function displayNameForName(name) {
  return name.split('.')[0]
}

function idForEdge(edge) {
  return `${edge.type} ${edge.parent} ${edge.child}`
}

function nameForDisplayName(displayName) {
  return `${displayName}.gov`
}

function genIdFromName(name, type) {
  type = type.toLowerCase()
  if (type !== 'in' && type !== 'out') {
    throw new Error('wierd')
  }
  return `${type}: ${name} ${uuid()}`
}

export function networkReducer(state, action) {
  if (action.type === 'SET_GLOBAL_PAGERANKS') {
    return {
      graphData: state.graphData,
      emanationsOut: state.emanationsOut,
      emanationsIn: state.emanationsIn,
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
    const newIncomingNodes = incoming.map(name => ({
      id: genIdFromName(name, 'in'),
      name: displayNameForName(name),
      type: 'in',
      parent: nodeToExpand.id,
      sliceIndex: 0,
    }))

    const newOutgoingNodes = outgoing.map(name => ({
      id: genIdFromName(name, 'out'),
      name: displayNameForName(name),
      type: 'out',
      parent: nodeToExpand.id,
      sliceIndex: 0,
    }))
    const newNodes = [...newIncomingNodes, ...newOutgoingNodes]
    const newIncomingLinks = newIncomingNodes.map(({ id, name }) => ({
      source: id,
      target: nodeToExpand.id,
      parent: nodeToExpand.id,
      child: id,

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

    nodeToExpand.sliceIndex = sliceIndex

    const newEmanationsOut = {
      ...state.emanationsOut,
      [nodeToExpand.id]: [
        ...state.emanationsOut[nodeToExpand.id],
        ...newOutgoingNodes.map(n => ({ id: n.id, name: n.name, leaf: true })),
      ],
      ...newOutgoingNodes
        .map(({ id }) => ({ [id]: [] }))
        .reduce((a, b) => ({ ...a, ...b })),
      ...newIncomingNodes
        .map(({ id }) => ({ [id]: [] }))
        .reduce((a, b) => ({ ...a, ...b })),
    }

    const newEmanationsIn = {
      ...state.emanationsIn,
      [nodeToExpand.id]: [
        ...state.emanationsIn[nodeToExpand.id],
        ...newIncomingNodes.map(n => ({ id: n.id, name: n.name, leaf: true })),
      ],
      ...newOutgoingNodes
        .map(({ id }) => ({ [id]: [] }))
        .reduce((a, b) => ({ ...a, ...b })),
      ...newIncomingNodes
        .map(({ id }) => ({ [id]: [] }))
        .reduce((a, b) => ({ ...a, ...b })),
    }

    const existingNodes = state.graphData.nodes
    existingNodes.forEach(node => {
      if (node.id === nodeToExpand.parent) {
        if (nodeToExpand.type === 'in') {
          newEmanationsIn[nodeToExpand.parent].forEach(emanNode => {
            if (emanNode.id === nodeToExpand.id) {
              emanNode.leaf = false
            }
          })
        } else if (nodeToExpand.type === 'out') {
          newEmanationsOut[nodeToExpand.parent].forEach(emanNode => {
            if (emanNode.id === nodeToExpand.id) {
              emanNode.leaf = false
            }
          })
        }
      }
    })
    const existingLinks = state.graphData.links
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
      emanationsIn: newEmanationsIn,
      emanationsOut: newEmanationsOut,
    }
  } else if (action.type === 'SENSITIVITY_UPDATE') {
    action.payload.add.length &&
      console.log(`add: ${JSON.stringify(action.payload.add, null, 2)}`)
    action.payload.remove.length &&
      console.log(`remove: \n${JSON.stringify(action.payload.remove, null, 2)}`)
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
    // console.log(state.graphData.links)
    let updatedLinks = state.graphData.links.filter(
      link => !link.shouldBeDeleted
    )
    let updatedNodes = state.graphData.nodes.filter(
      node => !node.shouldBeDeleted
    )
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
  emanationsIn,
  emanationsOut,
  sensitivity
) {
  let add = []
  let remove = []

  Object.entries(emanationsOut).forEach(([nodeId, nodeEmanOut]) => {
    console.log({ nodeId, nodeEmanOut })
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
      .map(([vertex, score]) => vertex.split('.')[0])
      .filter(x => !nonLeavesOut.map(n => n.name).includes(x))
      .slice(0, leavesOut.length)
    const addOutgoingEdges = topOutgoing
      .filter(nodeName => !nodeEmanOut.map(n => n.name).includes(nodeName))
      .map(nodeName => ({
        source: nodeId,
        target: nodeName,
        parent: nodeId,
        child: nodeName,
      }))
    const removeOutgoingEdges = leavesOut
      .filter(child => !topOutgoing.includes(child.name))
      .map(n => ({
        source: nodeId,
        target: n.id,
        parent: nodeId,
        child: n.id,
      }))

    add = [...add, ...addOutgoingEdges]
    remove = [...remove, ...removeOutgoingEdges]
  })
  Object.entries(emanationsIn).forEach(([nodeId, nodeEmanIn]) => {
    console.log({ nodeId, nodeEmanIn })
    const leavesIn = nodeEmanIn.filter(n => n.leaf)
    const nonLeavesIn = nodeEmanIn.filter(n => !n.leaf)

    const storedValue = JSON.parse(localStorage.getItem(nameForId(nodeId)))
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
      .filter(nodeName => !nodeEmanIn.map(n => n.name).includes(nodeName))
      .map(nodeName => ({
        source: nodeName,
        parent: nodeId,
        target: nodeId,
        child: nodeName,
      }))

    const removeIncomingEdges = leavesIn
      .filter(n => !topIncoming.includes(n.name))
      .map(n => ({
        source: n.id,
        target: nodeId,
        parent: nodeId,
        child: n.id,
      }))

    add = [...add, ...addIncomingEdges]
    remove = [...remove, ...removeIncomingEdges]
  })
  return { add, remove }
}

export async function getSubgraphScores(nodeName) {
  const storedValue = JSON.parse(localStorage.getItem(nodeName))
  let incoming, outgoing
  if (storedValue) {
    ;({ incoming, outgoing } = storedValue)
  } else {
    ;({ incoming, outgoing } = await fetch(
      `http://127.0.0.1:8000/nodes/${nodeName}.gov`
    ).then(response => response.json()))
    localStorage.setItem(
      nodeName,
      JSON.stringify({
        incoming,
        outgoing,
      })
    )
  }

  return { incoming, outgoing }
}
const verticesAtOnce = 2
export async function getExpansion(globalPageRanks, nodeToExpand, sensitivity) {
  // use caching based on total parameters here as well as api params
  const { incoming, outgoing } = await getSubgraphScores(nodeToExpand.name)
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
