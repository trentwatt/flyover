import { useCallback, useState, useRef } from "react"
import { nameForId, nameForNode } from "../utilities/utils"
import { ForceGraph2D } from "react-force-graph"
import { periwinkle, graphBackground } from "../utilities/colors"
import { nodeUpdate } from "../utilities/nodeUpdate"

const particlesForSensitivity = link =>
  link._sensitivity <= 0.25
    ? 1
    : link._sensitivity <= 0.5
    ? 2
    : link._sensitivity <= 0.75
    ? 3
    : 4

export default function Graph({
  state,
  dispatch,
  setHighlightNode,
  sensitivity,
}) {
  const { graphData, globalPageRanks, nodeDetails } = state
  const [hoverNode, setHoverNode] = useState(null)
  const graphRef = useRef()
  const handleNodeHover = useCallback((node, ctx, globalScale) => {
    setHoverNode((node && nameForNode(node)) || null)
  }, [])

  const paintNode = (node, ctx, globalScale) => {
    const name = nameForId(node.id)
    const fontSize = (16 / globalScale) * (name === hoverNode ? 2.5 : 1.0)
    ctx.font = `bold ${fontSize}px Courier New`
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

  const handleNodeClick = useCallback(
    node => {
      setHighlightNode(nameForNode(node))
      nodeUpdate(globalPageRanks, nodeDetails, node, sensitivity).then(
        edges =>
          edges &&
          edges.forEach(edge => dispatch({ type: "ADD_EDGE", payload: edge }))
      )
    },
    [globalPageRanks, sensitivity, nodeDetails, setHighlightNode, dispatch]
  )

  const handleNodeRightClick = useCallback(
    (node, event) => {
      event.preventDefault()
      setHighlightNode(nameForId(node.id))
    },
    [setHighlightNode]
  )
  return (
    <div
      style={{
        display: "flex",
        border: `1px solid ${periwinkle}`,
        margin: "2em",
        background: graphBackground,
      }}
    >
      <ForceGraph2D
        width={window.innerWidth * 0.6}
        height={window.innerHeight * 0.7}
        ref={graphRef}
        linkDirectionalParticles={particlesForSensitivity}
        backgroundColor={graphBackground}
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
  )
}
