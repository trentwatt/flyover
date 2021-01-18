import { useEffect } from 'react'
import Graph from './Graph'

function App() {
  useEffect(() => {
    localStorage.clear()
    return () => localStorage.clear()
  })
  return (
    <div className="App">
      <Graph />
    </div>
  )
}

export default App
