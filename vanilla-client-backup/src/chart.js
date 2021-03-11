import * as d3 from 'd3'

const width = 400
const height = 200

import { expandGraph } from './utilities'

function getTriangle(d) {
  const xCenter = d.x
  const yCenter = d.y
  const top = `${xCenter}, ${yCenter - 6}`
  const bottomLeft = `${xCenter - 4}, ${yCenter + 4}`
  const bottomRight = `${xCenter + 4}, ${yCenter + 4}`
  return `${top} ${bottomLeft} ${bottomRight}`
}

function getRotationForDatum(d) {
  if (!d.parentNode) return 0
  const parentX = Number(d3.select(d.parentNode).attr('cx'))
  const parentY = Number(d3.select(d.parentNode).attr('cy'))
  const nodeX = Number(d.x)
  const nodeY = Number(d.y)
  const dx = nodeX - parentX
  const dy = -(nodeY - parentY)
  const counterClockwiseXAxis =
    Math.atan(dy / dx) * (180 / Math.PI) + 180 * (dx < 0)
  const clockwiseFromYAxis = 90 - counterClockwiseXAxis
  const directionAdjustedAngle = clockwiseFromYAxis + 180 * (d.type === 'in')
  return directionAdjustedAngle
}

const colorForDatum = d =>
  d && d.type == 'in' ? 'blue' : d && d.type == 'out' ? 'red' : 'black'

export async function createChart(originalPageranks) {
  const svg = d3
    .select('svg')
    .attr('viewBox', [-width / 2, -height / 2, width, height])

  /* good layout */
  const simulation = d3
    .forceSimulation()
    .force(
      'link',
      d3
        .forceLink()
        .id(d => d.id)
        .distance(0)
        .strength(1)
    )
    .force('charge', d3.forceManyBody().strength(-50))
    .force('center', d3.forceCenter(0, 0).strength(0.5))
    .on('tick', ticked)

  //   .force('radial', d3.forceRadial())
  //   .force('collide', d3.forceCollide())
  //   .force('x', d3.forceX())
  //   .force('y', d3.forceY())

  let link = svg
    .append('g')
    .attr('stroke', '#999')
    .attr('stroke-opacity', 0.6)
    .selectAll('line')

  let node = svg
    .append('g')
    .attr('id', 'nodes')
    .attr('fill', '#fff')
    .attr('stroke', '#000')
    .attr('font-family', 'Arial, Helvetica, sans-serif')
    .attr('font-size', 4)
    .attr('text-anchor', 'middle')
    .selectAll('g')

  function ticked() {
    node
      .selectAll('circle')
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)

    node
      .selectAll('polygon')
      .attr('points', d => getTriangle(d))
      .attr(
        'transform',
        d => `translate(${getRotationForDatum(d)}), ${d.x}, ${d.y}`
      )
      .attr(
        'transform',
        d => `rotate(${getRotationForDatum(d)}, ${d.x}, ${d.y})`
      )

    node
      .selectAll('text')
      .attr('x', d => d.x)
      .attr('y', d => d.y)

    link
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y)
  }

  return Object.assign(svg.node(), {
    update({ nodes, links }) {
      // Make a shallow copy to protect against mutation, while
      // recycling old nodes to preserve position and velocity.
      const old = new Map(node.data().map(d => [d.id, d]))
      nodes = nodes.map(d => Object.assign(old.get(d.id) || {}, d))
      links = links.map(d => Object.assign({}, d))

      node = node
        .data(nodes, d => d.id)
        .join(enter => {
          // return enter.append('circle').attr('r', 3.5)
          let g = enter.append('g')
          let circle = g
            .append('circle')
            .attr('r', 3.5)
            .attr('stroke-width', 0.5)
          let triangle = g.append('polygon').attr('stroke-width', 1)

          let text = g
            .append('text')
            .text(d => d && d.name && d.name.slice(0, -4))
            .attr('stroke-width', 0.1)
            .attr('fill', 'black')
            .style('pointer-events', 'none')
          // return circle
          // enter.append('text').text(d => d && d.name)
          return g
        })

      node
        .selectAll('polygon')
        .attr('fill', d => (d.children ? '#fff' : colorForDatum(d)))
        .attr('stroke', d => (d.children ? colorForDatum(d) : '#fff'))
        .on('click', (e, d) => {
          expandGraph(
            originalPageranks,
            { nodes, links },
            { ...d, node: e.currentTarget }
          ).then(({ nodes, links }) => this.update({ nodes, links }))
        })
        .append('title')
        .text(d => d.id)

      link = link.data(links, d => [d.source, d.target]).join('line')

      simulation.nodes(nodes)
      simulation.force('link').links(links)
      simulation.alpha(1).restart()
    },
  })
}
