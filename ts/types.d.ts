declare class Sortable {
    constructor(element: Element | null, options?: Record<string, unknown>);
}

type JsonObject = Record<string, any>;

interface VmixOverlay {
    index: number;
    number: number;
}

interface VmixInput extends JsonObject {
    audiobusses: string;
    duration: string;
    loop: string;
    meterF1: string;
    meterF2: string;
    muted: string;
    number: number;
    overlays: VmixOverlay[];
    position: string;
    title: string;
    type: string;
    volume: number;
}

interface VmixFetchInfo {
    value: VmixInfo | null;
    error: unknown;
}

interface HostOption {
    name: string;
    host: string;
}

interface StoredLog {
    time: string;
    url: string;
    status: number;
    value: string;
    error: string;
}

interface HTMLElement {
    checked: boolean;
    value: string;
}

interface Element {
    checked: boolean;
    onblur: ((event: FocusEvent) => void) | null;
    onclick: ((event: MouseEvent) => void) | null;
    reportValidity: () => boolean;
    value: string;
}
