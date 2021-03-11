import React, {
  useEffect,
  useReducer,
  useCallback,
  useRef,
  useState,
  // useMemo,
} from 'react'
import {
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
} from '@chakra-ui/react'
import * as d3 from 'd3'
import { ForceGraph2D } from 'react-force-graph'
import { nodeUpdate } from './utilities/nodeUpdate'
import { sensUpdate } from './utilities/sensUpdate'
import { initialState, networkReducer } from './utilities/reducer'

export default function Graph() {
  const graphRef = useRef()
  const [sensitivity, setSensitivity] = useState(0.75)
  const [state, dispatch] = useReducer(networkReducer, initialState)
  const { graphData, globalPageRanks, nodeDetails } = state
  const [hoverNode, setHoverNode] = useState(null)
  const [lastHoverNode, setLastHoverNode] = useState(null)

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
  useEffect(() => {}, [hoverNode])
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
      console.log('handling node click')
      nodeUpdate(globalPageRanks, nodeDetails, node, sensitivity).then(
        edges =>
          edges &&
          edges.forEach(edge => dispatch({ type: 'ADD_EDGE', payload: edge }))
      )
    },
    [globalPageRanks, sensitivity, nodeDetails]
  )

  const handleNodeHover = useCallback(node => {
    setHoverNode(node || null)
    if (node) {
      setLastHoverNode(node)
    }
  }, [])

  const handleSensitivityUpdate = useCallback(
    async sensitivity => {
      if (!graphData.links.length) {
        return
      }
      setSensitivity(sensitivity)
      console.log('handling sensitivity update')
      const { add, del } = sensUpdate(globalPageRanks, nodeDetails, sensitivity)
      console.log({ addLen: add.length, delLen: del.length })
      add.forEach(edge => dispatch({ type: 'ADD_EDGE', payload: edge }))
      del.forEach(edge => dispatch({ type: 'DEL_EDGE', payload: edge }))
    },
    [globalPageRanks, nodeDetails, graphData.links.length] // nodeDetails, globalPageRanks, graphData.links.length
  )
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
  const particlesForSensitivity = link =>
    link._sensitivity <= 0.25
      ? 1
      : link._sensitivity <= 0.5
      ? 2
      : link._sensitivity <= 0.75
      ? 3
      : 4

  return globalPageRanks && graphData?.nodes?.length ? (
    <div className="App" style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: '80vh' }}>
        {/* {React.memo( */}
        <ForceGraph2D
          ref={graphRef}
          linkDirectionalParticles={particlesForSensitivity}
          linkColor="black"
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
        <
      /> */}
      <div style={{ width: '80vw', display: 'flex', justifyContent: 'center' }}>
        <Slider
          aria-label="slider-ex-1"
          min={0}
          max={1}
          step={0.025}
          defaultValue={sensitivity}
          onChange={handleSensitivityUpdate}
        >
          <SliderTrack>
            <SliderFilledTrack />
          </SliderTrack>
          <SliderThumb />
        </Slider>
      </div>
    </div>
  ) : null
}
