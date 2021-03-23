import { useEffect, useState } from "react"
import { getSubgraphData } from "./utilities/utils"

export default function SubgraphStats({ highlightNode }) {
  return <></>
  const [data, setData] = useState({})

  useEffect(() => {
    if (highlightNode) getSubgraphData(highlightNode).then(setData)
  }, [highlightNode])
  return (
    <>
      {data.rank && (
        <ul>
          <li>Pagerank in Original: {data.rank}</li>
          <li>Incoming Vertices: {data.inVertices}</li>
          <li>Outgoing Vertices: {data.outVertices}</li>
        </ul>
      )}
    </>
  )
}
