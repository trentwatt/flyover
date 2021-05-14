import { Slider } from "@reach/slider"
import { yellow, background } from "../utilities/colors"
import { sensUpdate } from "../utilities/sensUpdate"
import { useCallback } from "react"
import "@reach/slider/styles.css"

export default function SensSlider({
  sensitivity,
  setSensitivity,
  state,
  dispatch,
}) {
  const { graphData, globalPageRanks, nodeDetails } = state
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
    [
      globalPageRanks,
      nodeDetails,
      graphData?.links?.length,
      dispatch,
      setSensitivity,
    ]
  )
  return (
    <div style={{ margin: "1vmax" }}>
      <Slider
        style={{ background: background }}
        value={sensitivity}
        onChange={handleSensitivityUpdate}
        min={0}
        max={1}
        step={0.025}
      />
      <p style={{ color: yellow }}>Sensitivity: {sensitivity}</p>
    </div>
  )
}
