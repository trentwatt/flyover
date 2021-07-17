import { Slider } from "@reach/slider"
import { sensitivityForAltitude } from "../utilities/utils"
import { yellow, background } from "../utilities/colors"
import { sensUpdate } from "../utilities/sensUpdate"
import { useCallback } from "react"
import "@reach/slider/styles.css"

export default function SensSlider({ altitude, setAltitude, state, dispatch }) {
  const { graphData, globalPageRanks, nodeDetails } = state
  const handleAltitudeChange = useCallback(
    altitude => {
      setAltitude(altitude)
      if (!graphData?.links?.length) {
        return
      }
      const { add, del } = sensUpdate(
        globalPageRanks,
        nodeDetails,
        sensitivityForAltitude(altitude)
      )
      add.forEach(edge => dispatch({ type: "ADD_EDGE", payload: edge }))
      del.forEach(edge => dispatch({ type: "DEL_EDGE", payload: edge }))
    },
    [
      globalPageRanks,
      nodeDetails,
      graphData?.links?.length,
      dispatch,
      setAltitude,
    ]
  )
  return (
    <div style={{ marginLeft: "10%", width: "80%" }}>
      <Slider
        style={{ background: background }}
        value={altitude}
        onChange={handleAltitudeChange}
        min={0}
        max={30000}
        step={750}
      />
      <p style={{ color: yellow }}>
        Altitude: {altitude} ft ~ <em>α</em> ={" "}
        {sensitivityForAltitude(altitude).toFixed(2)}
      </p>
    </div>
  )
}
