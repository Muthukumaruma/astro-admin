import Image from '@tiptap/extension-image';

// Adds `width` (CSS width, e.g. "50%") and `align` (left/center/right) attributes
// to the image node, rendered as inline styles. Must be mirrored in
// astro-BE/src/modules/cms/cms-tiptap.ts so saved content renders identically.
export const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...(this.parent?.() ?? {}),
      width: {
        default: null,
        parseHTML: (element: HTMLElement) => {
          const match = (element.getAttribute('style') ?? '').match(/width:\s*([^;]+)/);
          return match?.[1] ? match[1].trim() : null;
        },
        renderHTML: () => ({}),
      },
      align: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('data-align'),
        renderHTML: () => ({}),
      },
    };
  },
  renderHTML({ node, HTMLAttributes }) {
    const styles: string[] = [];
    if (node.attrs.width) styles.push(`width: ${node.attrs.width}`);
    if (node.attrs.align === 'left') styles.push('float: left', 'margin: 0 1rem 1rem 0');
    else if (node.attrs.align === 'right') styles.push('float: right', 'margin: 0 0 1rem 1rem');
    else if (node.attrs.align === 'center') styles.push('display: block', 'margin-left: auto', 'margin-right: auto');

    const attrs: Record<string, unknown> = { ...HTMLAttributes };
    if (node.attrs.align) attrs['data-align'] = node.attrs.align;
    if (styles.length) attrs.style = styles.join('; ');
    return ['img', attrs];
  },
});
