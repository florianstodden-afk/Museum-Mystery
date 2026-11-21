// Paint figures from the back of the room to the front, using their feet as the anchor.
export function figuresBackToFront(figures, position) {
  return figures.map(figure => ({figure, point: position(figure.x, figure.y)}))
    .sort((a,b) => a.point.y - b.point.y);
}
