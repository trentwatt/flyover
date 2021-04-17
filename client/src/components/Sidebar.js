import SubgraphStats from "./SubgraphStats"
import { yellow } from "../utilities/colors"
import { baseUrl } from "../utilities/utils"

export default function Sidebar({ highlightNode }) {
  return (
    <div
      style={{
        width: "22vw",
        margin: "1vw",
      }}
    >
      <h2>
        <a href={`https://${highlightNode}`} target="_blank" rel="noreferrer">
          {highlightNode}
        </a>
      </h2>
      <SubgraphStats highlightNode={highlightNode} />
      <iframe
        key={highlightNode}
        src={
          highlightNode ? `${baseUrl}/proxy/${highlightNode}` : "about:blank" // replace about.blank with a site that gives info
        }
        title="Preview"
        style={{
          width: "100%",
          height: "75%",
          overflow: "auto",
          border: `3px solid ${yellow}`,
        }}
      />
    </div>
  )
}
