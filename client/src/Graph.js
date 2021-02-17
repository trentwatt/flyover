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
import { networkReducer, getExpansion, getUpdatedExpansions } from './utilities'

const initialNetwork = {
  graphData: {
    nodes: [
      {
        id: 'ORIG: cdc.gov 0000',
        name: 'cdc',
        type: 'orig',
        ancestrality: 'leaf',
        sliceIndex: 0,
      },
    ],

    links: [],
  },
  nodeDetails: { 'ORIG: cdc.gov 0000': {} },
  edgeDetails: {},
  emanationsIn: { 'ORIG: cdc.gov 0000': [] },
  emanationsOut: { 'ORIG: cdc.gov 0000': [] },
}

export default function Graph() {
  const graphRef = useRef()
  const [sensitivity, setSensitivity] = useState(0.75)
  const [state, dispatch] = useReducer(networkReducer, initialNetwork)
  const { graphData, globalPageRanks, emanationsOut, emanationsIn } = state
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
  useEffect(() => {
    // console.log(`node hovered: ${JSON.stringify(hoverNode, null, 2)}`)
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
      getExpansion(globalPageRanks, node, sensitivity).then(
        ({ incoming, outgoing, sliceIndex }) =>
          dispatch({
            type: 'NODE_EXPANSION',
            payload: {
              incoming,
              outgoing,
              nodeToExpand: node,
              sensitivity,
              sliceIndex,
            },
          })
      )
    },
    [globalPageRanks, sensitivity]
  )

  const handleNodeHover = useCallback(node => {
    setHoverNode(node || null)
    if (node) {
      setLastHoverNode(node)
    }
  }, [])

  const handleSensitivityUpdate = useCallback(
    sensitivity => {
      if (!graphData.links.length) {
        return
      }
      setSensitivity(sensitivity)
      getUpdatedExpansions(
        globalPageRanks,
        emanationsIn,
        emanationsOut,
        sensitivity
      ).then(({ add, remove }) =>
        dispatch({
          type: 'SENSITIVITY_UPDATE',
          payload: { sensitivity, add, remove },
        })
      )
    },
    [emanationsIn, emanationsOut, globalPageRanks, graphData.links.length]
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
          onChangeEnd={handleSensitivityUpdate}
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
