import { useState, useEffect } from 'react'
import Graph from './components/Graph'

function App() {
  const [globalPageRank, setGlobalPageRank] = useState(null)
  useEffect(() => {
    fetch('http://127.0.0.1:8000/')
      .then(response => response.json())
      .then(setGlobalPageRank)
  }, [setGlobalPageRank])
  const [node, setNode] = useState('cdc.gov')
  return (
    <div className="App">
      {/* <input
        value={node}
        onChange={e => {
          e.preventDefault()
          setNode(e.target.value)
        }}
      /> */}
      <Graph node={node} setNode={setNode} globalPageRank={globalPageRank} />
    </div>
  )
}

export default App
