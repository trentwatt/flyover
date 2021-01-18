import React, { useEffect, useReducer, useCallback } from 'react'
import { ForceGraph2D } from 'react-force-graph'
import { networkReducer, getExpansion } from './utilities'

const initialNetwork = {
  nodes: [{ id: 'ORIG: cdc.gov 000', name: 'cdc', type: 'orig' }],
  links: [],
}

export default function Graph() {
  const [state, dispatch] = useReducer(networkReducer, initialNetwork)
  const { nodes, links, globalPageRanks } = state
  useEffect(() => {
    fetch('http://127.0.0.1:8000/')
      .then(response => response.json())
      .then(globalPageRanks =>
        dispatch({ type: 'SET_GLOBAL_PAGERANKS', payload: globalPageRanks })
      )
  }, [])

  const handleNodeClick = useCallback(
    node => {
      getExpansion(globalPageRanks, node.id).then(({ incoming, outgoing }) =>
        dispatch({
          type: 'NODE_EXPANSION',
          payload: { incoming, outgoing, nodeToExpand: node },
        })
      )
    },
    [globalPageRanks]
  )
  console.log(state)
  return globalPageRanks && nodes?.length ? (
    <ForceGraph2D
      linkDirectionalParticles={3}
      graphData={{ nodes, links }}
      onNodeClick={handleNodeClick}
      nodeAutoColorBy="name"
      nodeCanvasObject={(node, ctx, globalScale) => {
        // console.log({ node, ctx, globalScale })
        const label = node.name
        const fontSize = 12 / globalScale
        ctx.font = `${fontSize}px Sans-Serif`
        const textWidth = ctx.measureText(label).width
        const bckgDimensions = [textWidth, fontSize].map(
          n => n + fontSize * 0.2
        ) // some padding

        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
        ctx.fillRect(
          node.x - bckgDimensions[0] / 2,
          node.y - bckgDimensions[1] / 2,
          ...bckgDimensions
        )

        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillStyle = node.color
        ctx.fillText(label, node.x, node.y)
      }}
    />
  ) : null
}
