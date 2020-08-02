import { select, event } from 'd3-selection'
import { max, range } from 'd3-array'
import { zoom, zoomTransform, zoomIdentity } from 'd3-zoom'
import ColorHash from 'color-hash'

const CIRCLE_RADIUS = 25
const NODE_COUNT = 50
const CANVAS_WIDTH = 3000
const CANVAS_HEIGHT = 3000
const INITIAL_SCALE = 0.7

const colorHash = new ColorHash()

type Tree = {
  width: number;
  height: number;
};

type Circle = {
  id: number;
  x: number;
  y: number;
};

const getCircleData = ({ width, height }: Tree): Circle[] =>
  range(NODE_COUNT).map(index => ({
    id: index,
    x: Math.round(Math.random() * (width - CIRCLE_RADIUS * 2) + CIRCLE_RADIUS),
    y: Math.round(Math.random() * (height - CIRCLE_RADIUS * 2) + CIRCLE_RADIUS)
  }))

const onZoom = (): void => {
  const svg = select<SVGElement, {}>('svg')
  const wrapper = select<HTMLDivElement, {}>('.wrapper')

  const scale: number = event.transform.k

  const scaledWidth = CANVAS_WIDTH * scale
  const scaledHeight = CANVAS_HEIGHT * scale

  // Change SVG dimensions
  svg.attr('width', scaledWidth)
  svg.attr('height', scaledHeight)

  // Scale the tree itself
  svg.select('g').attr('transform', `scale(${scale})`)

  const wrapperNode = wrapper.node()

  if (wrapperNode) {
    // Move scrollbars
    wrapperNode.scrollLeft = -event.transform.x
    wrapperNode.scrollTop = -event.transform.y

    // If the tree is smaller than the wrapper, move the tree towards the
    // center of the wrapper.
    const dx = max([0, wrapperNode.clientWidth / 2 - scaledWidth / 2])
    const dy = max([0, wrapperNode.clientHeight / 2 - scaledHeight / 2])
    svg.attr('transform', `translate(${dx}, ${dy})`)
  }
}

const zoomBehavior = zoom<HTMLDivElement, {}>()
  .scaleExtent([0.1, 10])
  .on('zoom', onZoom)
  .filter(() => {
    return event.type === 'wheel' ? event.ctrlKey || event.metaKey : true
  })

const onScroll = (): void => {
  const wrapper = select<HTMLDivElement, {}>('.wrapper')
  const wrapperNode = wrapper.node()

  if (wrapperNode) {
    const x = wrapperNode.scrollLeft + wrapperNode.clientWidth / 2
    const y = wrapperNode.scrollTop + wrapperNode.clientHeight / 2
    const scale = zoomTransform(wrapperNode).k

    // Update zoom parameters based on scrollbar positions.
    wrapper.call(zoomBehavior.translateTo, x / scale, y / scale)
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
  const wrapper = select<HTMLDivElement, {}>('.wrapper')
  const svg = select<SVGSVGElement, null>('svg')

  svg.attr('width', CANVAS_WIDTH)
  svg.attr('height', CANVAS_HEIGHT)

  const data = getCircleData({ width: CANVAS_WIDTH, height: CANVAS_HEIGHT })

  const svgGroup = svg
    .append('g')
    .selectAll('circle')
    .data(data)
    .enter()

  const nodeGroup = svgGroup.append('g')

  nodeGroup.append('circle')
    .classed('circle', true)
    .attr('cx', d => d.x)
    .attr('cy', d => d.y)
    .attr('r', CIRCLE_RADIUS)

  nodeGroup.append('path')
    .classed('link', true)
    .attr('stroke', d => colorHash.hex(d.id))
    .attr('d', getLinkPath)

  nodeGroup.append('text')
    .classed('label', true)
    .attr('x', d => d.x)
    .attr('y', d => d.y + CIRCLE_RADIUS / 4)
    .on('mousedown', function () {
      event.stopPropagation()
    })
    .text(d => d.id + 1)

  nodeGroup
    .on('mouseover', (_, index, nodes) => {
      const node = nodes[index]
      select(node)
        .select('circle')
        .transition()
        .duration(100)
        .attr('r', CIRCLE_RADIUS * 1.1)
    })
    .on('mouseout', (_, index, nodes) => {
      const node = nodes[index]
      select(node)
        .select('circle')
        .transition()
        .duration(100)
        .attr('r', CIRCLE_RADIUS)
    })

  wrapper
    .on('scroll', onScroll)
    .call(zoomBehavior)
    .call(zoomBehavior.transform, zoomIdentity.scale(INITIAL_SCALE))
}

draw()
