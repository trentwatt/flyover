import { createChart } from './chart'
import { getGlobalPageRanks, expandGraph } from './utilities'
const initialNode = 'ORIG: cdc.gov 000'

export default async function () {
  localStorage.clear()
  const globalPageRanks = await getGlobalPageRanks()
  const initialNetwork = await expandGraph(
    globalPageRanks,
    { nodes: [], links: [] },
    { id: initialNode, type: 'orig' }
  )
  let chart = await createChart(globalPageRanks)
  chart.update(initialNetwork)
}
