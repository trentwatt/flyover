import React, {
  useEffect,
  useReducer,
  useCallback,
  useRef,
  useState,
  // useMemo,
} from 'react'
import * as d3 from 'd3'
import { ForceGraph2D } from 'react-force-graph'
import { networkReducer, getExpansion } from './utilities'

const initialNetwork = {
  graphData: {
    nodes: [
      { id: 'ORIG: cdc.gov 000', name: 'cdc', type: 'orig', leaf: false },
    ],
    links: [],
  },
}

export default function Graph() {
  const graphRef = useRef()
  const [state, dispatch] = useReducer(networkReducer, initialNetwork)
  const { graphData, globalPageRanks } = state
  // const [highlightNodes, setHighlightNodes] = useState(new Set())
  // const [highlightLinks, setHighlightLinks] = useState(new Set())
  const [hoverNode, setHoverNode] = useState(null)
  const [lastHoverNode, setLastHoverNode] = useState(null)
  // const updateHighlight = () => {
  //   setHighlightNodes(highlightNodes)
  //   setHighlightLinks(highlightLinks)
  // }
  useEffect(() => {
    fetch('http://127.0.0.1:8000/')
      .then(response => response.json())
      .then(globalPageRanks =>
        dispatch({ type: 'SET_GLOBAL_PAGERANKS', payload: globalPageRanks })
      )
  }, [])
  useEffect(() => {
    document.title = lastHoverNode ? lastHoverNode.name : 'no node hovered'
  }, [lastHoverNode])
  useEffect(() => {
    console.log(`node hovered: ${JSON.stringify(hoverNode, null, 2)}`)
  }, [hoverNode])
  useEffect(() => {
    const graph = graphRef.current

    if (graph) {
      graph
        .d3Force(
          'link',
          d3
            .forceLink()
            .id(d => d.id)
            .distance(0)
            .strength(1)
        )
        .d3Force('charge', d3.forceManyBody().strength(-50))
    }
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

  const handleNodeHover = useCallback(node => {
    setHoverNode(node || null)
    if (node) {
      setLastHoverNode(node)
    }
    // highlightNodes.clear()
    // highlightLinks.clear()
    // console.log(node)
    // if (node) {
    //   highlightNodes.add(node)
    //   // node.neighbors.forEach(neighbor => highlightNodes.add(neighbor))
    //   // node.links.forEach(link => highlightLinks.add(link))
    // }
    // setHoverNode(node || null)
    // updateHighlight()
  }, [])
  // const handleLinkHover = link => {
  //   highlightNodes.clear()
  //   highlightLinks.clear()
  //   if (link) {
  //     highlightLinks.add(link)
  //     highlightNodes.add(link.source)
  //     highlightNodes.add(link.target)
  //   }
  //   updateHighlight()
  // }
  const paintNode = (node, ctx, globalScale) => {
    const label = node.name
    const fontSize =
      (12 / globalScale) * (node.name === hoverNode?.name ? 3 : 1.0)
    ctx.font = `${fontSize}px Sans-Serif`
    const textWidth = ctx.measureText(label).width
    const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2) // some padding

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
  }
  return globalPageRanks && graphData?.nodes?.length ? (
    <div className="App" style={{ display: 'flex' }}>
      <div style={{ width: '80vw' }}>
        {/* {React.memo( */}
        <ForceGraph2D
          ref={graphRef}
          linkDirectionalParticles={3}
          graphData={graphData}
          onNodeClick={handleNodeClick}
          onNodeHover={handleNodeHover}
          // onLinkHover={handleLinkHover}
          nodeAutoColorBy="name"
          nodeCanvasObject={paintNode}
        />
        {/* )} */}
      </div>
      {/* <iframe
        src={lastHoverNode ? `https://${lastHoverNode}.gov` : 'about:blank'}
        title="Preview"
        style={{ width: '20vw' }}
      /> */}
    </div>
  ) : null
}
