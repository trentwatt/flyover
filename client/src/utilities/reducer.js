import {
  genIdFromName,
  displayNameForName,
  idForLink,
  displayNameForId,
} from './utils'

const initialNodeId = 'orig: cdc.gov 0000'

export const initialState = {
  graphData: {
    nodes: [
      {
        id: initialNodeId,
        name: displayNameForId(initialNodeId),
      },
    ],

    links: [],
  },
  nodeDetails: {
    [initialNodeId]: {
      childrenIn: [],
      childrenOut: [],
      leaf: true,
      sliceIndex: 0,
    },
  },
  linkDetails: {
    // id is `${type} ${parent_id} ${child_name}`
  },
}

export function networkReducer(state, action) {
  if (action.type === 'SET_GLOBAL_PAGERANKS') {
    return {
      ...state,
      globalPageRanks: action.payload,
    }
  } else if (action.type === 'ADD_EDGE') {
    const {
      graphData: { nodes, links },
      nodeDetails,
      linkDetails, // id is `${type} ${parent_id} ${child_name}`
    } = state
    console.log(action)
    const { type, parentId, childName, isExpansion } = action.payload
    const newLinkId = idForLink(action.payload)

    if (linkDetails[idForLink(action.payload)]) {
      return state
    }

    const childId = genIdFromName(childName, type)
    const newNode = {
      id: childId,
      name: displayNameForName(childName),
    }
    const newLink = {
      source: type === 'out' ? parentId : childId,
      target: type === 'out' ? childId : parentId,
      parentId: parentId,
      type,
      childName: childName,
      id: newLinkId,
      _sensitivity: action.payload.sensitivity,
    }

    const parentDetails = nodeDetails[parentId]
    const newParentDetails = {
      ...parentDetails,
      leaf: false,
      sliceIndex: parentDetails.sliceIndex + !!isExpansion,
      childrenIn:
        type === 'in'
          ? [...parentDetails.childrenIn, childId]
          : parentDetails.childrenIn,
      childrenOut:
        type === 'out'
          ? [...parentDetails.childrenOut, childId]
          : parentDetails.childrenOut,
    }

    // const newNodeDetails = {...nodeDetails, [parentId] {...nodeDetails[parentId], }}
    //
    return {
      ...state,
      graphData: { nodes: [...nodes, newNode], links: [...links, newLink] },
      linkDetails: { ...linkDetails, [newLinkId]: { leaf: true } },
      nodeDetails: {
        ...nodeDetails,
        [parentId]: newParentDetails,
        [childId]: {
          leaf: true,
          childrenIn: [],
          childrenOut: [],
          sliceIndex: 0,
        },
      },
    }
  } else if (action.type === 'DEL_EDGE') {
    const linkToDelete = action.payload
    console.log(action)
    const linkId = idForLink(linkToDelete)
    const { [linkId]: _, ...linkDetails } = state.linkDetails
    const { [linkToDelete.childId]: __, ...nodeDetails } = state.nodeDetails
    const parentDetails = nodeDetails[linkToDelete.parentId]
    if (!parentDetails) return state

    const newParentDetails = {
      ...parentDetails,
      childrenIn: parentDetails.childrenIn.filter(
        childId => childId !== linkToDelete.childId
      ),
      childrenOut: parentDetails.childrenOut.filter(
        childId => childId !== linkToDelete.childId
      ),
    }

    // remove it from graphData.nodes
    // remove it from graphData.links
    // remove it from linkDetails
    // remove it from node details
    // remove it from the children of its parent
    return {
      ...state,
      graphData: {
        nodes: state.graphData.nodes.filter(
          node => node.id !== linkToDelete.childId
        ),
        links: state.graphData.links.filter(link => idForLink(link) !== linkId),
      },
      linkDetails,
      nodeDetails: {
        ...nodeDetails,
        [linkToDelete.parentId]: newParentDetails,
      },
    }
  } else {
    return state
  }
}
