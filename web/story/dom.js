// Tiny helpers for building HTML elements. Used by all story components.
// We set text with textContent (never innerHTML), so story text can never inject HTML.

// el('p', { className: 'story-text', text: 'Hello' }, [childA, childB])
export function el(tag, options = {}, children = []) {
  const node = document.createElement(tag);
  if (options.className) node.className = options.className;
  if (options.text !== undefined) node.textContent = options.text;
  for (const [name, value] of Object.entries(options.attrs ?? {})) node.setAttribute(name, value);
  for (const [name, value] of Object.entries(options.props ?? {})) node[name] = value;
  for (const child of children) {
    if (child !== null && child !== undefined) node.append(child);
  }
  return node;
}

export function button(label, onClick, className = 'story-button') {
  const node = el('button', { className, text: label, attrs: { type: 'button' } });
  node.addEventListener('click', onClick);
  return node;
}

// Three artworks are already stored in web/assets. For the others we use the Met image URL.
const LOCAL_IMAGES = [436535, 436121, 12127];

export function artworkImageUrl(work) {
  if (LOCAL_IMAGES.includes(work.id)) {
    return new URL(`../assets/met-${work.id}.jpg`, import.meta.url).href;
  }
  return work.image;
}
