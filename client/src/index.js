import React from "react"
import ReactDOM from "react-dom"
import DesktopApp from "./DesktopApp"
import MobileApp from "./MobileApp"
import "./index.css"
import { isMobile } from "react-device-detect"

navigator.brave &&
  navigator.brave
    .isBrave()
    .then(
      x =>
        x &&
        alert(
          "For some reason node hit detection doesnt work in Brave. I will try to fix. Apologies."
        )
    )

console.log()

ReactDOM.render(
  <React.StrictMode>
    {isMobile ? <MobileApp /> : <DesktopApp />}
  </React.StrictMode>,
  document.getElementById("root")
)
