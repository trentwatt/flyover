import { useEffect, useState } from "react"
import { getSubgraphData } from "../utilities/utils"

export default function SubgraphStats({ highlightNode }) {
  const [data, setData] = useState({})

  useEffect(() => {
    if (highlightNode) getSubgraphData(highlightNode).then(setData)
  }, [highlightNode])
  if (!highlightNode) return

  return (
    <>
      <ul>
        <li>
          Pagerank in Original: {data.vRank} of {data.totalVertices}
        </li>
        <li>Incoming Edges: {data.inVertices}</li>
        <li>Outgoing Edges: {data.outVertices}</li>
      </ul>
    </>
  )
}
