import React from "react"
import ReactDOM from "react-dom"
import DesktopApp from "./DesktopApp"
import MobileApp from "./MobileApp"
import "./index.css"
import { isMobile } from "react-device-detect"

ReactDOM.render(
  <React.StrictMode>
    {isMobile ? <MobileApp /> : <DesktopApp />}
  </React.StrictMode>,
  document.getElementById("root")
)
