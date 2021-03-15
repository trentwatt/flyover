import React, {
  useEffect,
  useReducer,
  useCallback,
  useRef,
  useState,
  // useMemo,
} from "react"

import { useThrottle } from "react-use"

import { Slider } from "@reach/slider"
import "@reach/slider/styles.css"
import {
  Combobox,
  ComboboxInput,
  ComboboxPopover,
  ComboboxList,
  ComboboxOption,
  // ComboboxOptionText,
} from "@reach/combobox"
import "@reach/combobox/styles.css"
import * as d3 from "d3"

import { nodeUpdate } from "./utilities/nodeUpdate"
import { sensUpdate } from "./utilities/sensUpdate"
import { networkReducer } from "./utilities/reducer"
import { ForceGraph2D } from "react-force-graph"

const matchSorter = (allNodes, term, args) => {
  console.log({ allNodes })
  return allNodes.filter(node => node.includes(term))
}

export default function Graph() {
  const graphRef = useRef()
  const [sensitivity, setSensitivity] = useState(0.75)
  const [state, dispatch] = useReducer(networkReducer, {})
  const { graphData, globalPageRanks, nodeDetails } = state
  const allNodes = globalPageRanks && Object.keys(globalPageRanks)
  const allNodesSet = allNodes && new Set([...allNodes])
  const [hoverNode, setHoverNode] = useState(null)
  const [lastHoverNode, setLastHoverNode] = useState(null)

  const [term, setTerm] = React.useState("")
  const results = useCityMatch(term)
  const handleNodeSearchChange = event => {
    const nodeName = event.target.value
    if (allNodesSet.has(nodeName)) {
      dispatch({ type: "START_NEW", payload: { nodeName } })
      setTerm("")
    } else {
      setTerm(nodeName)
    }
  }
  // const [startNodeName, setStartNodeName] = useState("");
  // const handleChange = event => setStartNodeName(event.target.value);
  function useCityMatch(term) {
    const throttledTerm = useThrottle(term, 100)
    return React.useMemo(
      () => (term.trim() === "" ? null : matchSorter(allNodes, term)),
      [throttledTerm]
    )
  }

  useEffect(() => {
    fetch("http://127.0.0.1:8000/")
      .then(response => response.json())
      .then(globalPageRanks =>
        dispatch({ type: "SET_GLOBAL_PAGERANKS", payload: globalPageRanks })
      )
      .then(() =>
        dispatch({ type: "START_NEW", payload: { nodeName: "hhs.gov" } })
      )
  }, [])
  useEffect(() => {
    document.title = lastHoverNode ? lastHoverNode.name : "no node hovered"
  }, [lastHoverNode])
  useEffect(() => {}, [hoverNode])
  useEffect(() => {
    const graph = graphRef.current

    if (graph) {
      graph
        .d3Force(
          "link",
          d3
            .forceLink()
            .id(d => d.id)
            .distance(0)
            .strength(1)
        )
        .d3Force("charge", d3.forceManyBody().strength(-50))
    }
  }, [])

  const handleNodeClick = useCallback(
    node => {
      // node.fx = node.x
      // node.fy = node.y
      nodeUpdate(globalPageRanks, nodeDetails, node, sensitivity).then(
        edges =>
          edges &&
          edges.forEach(edge => dispatch({ type: "ADD_EDGE", payload: edge }))
      )
    },
    [globalPageRanks, sensitivity, nodeDetails]
  )

  const handleNodeHover = useCallback(node => {
    setHoverNode(node || null)
    if (node) {
      setLastHoverNode(`${node.name}.gov`)
    }
  }, [])

  const handleSensitivityUpdate = useCallback(
    sensitivity => {
      setSensitivity(sensitivity)
      if (!graphData?.links?.length) {
        return
      }

      console.log("handling sensitivity update")
      const { add, del } = sensUpdate(globalPageRanks, nodeDetails, sensitivity)
      add.forEach(edge => dispatch({ type: "ADD_EDGE", payload: edge }))
      del.forEach(edge => dispatch({ type: "DEL_EDGE", payload: edge }))
    },
    [globalPageRanks, nodeDetails, graphData?.links?.length] // nodeDetails, globalPageRanks, graphData.links.length
  )
  const paintNode = (node, ctx, globalScale) => {
    const label = node.name
    const fontSize =
      (12 / globalScale) * (node.name === hoverNode?.name ? 3 : 1.0)
    ctx.font = `${fontSize}px Sans-Serif`
    const textWidth = ctx.measureText(label).width
    const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2) // some padding

    ctx.fillStyle = "rgba(255, 255, 255, 0.8)"
    ctx.fillRect(
      node.x - bckgDimensions[0] / 2,
      node.y - bckgDimensions[1] / 2,
      ...bckgDimensions
    )

    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillStyle = node.color
    ctx.fillText(label, node.x, node.y)
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
        <h4>Start New Graph</h4>
        <Combobox
          aria-label="Nodes"
          onSelect={nodeName => {
            dispatch({
              type: "START_NEW",
              payload: { nodeName },
            })
          }}
        >
          <ComboboxInput
            selectOnClick={true}
            className="node-search-input"
            onChange={handleNodeSearchChange}
          />
          {results && (
            <ComboboxPopover className="shadow-popup">
              {results.length > 0 ? (
                <ComboboxList>
                  {results.slice(0, 10).map((result, index) => (
                    <ComboboxOption key={index} value={result} />
                  ))}
                </ComboboxList>
              ) : (
                <span style={{ display: "block", margin: 8 }}>
                  No results found
                </span>
              )}
            </ComboboxPopover>
          )}
        </Combobox>
      </div>
      <div style={{ display: "flex" }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <ForceGraph2D
            width={window.innerWidth * 0.75}
            height={window.innerHeight * 0.8}
            ref={graphRef}
            linkDirectionalParticles={particlesForSensitivity}
            backgroundColor="dark"
            linkColor="black"
            graphData={graphData}
            onNodeClick={handleNodeClick}
            onNodeHover={handleNodeHover}
            // onLinkHover={handleLinkHover}
            nodeAutoColorBy="name"
            nodeCanvasObject={paintNode}
          />
          <div style={{ margin: "24" }}>
            <Slider
              value={sensitivity}
              onChange={handleSensitivityUpdate}
              min={0}
              max={1}
              step={0.025}
            />
            <p>Sensitivity: {sensitivity}</p>
          </div>
        </div>
        {/* <h1>{lastHoverNode}</h1> */}

        <iframe
          key={lastHoverNode}
          src={
            lastHoverNode
              ? `http://127.0.0.1:8000/proxy/${lastHoverNode}`
              : "about:blank" // replace about.blank with a site that gives info
          }
          title="Preview"
          style={{ width: "25vw", height: "80vh", overflow: "auto" }}
        />
      </div>
    </div>
  ) : null
}
