import React, { useEffect, useReducer } from 'react'
import { ForceGraph2D } from 'react-force-graph'
import { expandGraph } from './utilities'

const initialNode = 'ORIG: cdc.gov 000'
const initialNetwork = { nodes: [{ id: initialNode, type: 'orig' }], links: [] }

export default function Graph() {
  const [state, dispatch] = useReducer(expandGraph, initialNetwork)
  useEffect(() => {
    fetch('http://127.0.0.1:8000/')
      .then(response => response.json())
      .then(globalPageRanks =>
        dispatch({ type: 'INITIAL_DOWNLOAD', payload: { globalPageRanks } })
      )
  }, [])

  return <ForceGraph2D graphData={{ node: state.nodes, links: state.links }} />
}
