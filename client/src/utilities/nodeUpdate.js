import {
  getSubgraphData,
  getRelativePageRanks,
  nameForId,
  // jsonLog,
} from "./utils"

const verticesAtOnce = 2
export async function nodeUpdate(
  globalPageRanks,
  nodeDetails,
  nodeToExpand,
  sensitivity
) {
  const sliceIndex = nodeDetails[nodeToExpand.id].childrenIn.length

  const { incomingPageRanks, outgoingPageRanks } = await getSubgraphData(
    nameForId(nodeToExpand.id)
  )

  return [
    ...getRelativePageRanks(incomingPageRanks, globalPageRanks, sensitivity)
      .slice(sliceIndex, sliceIndex + verticesAtOnce)
      .map(({ node }) => ({
        type: "in",
        parentId: nodeToExpand.id,
        childName: node,
        sensitivity,
        // isExpansion: true,
      })),
    ...getRelativePageRanks(outgoingPageRanks, globalPageRanks, sensitivity)
      .slice(sliceIndex, sliceIndex + verticesAtOnce)
      .map(({ node }) => ({
        type: "out",
        parentId: nodeToExpand.id,
        childName: node,
        sensitivity,
        // isExpansion: true,
      })),
  ]
}
