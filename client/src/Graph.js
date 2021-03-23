import React, {
  useEffect,
  useReducer,
  useCallback,
  useRef,
  useState,
  useMemo,
} from "react"
import Dropdown from "./Dropdown"
import SubgraphStats from "./SubgraphStats"

import { Slider } from "@reach/slider"
import "@reach/slider/styles.css"

import { nodeUpdate } from "./utilities/nodeUpdate"
import { sensUpdate } from "./utilities/sensUpdate"
import { networkReducer } from "./utilities/reducer"
import { ForceGraph2D } from "react-force-graph"
import { nameForId, nameForNode } from "./utilities/utils"

const initialNode = "cdc.gov"

const yellow = "#FFC300"
// const ruby = "#900C3F"
const maroon = "#581845"
export default function Graph() {
  const graphRef = useRef()
  const [sensitivity, setSensitivity] = useState(0.75)
  const [state, dispatch] = useReducer(networkReducer, {})
  const { graphData, globalPageRanks, nodeDetails } = state
  const allNodes = useMemo(
    () => globalPageRanks && Object.keys(globalPageRanks).sort(),
    [globalPageRanks]
  )

  const [hoverNode, setHoverNode] = useState(null)
  const [highlightNode, setHighlightNode] = useState(initialNode)

  useEffect(() => {
    fetch("http://127.0.0.1:8000/")
      .then(response => response.json())
      .then(globalPageRanks =>
        dispatch({ type: "SET_GLOBAL_PAGERANKS", payload: globalPageRanks })
      )
      .then(() =>
        dispatch({ type: "START_NEW", payload: { nodeName: initialNode } })
      )
  }, [])

  const handleNodeHover = useCallback((node, ctx, globalScale) => {
    setHoverNode((node && nameForNode(node)) || null)
  }, [])

  const handleNodeClick = useCallback(
    node => {
      setHighlightNode(nameForNode(node))
      nodeUpdate(globalPageRanks, nodeDetails, node, sensitivity).then(
        edges =>
          edges &&
          edges.forEach(edge => dispatch({ type: "ADD_EDGE", payload: edge }))
      )
    },
    [globalPageRanks, sensitivity, nodeDetails]
  )

  const handleNodeRightClick = useCallback((node, event) => {
    event.preventDefault()
    setHighlightNode(nameForId(node.id))
  }, [])

  const handleSensitivityUpdate = useCallback(
    sensitivity => {
      setSensitivity(sensitivity)
      if (!graphData?.links?.length) {
        return
      }
      const { add, del } = sensUpdate(globalPageRanks, nodeDetails, sensitivity)
      add.forEach(edge => dispatch({ type: "ADD_EDGE", payload: edge }))
      del.forEach(edge => dispatch({ type: "DEL_EDGE", payload: edge }))
    },
    [globalPageRanks, nodeDetails, graphData?.links?.length] // nodeDetails, globalPageRanks, graphData.links.length
  )

  const paintNode = (node, ctx, globalScale) => {
    const name = nameForId(node.id)
    const fontSize = (12 / globalScale) * (name === hoverNode ? 2.5 : 1.0)
    ctx.font = `${fontSize}px Sans-Serif`
    const textWidth = ctx.measureText(name).width
    const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2) // some padding
    ctx.fillStyle = "transparent"
    ctx.fillRect(
      node.x - bckgDimensions[0] / 2,
      node.y - bckgDimensions[1] / 2,
      ...bckgDimensions
    )
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillStyle = node.color
    ctx.fillText(name, node.x, node.y)
    node.__bckgDimensions = bckgDimensions
  }

  const particlesForSensitivity = useCallback(
    link =>
      link._sensitivity <= 0.25
        ? 1
        : link._sensitivity <= 0.5
        ? 2
        : link._sensitivity <= 0.75
        ? 3
        : 4,
    []
  )

  return globalPageRanks && graphData?.nodes?.length ? (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div>
        <h4 style={{ color: yellow }} autoFocus>
          Start New Graph
        </h4>
        {allNodes && (
          <Dropdown
            allNodes={allNodes}
            dispatch={dispatch}
            setHighlightNode={setHighlightNode}
          />
        )}
      </div>
      <div
        style={{
          display: "flex",
          position: "absolute",
          margin: 0,
          padding: 0,
          top: "12vh",
          left: "3vw",
        }}
      >
        <div
          style={{ width: "70vw", display: "flex", flexDirection: "column" }}
        >
          <div
            style={{
              display: "flex",
              border: `2px solid ${yellow}`,
              margin: "2em",
            }}
          >
            <ForceGraph2D
              width={window.innerWidth * 0.6}
              height={window.innerHeight * 0.7}
              ref={graphRef}
              linkDirectionalParticles={particlesForSensitivity}
              backgroundColor={maroon}
              linkColor="yellow"
              graphData={graphData}
              onNodeClick={handleNodeClick}
              onNodeRightClick={handleNodeRightClick}
              onNodeHover={handleNodeHover}
              nodeAutoColorBy="displayName"
              nodeCanvasObject={paintNode}
              nodePointerAreaPaint={(node, color, ctx) => {
                ctx.fillStyle = color
                const bckgDimensions = node.__bckgDimensions
                bckgDimensions &&
                  ctx.fillRect(
                    node.x - bckgDimensions[0] / 2,
                    node.y - bckgDimensions[1] / 2,
                    ...bckgDimensions
                  )
              }}
            />
          </div>
          <div style={{ margin: "1vmax" }}>
            <Slider
              style={{ background: maroon }}
              value={sensitivity}
              onChange={handleSensitivityUpdate}
              min={0}
              max={1}
              step={0.025}
            />
            <p style={{ color: "#FFC300" }}>Sensitivity: {sensitivity}</p>
          </div>

          {/* <h1>{lastHoverNode}</h1> */}

          {/*  */}
        </div>
        <div
          style={{
            width: "22vw",
            margin: "1vw",
          }}
        >
          <h2>
            <a
              href={`https://${highlightNode}`}
              target="_blank"
              rel="noreferrer"
            >
              {highlightNode}
            </a>
          </h2>
          <SubgraphStats highlightNode={highlightNode} />
          <iframe
            key={highlightNode}
            src={
              highlightNode
                ? `http://127.0.0.1:8000/proxy/${highlightNode}`
                : "about:blank" // replace about.blank with a site that gives info
            }
            title="Preview"
            style={{
              width: "100%",
              height: "90%",
              overflow: "auto",

              border: `3px solid ${yellow}`,
            }}
            // sandbox
          />
        </div>
      </div>
    </div>
  ) : null
}
