import { useContext, createContext, useEffect, useState } from 'react'
const GlobalPageRankContext = createContext()

export const useGlobalPageRanks = () => useContext(GlobalPageRankContext)

export const GlobalPageRankProvider = ({ children }) => {
  const [globalPageRank, setGlobalPageRank] = useState(null)
  useEffect(() => {
    fetch('http://127.0.0.1:8000/')
      .then(response => response.json())
      .then(setGlobalPageRank)
  }, [setGlobalPageRank])
  return (
    <GlobalPageRankContext.Provider value={globalPageRank}>
      {children}
    </GlobalPageRankContext.Provider>
  )
}
