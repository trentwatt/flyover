import {
  getSubgraphPageRanks,
  getRelativePageRanks,
  nameForId,
  // jsonLog,
} from './utils'

const verticesAtOnce = 2
export async function nodeUpdate(
  globalPageRanks,
  nodeDetails,
  nodeToExpand,
  sensitivity
) {
  // use caching based on total parameters here as well as api params
  const sliceIndex = Math.ceil(nodeDetails[nodeToExpand.id].sliceIndex / 2)

  const { incomingPageRanks, outgoingPageRanks } = await getSubgraphPageRanks(
    nameForId(nodeToExpand.id)
  )

  return [
    ...getRelativePageRanks(incomingPageRanks, globalPageRanks, sensitivity)
      .slice(sliceIndex, sliceIndex + verticesAtOnce)
      .map(({ node }) => ({
        type: 'in',
        parentId: nodeToExpand.id,
        childName: node,
        sensitivity,
        isExpansion: true,
      })),
    ...getRelativePageRanks(outgoingPageRanks, globalPageRanks, sensitivity)
      .slice(sliceIndex, sliceIndex + verticesAtOnce)
      .map(({ node }) => ({
        type: 'out',
        parentId: nodeToExpand.id,
        childName: node,
        sensitivity,
        isExpansion: true,
      })),
  ]
  // const relativeIncoming = getRelativePageRanks(
  //   incoming,
  //   globalPageRanks,
  //   sensitivity
  //   )
  // const relativeOutgoing = getRelativePageRanks(
  //   outgoing,
  //   globalPageRanks,
  //   sensitivity
  // )

  // if (
  //   nodeToExpand.sliceIndex >
  //   Math.max(relativeIncoming.length, relativeOutgoing.length)
  // ) {
  //   return { incoming: null, outgoing: null }
  // }
  // const newSliceIndex = nodeToExpand.sliceIndex + verticesAtOnce
  // const newIncoming = Object.keys(relativeIncoming).slice(
  //   nodeToExpand.sliceIndex,
  //   newSliceIndex
  // )

  // const newOutgoing = Object.keys(relativeOutgoing).slice(
  //   nodeToExpand.sliceIndex,
  //   newSliceIndex
  // )
  // return {
  //   incoming: newIncoming,
  //   outgoing: newOutgoing,
  //   sliceIndex: newSliceIndex,
  // }
  // return add
}
