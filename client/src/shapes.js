import * as d3 from 'd3'

const g = d3.select('svg')

g.append('line')
  .attr('x1', '0')
  .attr('y1', '0')
  .attr('x2', '100')
  .attr('y2', '0')

g.append('line')
  .attr('x1', '47')
  .attr('y1', '0')
  .attr('x2', '53')
  .attr('y2', '6')

g.append('line')
  .attr('x1', '0')
  .attr('y1', '0')
  .attr('x2', '100')
  .attr('y2', '0')

g.append('line')
  .attr('x1', '47')
  .attr('y1', '0')
  .attr('x2', '53')
  .attr('y2', '-6')

g.append('line')
  .attr('x1', '53')
  .attr('y1', '0')
  .attr('x2', '59')
  .attr('y2', '6')

g.append('line')
  .attr('x1', '53')
  .attr('y1', '0')
  .attr('x2', '59')
  .attr('y2', '-6')
