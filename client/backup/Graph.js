import React, { useReducer, useState, useMemo } from "react"
import Dropdown from "./Dropdown"
import Sidebar from "../src/components/Sidebar"
import SensSlider from "../src/components/SensSlider"
import Graph from "../src/components/Graph"

import { networkReducer } from "../src/utilities/reducer"

import { yellow } from "../src/utilities/colors"

const initialNode = "cdc.gov"

export default function Apps() {
  const [sensitivity, setSensitivity] = useState(0.75)
  const [state, dispatch] = useReducer(networkReducer, {})
  const { graphData, globalPageRanks } = state
  const allNodes = useMemo(
    () => globalPageRanks && Object.keys(globalPageRanks).sort(),
    [globalPageRanks]
  )

  const [highlightNode, setHighlightNode] = useState(initialNode)

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
          zIndex: -1,
          margin: 0,
          padding: 0,
          top: "12vh",
          left: "3vw",
        }}
      >
        <div
          style={{
            width: "70vw",
            display: "flex",
            flexDirection: "column",
            zIndex: -1,
          }}
        >
          <Graph
            state={state}
            dispatch={dispatch}
            setHighlightNode={setHighlightNode}
            sensitivity={sensitivity}
          />
          <SensSlider
            sensitivity={sensitivity}
            setSensitivity={setSensitivity}
            state={state}
            dispatch={dispatch}
          />
        </div>
        <Sidebar highlightNode={highlightNode} />
      </div>
    </div>
  ) : null
}
