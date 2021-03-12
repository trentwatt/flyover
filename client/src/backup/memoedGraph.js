import React from 'react'
import { ForceGraph2D } from 'react-force-graph'

export default React.memo(function ({
  graphRef,
  particlesForSensitivity,
  graphData,
  handleNodeClick,
  handleNodeHover,
  paintNode,
}) {
  return (
    <ForceGraph2D
      ref={graphRef}
      linkDirectionalParticles={particlesForSensitivity}
      linkColor="black"
      graphData={graphData}
      onNodeClick={handleNodeClick}
      onNodeHover={handleNodeHover}
      // onLinkHover={handleLinkHover}
      nodeAutoColorBy="name"
      nodeCanvasObject={paintNode}
    />
  )
})
