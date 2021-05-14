import React, { useEffect, useReducer, useState, useMemo } from "react"
import Dropdown from "./components/Dropdown"
import Sidebar from "./components/Sidebar"
import SensSlider from "./components/SensSlider"
import Graph from "./components/Graph"

import { baseUrl } from "./utilities/utils"

import { networkReducer } from "./utilities/reducer"

import { yellow } from "./utilities/colors"

const initialNode = "cdc.gov"

function App() {
  const [sensitivity, setSensitivity] = useState(0.75)
  const [state, dispatch] = useReducer(networkReducer, {})
  const { graphData, globalPageRanks } = state
  const allNodes = useMemo(
    () => globalPageRanks && Object.keys(globalPageRanks).sort(),
    [globalPageRanks]
  )

  useEffect(() => {
    fetch(`${baseUrl}`)
      .then(response => response.json())
      .then(globalPageRanks =>
        dispatch({ type: "SET_GLOBAL_PAGERANKS", payload: globalPageRanks })
      )
      .then(() =>
        dispatch({ type: "START_NEW", payload: { nodeName: initialNode } })
      )
  }, [])
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
        id="main-body-container"
        style={{
          display: "flex",
          position: "absolute",
          zIndex: -1,
          margin: 0,
          padding: 0,
          top: "12vh",
          left: "3vw",
          height: "88vh",
        }}
      >
        <div
          id="graph-sens-panel"
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

export default App
