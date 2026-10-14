/// <reference path="./types.d.ts" />

const LOG_SIZE = 500;

function requireElement<T extends Element = HTMLElement>(
    selector: string,
    parent: ParentNode = document,
): T {
    const element = parent.querySelector(selector);
    if (element === null) {
        throw new Error(`Missing required element: ${selector}`);
    }
    return element as T;
}

function requireElementById<T extends HTMLElement = HTMLElement>(id: string): T {
    const element = document.getElementById(id);
    if (element === null) {
        throw new Error(`Missing required element: #${id}`);
    }
    return element as T;
}

// ===== Box Utils =====
function getBoxes(): Element[] {
    return Array.from(document.querySelectorAll('.box'));
}

function getBox(num: number | null): Element | null {
    console.assert(num === null || Number.isInteger(num));
    const boxes = getBoxes();
    if (num === null || !Number.isInteger(num) || num < 1 || num > boxes.length) {
        return null;
    }
    return boxes[num - 1];
}

function getBoxCount(): number {
    return document.getElementsByClassName('box').length;
}

function getDefaultBoxName(num: number): string {
    return `vMix ${num}`;
}

function getBoxNumber(box: Element): number {
    console.assert(box.classList.contains('box'));
    return parseInt(requireElement('.box-number', box).innerHTML);
}

function getBoxName(box: Element): string {
    console.assert(box.classList.contains('box'));
    return requireElement('.name-input', box).value;
}

function getBoxHost(box: Element): string {
    console.assert(box.classList.contains('box'));
    return requireElement('.host-input', box).value;
}

function getBoxGroup(box: Element): boolean {
    console.assert(box.classList.contains('box'));
    return requireElement('.group-input', box).value === '1';
}

function getBoxVmixInfo(box: Element): VmixFetchInfo | null {
    console.assert(box.classList.contains('box'));
    return getVmixInfo(getBoxNumber(box));
}

// ===== Document Config & Box URL Utils =====
function getInputValue(input: HTMLInputElement): string {
    if (input.type === 'checkbox') {
        return input.checked ? '1' : '0';
    } else if (input.type === 'text' || input.type === 'number') {
        return input.value;
    } else {
        console.error('Unknown input type: ' + input.type);
        return '';
    }
}

function setInputValue(input: HTMLInputElement, value: string): void {
    if (input.type === 'checkbox') {
        console.assert(['0', '1'].includes(value));
        input.checked = value === '1';
    } else if (input.type === 'text' || input.type === 'number') {
        input.value = value;
    } else {
        console.error('Unknown input type: ' + input.type);
    }
}

function setDocumentUrlParams() {
    const url = window.location.href;
    const searchParams = new URLSearchParams(new URL(url).search);

    document.querySelectorAll<HTMLInputElement>('.url-param').forEach((input) => {
        const value = searchParams.get(input.id);
        if (value) {
            setInputValue(input, value);
        }
    });
}

function updateUrlParam(e: Event): void {
    const input = e.currentTarget as HTMLInputElement;
    const name = input.id;
    const value = getInputValue(input);

    const url = new URL(window.location.href);
    url.searchParams.set(name, value);
    window.history.replaceState({}, '', url);
}

function updateBoxesParam() {
    const param = Array.from(document.querySelectorAll('.box'))
        .map((box) => getBoxName(box) + '.' + getBoxHost(box))
        .join('¦');

    const url = new URL(window.location.href);
    url.searchParams.set('boxes', param);
    window.history.replaceState({}, '', url);
    updateDemoUi();
}

function updateMasterParam() {
    const master = getMaster();
    const url = new URL(window.location.href);
    if (master === null) {
        url.searchParams.delete('master');
    } else {
        url.searchParams.set('master', String(master));
    }
    window.history.replaceState({}, '', url);
}

function updateGroupParam() {
    const group = getBoxes()
        .filter((box) => getBoxGroup(box))
        .map((box) => getBoxNumber(box))
        .join(' ');

    const url = new URL(window.location.href);
    if (group === '') {
        url.searchParams.delete('group');
    } else {
        url.searchParams.set('group', group);
    }
    window.history.replaceState({}, '', url);
}

// ===== Logging Utils =====
function show(header: string, msg: string, isError = false): void {
    const logs = requireElement('.logs');
    logs.innerHTML =
        `
        <div class="divider mb-1 mt-3 text-secondary">
          ${getShortText(header, 80)}
        </div>
        <p ${isError ? 'class="text-error"' : ''}>${new Option(msg).innerHTML}</p>` +
        logs.innerHTML;
}

function showError(header: string, msg: string): void {
    show(header, msg, true);
}

function showLog(url: string, status: number, value: string, error: string, time: string): void {
    const message = `[${time}]: ` + (value ? getShortText(value, 300) : 'Error');
    if (status === 200) {
        show(url, message);
    } else {
        showError(url, message + ' || ' + error);
    }
}

function storeLog(url: string, status: number, value: string, error: unknown, time: string): void {
    const stored = localStorage.getItem('vmix-master-logs');
    const logs: StoredLog[] = stored ? JSON.parse(stored) : [];
    logs.unshift({ time: time, url: url, status, value: value, error: String(error) });
    localStorage.setItem('vmix-master-logs', JSON.stringify(logs.slice(0, LOG_SIZE)));
}

function showStoredLogs() {
    const stored = localStorage.getItem('vmix-master-logs');
    const logs: StoredLog[] = stored ? JSON.parse(stored) : [];
    logs.reverse().forEach((log) => showLog(log.url, log.status, log.value, log.error, log.time));
}

