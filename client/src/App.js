import { useEffect } from 'react'
import Graph from './Graph'

function App() {
  useEffect(() => {
    localStorage.clear()
    return () => localStorage.clear()
  })
  return <Graph />
}

export default App
