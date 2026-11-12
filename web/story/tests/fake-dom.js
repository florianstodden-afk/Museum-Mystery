// A very small stand-in for the browser DOM, so components can be tested with `node --test`.
// It only supports what our story components use. This file is a helper, not a test.

class FakeElement {
  constructor(tagName) {
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this.attributes = {};
    this.listeners = {};
    this.className = '';
    this.ownText = '';
    this.disabled = false;
    this.value = '';
  }
  set textContent(text) { this.ownText = String(text); this.children = []; }
  get textContent() { return this.ownText + this.children.map(child => child.textContent).join(''); }
  append(...nodes) { for (const node of nodes) this.children.push(toNode(node)); }
  prepend(...nodes) { this.children.unshift(...nodes.map(toNode)); }
  replaceChildren(...nodes) { this.ownText = ''; this.children = nodes.map(toNode); }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  getAttribute(name) { return this.attributes[name] ?? null; }
  addEventListener(type, listener) { (this.listeners[type] ??= []).push(listener); }
  dispatch(type, extra = {}) {
    const event = { type, target: this, preventDefault() {}, ...extra };
    for (const listener of this.listeners[type] ?? []) listener(event);
  }
  click() { if (!this.disabled) this.dispatch('click'); }
  focus() {}
}

class FakeText {
  constructor(text) { this.textContent = String(text); this.children = []; }
}

function toNode(node) {
  return typeof node === 'string' ? new FakeText(node) : node;
}

export function installFakeDom() {
  globalThis.document = { createElement: tag => new FakeElement(tag) };
  return globalThis.document;
}

export function createContainer() {
  return new FakeElement('div');
}

// All elements below `root` (depth first) that match `predicate`.
export function findAll(root, predicate) {
  const found = [];
  for (const child of root.children ?? []) {
    if (child instanceof FakeElement) {
      if (predicate(child)) found.push(child);
      found.push(...findAll(child, predicate));
    }
  }
  return found;
}

export function findButton(root, label) {
  return findAll(root, node => node.tagName === 'BUTTON' && node.textContent.includes(label))[0];
}
