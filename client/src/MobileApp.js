import React, { useEffect, useReducer, useState, useMemo } from "react"
import Dropdown from "./components/Dropdown"
// import Sidebar from "./components/Sidebar"
import SensSlider from "./components/SensSlider"
import Graph from "./components/Graph"

import { baseUrl } from "./utilities/utils"

import { networkReducer } from "./utilities/reducer"

const initialNode = "cdc.gov"

function App() {
  const [altitude, setAltitude] = useState(7500)
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
  console.log(highlightNode)
  return globalPageRanks && graphData?.nodes?.length ? (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <div>
          <p autoFocus></p>
          {allNodes && (
            <Dropdown
              allNodes={allNodes}
              dispatch={dispatch}
              setHighlightNode={setHighlightNode}
            />
          )}
        </div>
        {/* <h4>Explore Relatedness</h4>
        <h4>Click Expands</h4>
        <h4>Right Click Highlights</h4>
        <h4>Slider Adjusts Altitude</h4> */}
        <h4>
          <a
            target="_blank"
            rel="noreferrer"
            href="https://github.com/trentwatt/flyover"
          >
            About
          </a>
        </h4>
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
            width: "95vw",
            display: "flex",
            flexDirection: "column",
            zIndex: -1,
          }}
        >
          <Graph
            state={state}
            dispatch={dispatch}
            setHighlightNode={setHighlightNode}
            altitude={altitude}
          />
          <SensSlider
            altitude={altitude}
            setAltitude={setAltitude}
            state={state}
            dispatch={dispatch}
          />
        </div>
        {/* <Sidebar highlightNode={highlightNode} /> */}
      </div>
    </div>
  ) : null
}

export default App
