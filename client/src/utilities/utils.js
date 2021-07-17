import { v4 as uuid } from "uuid"
import { baseUrl, displayNameForName } from "../config"

export function nameForId(id) {
  return id.split(" ")[1]
}

export function jsonLog(x) {
  console.log(JSON.stringify(x, null, 2))
  return x
}

export function altitudeForSensitivity(sensitivity) {
  return 30000 - 30000 * sensitivity
}

export function sensitivityForAltitude(altitude) {
  return -altitude / 30000 + 1
}

export function idForLink(link) {
  if (!new Set(["in", "out", "orig"]).has(link.type)) {
    console.log({ link })
    throw new Error("invalid node type")
  }
  return `${link.type} ${link.parentId} ${
    link.childName || nameForId(link.childId)
  }`
}

export function genIdFromName(name, type) {
  type = type.toLowerCase()
  if (type !== "in" && type !== "out" && type !== "orig") {
    throw new Error("invalid node type")
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

export async function getSubgraphData(name) {
  const storedValue = JSON.parse(localStorage.getItem(name))
  let incomingPageRanks,
    outgoingPageRanks,
    inVertices,
    outVertices,
    vRank,
    totalVertices
  if (storedValue) {
    ;({
      incomingPageRanks,
      outgoingPageRanks,
      inVertices,
      outVertices,
      vRank,
      totalVertices,
    } = storedValue)
  } else {
    ;({
      pagerank_in_original: { rank: vRank, total: totalVertices },
      incoming: {
        num_vertices: inVertices,

        subgraph_pageranks: incomingPageRanks,
      },
      outgoing: {
        num_vertices: outVertices,
        subgraph_pageranks: outgoingPageRanks,
      },
    } = await fetch(`${baseUrl}/subgraph_pagerank/${name}`).then(response =>
      response.json()
    ))
    localStorage.setItem(
      name,
      JSON.stringify({
        incomingPageRanks,
        outgoingPageRanks,
        inVertices,
        outVertices,
        vRank,
        totalVertices,
      })
    )
  }

  return {
    incomingPageRanks,
    outgoingPageRanks,
    inVertices,
    outVertices,
    vRank,
    totalVertices,
  }
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

export function nameForNode(node) {
  return nameForId(node.id)
}
