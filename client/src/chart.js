import * as d3 from 'd3'

const width = 400
const height = 200

import { expandGraph } from './utilities'

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
    .attr('fill', '#fff')
    .attr('stroke', '#000')
    .attr('stroke-width', 1.5)
    .selectAll('circle')

  function ticked() {
    node.attr('cx', d => d.x).attr('cy', d => d.y)

    link
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y)
  }

  return Object.assign(svg.node(), {
    update({ nodes, links }) {
      // console.log(nodes)
      // Make a shallow copy to protect against mutation, while
      // recycling old nodes to preserve position and velocity.
      const old = new Map(node.data().map(d => [d.id, d]))
      nodes = nodes.map(d => Object.assign(old.get(d.id) || {}, d))
      links = links.map(d => Object.assign({}, d))

      node = node
        .data(nodes, d => d.id)
        .join(enter => enter.append('circle').attr('r', 3.5))

      node
        .attr('fill', d => (d.children ? '#fff' : colorForDatum(d)))
        .attr('stroke', d => (d.children ? colorForDatum(d) : '#fff'))
        .on('click', (_, d) => {
          expandGraph(
            originalPageranks,
            { nodes, links },
            d
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
