import { v4 as uuid } from 'uuid'
export function nameForId(id) {
  return id.split(' ')[1]
}

export function jsonLog(x) {
  console.log(JSON.stringify(x, null, 2))
  return x
}

export function displayNameForName(name) {
  return name.split('.')[0]
}

export function idForLink(link) {
  if (!new Set(['in', 'out', 'orig']).has(link.type)) {
    console.log({ link })
    throw new Error('invalid node type')
  }
  return `${link.type} ${link.parentId} ${
    link.childName || nameForId(link.childId)
  }`
}

export function nameForDisplayName(displayName) {
  return `${displayName}.gov`
}

export function genIdFromName(name, type) {
  type = type.toLowerCase()
  if (type !== 'in' && type !== 'out' && type !== 'orig') {
    throw new Error('invalid node type')
  }
  return `${type}: ${name} ${uuid()}`
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
      .map(([node, score]) => ({
        node: node,
        score: score / globalPageRanks[node] ** sensitivity,
      }))
      .sort((a, b) => {
        return b.score - a.score
      })
      .slice(0, 10)
  )
}

export async function getSubgraphPageRanks(name) {
  const storedValue = JSON.parse(localStorage.getItem(name))
  let incomingPageRanks, outgoingPageRanks
  if (storedValue) {
    ;({ incomingPageRanks, outgoingPageRanks } = storedValue)
  } else {
    ;({
      incoming: incomingPageRanks,
      outgoing: outgoingPageRanks,
    } = await fetch(`http://127.0.0.1:8000/nodes/${name}`).then(response =>
      response.json()
    ))
    localStorage.setItem(
      name,
      JSON.stringify({
        incomingPageRanks,
        outgoingPageRanks,
      })
    )
  }

  return { incomingPageRanks, outgoingPageRanks }
}

export function setDifference(setA, setB) {
  let _difference = new Set(setA)
  for (let elem of setB) {
    _difference.delete(elem)
  }
  return _difference
}

export function displayNameForId(nodeId) {
  return displayNameForName(nameForId(nodeId))
}