// ===== General Purpose Utils =====
function sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
}

function removeDuplicates<T>(arr: T[]): T[] {
    return arr.filter((val, i) => arr.indexOf(val) === i);
}

function getShortText(str: string, len: number): string {
    return str.length > len ? str.slice(0, len / 2) + '...' + str.slice(-len / 2) : str;
}

function getResponsiveTitle(str: string): string {
    let splitIndex = Math.ceil(str.length * 0.5);
    while (splitIndex < str.length && !/[a-zA-Z0-9]/.test(str[splitIndex])) {
        splitIndex++;
    }
    const left = getHtmlAttributeText(str.slice(0, splitIndex));
    const right = getHtmlAttributeText(str.slice(splitIndex));
    // whitespace-pre keeps a space at the split point, which would otherwise collapse.
    return (
        `<span class="overflow-hidden whitespace-pre text-ellipsis">${left}</span>` +
        `<span class="overflow-hidden whitespace-nowrap text-clip" style="direction: rtl">${right}</span>`
    );
}

function getBoxNameTitle(name: string): string {
    return getHtmlAttributeText(name) + ' (double-click to rename)';
}

function getHtmlAttributeText(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function getInputTitleTip(input: VmixInput, inputs: VmixInput[]): string {
    const layerLines = input.overlays
        .map((layer) => {
            const layerInput = inputs[layer.number];
            if (layerInput === undefined) {
                return '';
            }
            return `<${layer.number}> ${layerInput.title}`;
        })
        .filter(Boolean);

    return [getInputTitleTipHeader(input)].concat(layerLines).join('\n');
}

function getInputTitleTipHeader(input: VmixInput): string {
    if (input.duration === undefined || input.duration === '0') {
        return input.title;
    }
    return `${input.title} (${formatDurationText(input.duration)})`;
}

function formatDurationText(ms: number | string): string {
    const totalSeconds = Math.floor(Number(ms) / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
        return `${hours}h ${minutes}m ${seconds}s`;
    }
    if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
}

function parseNumbers(str: string): number[] {
    return str
        .split(' ')
        .map((num) => num.trim())
        .filter((num) => num !== '')
        .map((num) => parseInt(num));
}

function ensureArray<T>(element: T | T[] | undefined): T[] {
    if (element === undefined) return [];
    if (Array.isArray(element)) {
        return element;
    } else {
        return [element];
    }
}

function formatTimeMMSS(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (num: number) => String(num).padStart(2, '0');
    return `${hours === 0 ? '' : hours + ':'}${pad(minutes)}:${pad(seconds)}`;
}

// Draw the segmented dB meter with peak indicator
function drawDbMeter(
    ctx: CanvasRenderingContext2D,
    xOffset: number,
    dB: number,
    muted: boolean,
): void {
    const canvasHeight = 100;

    // Define dB ranges and colors
    const dbRanges = [
        { min: -100, max: -90, frac: 0.07, colorOn: '#008000', colorOff: '#008080' },
        { min: -90, max: -36, frac: 0.28, colorOn: '#008000', colorOff: '#008080' },
        { min: -36, max: -18, frac: 0.25, colorOn: '#00c000', colorOff: '#00c0c0' },
        { min: -18, max: -6, frac: 0.25, colorOn: '#00ff00', colorOff: '#00ffff' },
        { min: -6, max: -1, frac: 0.12, colorOn: '#ffff00', colorOff: '#faff74' },
        { min: -1, max: 0, frac: 0.03, colorOn: '#ff0000', colorOff: '#ff0000' },
    ];

    let accumulatedHeight = 0; // Track filled height

    dbRanges.forEach((range) => {
        if (dB >= range.min) {
            const rangeHeight = range.frac * canvasHeight;

            // Calculate the portion of this range to be filled
            const filledFraction = Math.min(dB, range.max) - range.min;
            const filledHeight = (filledFraction / (range.max - range.min)) * rangeHeight;

            // Draw the segment for this range
            ctx.fillStyle = muted ? range.colorOff : range.colorOn;
            ctx.fillRect(
                xOffset,
                canvasHeight - accumulatedHeight - filledHeight,
                50,
                filledHeight,
            );
            accumulatedHeight += rangeHeight;
        }
    });
}

function xml2json(xml: Node): JsonObject | string | null {
    // Create the return object
    var obj: any = {};

    if (xml.nodeType == 1) {
        // element
        // do attributes
        const xmlElement = xml as Element;
        if (xmlElement.attributes.length > 0) {
            obj['@attributes'] = {};
            for (var j = 0; j < xmlElement.attributes.length; j++) {
                var attribute = xmlElement.attributes.item(j)!;
                obj['@attributes'][attribute.nodeName] = attribute.nodeValue;
            }
        }
    } else if (xml.nodeType == 3) {
        // text
        obj = xml.nodeValue;
    }

    // do children
    if (xml.hasChildNodes()) {
        for (var i = 0; i < xml.childNodes.length; i++) {
            var item = xml.childNodes.item(i);
            var nodeName = item.nodeName;
            if (typeof obj[nodeName] == 'undefined') {
                obj[nodeName] = xml2json(item);
            } else {
                if (typeof obj[nodeName].push == 'undefined') {
                    var old = obj[nodeName];
                    obj[nodeName] = [];
                    obj[nodeName].push(old);
                }
                obj[nodeName].push(xml2json(item));
            }
        }
    }
    return obj;
}
