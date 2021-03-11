import { getRelativePageRanks, nameForId } from './utils'
export function sensUpdate(globalPageRanks, nodeDetails, sensitivity) {
  let add = []
  let del = []

  Object.entries(nodeDetails).forEach(
    ([parentId, { childrenIn, childrenOut, sliceIndex: totSlice }]) => {
      const sliceIndex = Math.ceil(totSlice / 2)
      const leavesInIds = childrenIn.filter(x => nodeDetails[x].leaf)

      const leavesOutIds = childrenOut.filter(x => nodeDetails[x].leaf)

      const nonLeavesInNames = childrenIn
        .filter(x => !nodeDetails[x].leaf)
        .map(nodeId => nameForId(nodeId))
      const nonLeavesOutNames = childrenOut
        .filter(x => !nodeDetails[x].leaf)
        .map(nodeId => nameForId(nodeId))
      const storedValue = JSON.parse(localStorage.getItem(nameForId(parentId)))
      if (leavesInIds.length === 0 || !storedValue) {
        return
        // there is a possible race condition we might want to handle at some point
      }
      const { incomingPageRanks, outgoingPageRanks } = storedValue

      const topIncoming = getRelativePageRanks(
        incomingPageRanks,
        globalPageRanks,
        sensitivity
      )
        .map(({ node }) => node)
        // .map(([nodeName]) => nodeName)
        .filter(x => !nonLeavesInNames.includes(x))
        .slice(0, sliceIndex - nonLeavesInNames.length)

      topIncoming.forEach(
        childName => (add = [...add, { parentId, childName, type: 'in' }])
      )
      leavesInIds
        .filter(childId => !topIncoming.includes(nameForId(childId)))
        .forEach(childId => (del = [...del, { parentId, childId, type: 'in' }]))

      const topOutgoing = getRelativePageRanks(
        outgoingPageRanks,
        globalPageRanks,
        sensitivity
      )
        .map(({ node }) => node)
        .filter(x => !nonLeavesOutNames.includes(x))
        .slice(0, sliceIndex - nonLeavesOutNames.length)

      topOutgoing.forEach(
        childName => (add = [...add, { parentId, childName, type: 'out' }])
      )
      leavesOutIds
        .filter(childId => !topOutgoing.includes(nameForId(childId)))
        .forEach(
          childId => (del = [...del, { parentId, childId, type: 'out' }])
        )
    }
  )

  return { add, del }
}
