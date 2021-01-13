import React, { useEffect, useReducer } from 'react'
import { ForceGraph2D } from 'react-force-graph'
import graphReducer from '../graphReducer'
const sensitivity = 0.75

function processData(subgraphsPageRanks, globalPageRank) {
  if (!globalPageRank) return
  const normalize = subgraphRanks =>
    subgraphRanks &&
    Object.entries(subgraphRanks)
      .map(([vertex, score]) => ({
        [vertex]: score / globalPageRank[vertex] ** sensitivity,
      }))
      .sort((a, b) => {
        return Object.values(b)[0] - Object.values(a)[0]
      })
      .slice(0, 10)
      .reduce((a, b) => ({ ...a, ...b }))
  const { node, incoming, outgoing } = subgraphsPageRanks
  return { node, incoming: normalize(incoming), outgoing: normalize(outgoing) }
}

const initialState = {
  nodes: [
    {
      id: 'cdc.gov',
      name: 'cdc.gov',
      val: '1',
    },
  ],
  links: [],
}

export default function Graph({ node, globalPageRank, setNode }) {
  const [state, dispatch] = useReducer(graphReducer, initialState)
  console.log(JSON.stringify(state, null, 2))
  useEffect(() => {
    fetch(`http://127.0.0.1:8000/nodes/${node}`)
      .then(response => response.json())
      .then(subgraphPageRanks => processData(subgraphPageRanks, globalPageRank))
      .then(data => data && dispatch({ payload: data }))
  }, [node, globalPageRank])
  return <>{state?.links?.length && <ForceGraph2D graphData={state} />}</>
}
