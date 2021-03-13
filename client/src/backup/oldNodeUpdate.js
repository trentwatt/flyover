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
