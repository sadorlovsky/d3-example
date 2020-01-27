import { select, event } from 'd3-selection'
import { max, range } from 'd3-array'
import { zoom as d3zoom, zoomTransform, zoomIdentity } from 'd3-zoom'
import ColorHash from 'color-hash'

const d3 = { select, event, max, range, zoom: d3zoom, zoomTransform, zoomIdentity }
const colorHash = new ColorHash()

const RADIUS = 25
const COUNT = 50
const WIDTH = 3000
const HEIGHT = 3000

type TreeSize = {
  width: number;
  height: number;
};

type Circle = {
  id: number;
  x: number;
  y: number;
};

const circleData = ({ width, height }: TreeSize): Circle[] =>
  d3.range(COUNT).map(index => ({
    id: index,
    x: Math.round(Math.random() * (width - RADIUS * 2) + RADIUS),
    y: Math.round(Math.random() * (height - RADIUS * 2) + RADIUS)
  }))

const onZoom = (): void => {
  const svg = d3.select<SVGElement, {}>('svg')
  const wrapper = d3.select<HTMLDivElement, {}>('.wrapper')

  const scale: number = event.transform.k

  const scaledWidth = WIDTH * scale
  const scaledHeight = HEIGHT * scale

  // Change SVG dimensions
  svg.attr('width', scaledWidth)
  svg.attr('height', scaledHeight)

  // Scale the tree itself
  svg.select('g').attr('transform', `scale(${scale})`)

  // Move scrollbars
  const wrapperNode = wrapper.node() as HTMLDivElement
  if (wrapperNode) {
    wrapperNode.scrollLeft = -event.transform.x
    wrapperNode.scrollTop = -event.transform.y

    // If the tree is smaller than the wrapper, move the tree towards the
    // center of the wrapper.
    const dx = d3.max([0, wrapperNode.clientWidth / 2 - scaledWidth / 2])
    const dy = d3.max([0, wrapperNode.clientHeight / 2 - scaledHeight / 2])
    svg.attr('transform', `translate(${dx}, ${dy})`)
  }
}

const zoom: any = d3
  .zoom()
  .scaleExtent([0.1, 10])
  .on('zoom', onZoom)
  .filter(() => {
    return event.type === 'wheel' ? event.ctrlKey || event.metaKey : true
  })

const onScroll = (): void => {
  const wrapper = d3.select<HTMLDivElement, {}>('.wrapper')
  const wrapperNode = wrapper.node() as HTMLDivElement

  if (wrapperNode) {
    const x = wrapperNode.scrollLeft + wrapperNode.clientWidth / 2
    const y = wrapperNode.scrollTop + wrapperNode.clientHeight / 2
    const scale = d3.zoomTransform(wrapperNode).k

    // Update zoom parameters based on scrollbar positions.
    wrapper.call(zoom.translateTo, x / scale, y / scale)
  }
}

const getLinkPath: any = (d: Circle, index: number, nodes: any[]): string | null => {
  if (index <= nodes.length - 2) {
    const sourceX = d.x
    const sourceY = d.y

    const targetX = nodes[index + 1].__data__.x
    const targetY = nodes[index + 1].__data__.y

    return `M${sourceX} ${sourceY} L${targetX} ${targetY}`
  }
  return null
}

const draw = (): void => {
  const wrapper = d3.select('.wrapper')
  const svg = d3.select('svg')

  svg.attr('width', WIDTH)
  svg.attr('height', HEIGHT)

  const g = svg
    .append('g')
    .selectAll('circle')
    .data(circleData({ width: WIDTH, height: HEIGHT }))
    .enter()

  g.append('circle')
    .classed('circle', true)
    .attr('cx', d => d.x)
    .attr('cy', d => d.y)
    .attr('r', RADIUS)

  g.append('path')
    .classed('link', true)
    .attr('stroke', d => colorHash.hex(d.id))
    .attr('d', getLinkPath)

  g.append('text')
    .classed('label', true)
    .attr('x', d => d.x)
    .attr('y', d => d.y + RADIUS / 4)
    .on('mousedown', function () {
      event.stopPropagation()
    })
    .text(d => d.id + 1)

  wrapper
    .on('scroll', onScroll)
    .call(zoom)
}

draw()
