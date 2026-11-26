import { loadAnimationPrefs } from '@/lib/animation-prefs';
import { iconSvg } from '@/components/icon-svg';

class Markup {
  constructor(readonly source: string) {}
}

function interpolate(value: unknown): string {
  if (value instanceof Markup) return value.source;
  if (Array.isArray(value)) return value.map(interpolate).join('');
  if (value == null || typeof value === 'boolean') return '';
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function html(parts: TemplateStringsArray, ...values: unknown[]) {
  return new Markup(parts.reduce((source, part, index) => source + interpolate(values[index - 1]) + part, ''));
}

export function icon(name: Parameters<typeof iconSvg>[0], classes: string) {
  return new Markup(iconSvg(name, classes));
}

export function disabled(value: boolean) {
  return new Markup(value ? 'disabled' : '');
}

type Binding = (element: Element) => void;

function motionAllowed() {
  const prefs = loadAnimationPrefs();
  return prefs.masterEnabled && !matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function createEditorView(host: HTMLElement) {
  const portal = document.createElement('div');
  portal.style.display = 'contents';
  document.body.append(portal);
  const listeners = new WeakMap<Element, Map<string, EventListener>>();
  const bindings: Binding[] = [];
  let restoreFocus: HTMLElement | undefined;
  let closeDialog: (() => void) | undefined;

  portal.addEventListener('keydown', (event) => {
    const dialog = portal.querySelector<HTMLElement>('[role="dialog"]');
    if (!dialog) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      closeDialog?.();
    }
    if (event.key !== 'Tab') return;
    const controls = Array.from(dialog.querySelectorAll<HTMLElement>('button, input, select, textarea')).filter(
      (element) => !element.matches(':disabled') && element.getClientRects().length > 0,
    );
    const current = controls.indexOf(document.activeElement as HTMLElement);
    if (!controls.length || current < 0 || (event.shiftKey ? current === 0 : current === controls.length - 1)) {
      event.preventDefault();
      (controls[event.shiftKey ? controls.length - 1 : 0] ?? dialog).focus();
    }
  });

  function binding(prefix: string, apply: Binding) {
    return new Markup(`data-editor-${prefix}="${bindings.push(apply) - 1}"`);
  }

  function listen(event: string, listener: EventListener) {
    return binding(event, (element) => {
      let events = listeners.get(element);
      if (!events) {
        events = new Map();
        listeners.set(element, events);
      }
      const previous = events.get(event);
      if (previous) element.removeEventListener(event, previous);
      events.set(event, listener);
      element.addEventListener(event, listener);
    });
  }

  function bind(property: 'state' | 'value', value: unknown) {
    return binding(property, (element) => Reflect.set(element, property, value));
  }

  // Keep active controls and stateful custom elements in place as neighboring fields update.
  function patchChildren(target: ParentNode, source: ParentNode) {
    const nextKeys = new Set(Array.from(source.children, (node) => node.getAttribute('data-key')));
    const keyed = new Map<string, Element>();
    for (const node of Array.from(target.children)) {
      const key = node.getAttribute('data-key');
      if (key === null) continue;
      if (nextKeys.has(key)) keyed.set(key, node);
      else node.remove();
    }
    let current = target.firstChild;
    for (const next of Array.from(source.childNodes)) {
      const key = next instanceof Element && next.getAttribute('data-key');
      const matches = (node: ChildNode | null) =>
        node?.nodeName === next.nodeName &&
        (!(node instanceof Element) || node.getAttribute('data-key') === (key || null));
      if (key && !matches(current)) {
        const match = keyed.get(key);
        if (match && matches(match)) {
          target.insertBefore(match, current);
          current = match;
        }
      }
      if (!current || !matches(current)) {
        const inserted = next.cloneNode(false);
        target.insertBefore(inserted, current);
        patchNode(inserted, next);
        if (inserted instanceof HTMLElement && key === 'feedback' && motionAllowed()) {
          inserted.animate(
            [
              { opacity: 0, transform: 'translateY(-6px)' },
              { opacity: 1, transform: 'none' },
            ],
            180,
          );
        }
      } else {
        patchNode(current, next);
        current = current.nextSibling;
      }
    }
    while (current) {
      const next = current.nextSibling;
      current.remove();
      current = next;
    }
  }

  function patchNode(current: Node, next: Node) {
    if (!(current instanceof Element) || !(next instanceof Element)) {
      if (current.nodeValue !== next.nodeValue) current.nodeValue = next.nodeValue;
      return;
    }
    const events = listeners.get(current);
    for (const [event, listener] of events ?? []) {
      if (!next.hasAttribute(`data-editor-${event}`)) {
        current.removeEventListener(event, listener);
        events?.delete(event);
      }
    }
    for (const attr of Array.from(current.attributes)) {
      if (current.localName.startsWith('pnd-') && attr.name === 'style') continue;
      if (!next.hasAttribute(attr.name)) current.removeAttribute(attr.name);
    }
    for (const attr of Array.from(next.attributes)) {
      if (!attr.name.startsWith('data-editor-') && current.getAttribute(attr.name) !== attr.value) {
        current.setAttributeNS(attr.namespaceURI, attr.name, attr.value);
      }
    }
    if (current instanceof HTMLInputElement && next instanceof HTMLInputElement && current.value !== next.value) {
      current.value = next.value;
    }
    if (!current.localName.startsWith('pnd-')) patchChildren(current, next);
    for (const attr of Array.from(next.attributes)) {
      if (attr.name.startsWith('data-editor-')) bindings[Number(attr.value)](current);
    }
  }

  function paint(root: HTMLElement, markup: Markup) {
    const template = document.createElement('template');
    template.innerHTML = markup.source;
    patchChildren(root, template.content);
  }

  return {
    bind,
    listen,
    dialogs(markup: Markup, onClose?: () => void) {
      closeDialog = onClose;
      const previous = portal.querySelector('[role="dialog"]');
      const active = document.activeElement;
      paint(portal, markup);
      const dialog = portal.querySelector<HTMLElement>('[role="dialog"]');
      if (dialog && dialog !== previous) {
        if (!previous && active instanceof HTMLElement) restoreFocus = active;
        dialog.focus({ preventScroll: true });
        if (motionAllowed()) {
          dialog.animate(
            [
              { opacity: 0, transform: 'translateY(12px) scale(0.94)' },
              { opacity: 1, transform: 'none' },
            ],
            180,
          );
        }
      } else if (!dialog && previous) {
        restoreFocus?.focus({ preventScroll: true });
        restoreFocus = undefined;
      }
    },
    mount(markup: Markup) {
      paint(host, markup);
      bindings.length = 0;
    },
    dispose: () => portal.remove(),
  };
}
