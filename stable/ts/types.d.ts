declare class Sortable {
    constructor(element: Element | null, options?: Record<string, unknown>);
}

interface HTMLElement {
    checked: boolean;
    value: string;
}

interface Element {
    checked: boolean;
    onblur: ((event: FocusEvent) => void) | null;
    onclick: ((event: MouseEvent) => void) | null;
    value: string;
}
