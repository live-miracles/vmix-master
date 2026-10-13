/// <reference path="./types.d.ts" />
/// <reference path="./tools.ts" />
/// <reference path="./vmix-api.ts" />

const vmixInfos: (VmixFetchInfo | null)[] = [];

class VmixInfo {
    preset: string;
    preview: number;
    active: number;
    recording: boolean;
    external: boolean;
    streaming: boolean;
    fadeToBlack: boolean;
    inputs: VmixInput[];
    overlays: number[];
    audio: Record<string, any>;

    constructor(jsonData: JsonObject) {
        this.preset = jsonData.vmix.preset
            ? jsonData.vmix.preset['#text'].split('\\').pop().slice(0, -5)
            : '';
        this.preview = Number(jsonData.vmix.preview['#text']);
        this.active = Number(jsonData.vmix.active['#text']);
        this.recording = jsonData.vmix.recording['#text'] === 'True';
        this.external = jsonData.vmix.external['#text'] === 'True';
        this.streaming = jsonData.vmix.streaming['#text'] === 'True';
        this.fadeToBlack = jsonData.vmix.fadeToBlack['#text'] === 'True';

        const keyMap: Record<string, number> = {};
        jsonData.vmix.inputs.input.forEach(
            (i: JsonObject) => (keyMap[i['@attributes'].key] = Number(i['@attributes'].number)),
        );

        this.inputs = [];
        jsonData.vmix.inputs.input.forEach((i: JsonObject) => {
            const number = Number(i['@attributes'].number);
            this.inputs[number] = i['@attributes'];
            this.inputs[number].overlays = [];
            ensureArray<JsonObject>(i.overlay).forEach((overlay) => {
                const overlayNumber = keyMap[overlay['@attributes'].key];
                this.inputs[number].overlays.push({
                    index: parseInt(overlay['@attributes'].index),
                    number: overlayNumber,
                });
            });
        });
        this.overlays = [];
        jsonData.vmix.overlays.overlay
            .filter((o: JsonObject) => o['#text'] !== undefined)
            .forEach(
                (o: JsonObject) =>
                    (this.overlays[Number(o['@attributes'].number)] = Number(o['#text'])),
            );

        this.audio = {};
        Object.entries(jsonData.vmix.audio).forEach(
            ([k, v]) => (this.audio[k] = (v as JsonObject)['@attributes']),
        );
    }
}

const parser = new DOMParser();
async function fetchVmixInfo(host: string): Promise<VmixFetchInfo> {
    const res = await fetchUrl(getApiUrl(host));

    if (res.status === 200 && res.value !== null) {
        const xmlData = parser.parseFromString(res.value, 'text/xml');
        const jsonData = xml2json(xmlData);
        return {
            value: new VmixInfo(jsonData as JsonObject),
            error: null,
        };
    } else {
        return {
            value: null,
            error: res.error,
        };
    }
}

function getVmixInfo(number: number | null): VmixFetchInfo | null {
    console.assert(number === null || Number.isInteger(number));
    if (number === null || getBox(number) === null) {
        return null;
    }
    return vmixInfos[number] ?? null;
}

function setVmixInfo(number: number, info: VmixFetchInfo | null): void {
    console.assert(Number.isInteger(number));
    vmixInfos[number] = info;
}

function setBoxStatus(box: Element, status: 'ok' | 'error' | 'pending' | 'idle', title: string) {
    const dot = requireElement('.status-dot', box);
    dot.classList.toggle('bg-success', status === 'ok');
    dot.classList.toggle('bg-error', status === 'error');
    dot.classList.toggle('bg-base-content/30', status === 'idle' || status === 'pending');
    dot.classList.toggle('animate-pulse', status === 'pending');
    dot.title = title;
}

function renderVmixInfo(box: Element): void {
    const boxNum = getBoxNumber(box);
    const vmixInfo = getVmixInfo(boxNum);
    const boxName = getBoxName(box) || getDefaultBoxName(boxNum);
    const boxDisplayName = box.querySelector('.boxDisplayName');
    if (boxDisplayName) {
        boxDisplayName.textContent = boxName;
        boxDisplayName.setAttribute('title', boxName + ' (double-click to rename)');
    }

    const infoElem = requireElement('.vmixInfo', box);
    const metaElem = requireElement('.vmixMeta', box);
    metaElem.innerHTML = '';
    if (vmixInfo === null) {
        // Not fetched yet: stay blank without an address (or with refreshing off).
        if (getBoxHost(box) === '') {
            setBoxStatus(box, 'idle', 'No address');
            infoElem.innerHTML = '';
        } else if (refreshRate === -1) {
            setBoxStatus(box, 'idle', 'Auto-refresh is off');
            infoElem.innerHTML = '';
        } else {
            setBoxStatus(box, 'pending', 'Connecting…');
            infoElem.innerHTML = '<div class="text-xs text-base-content/70">Connecting…</div>';
        }
        return;
    }
    const info = vmixInfo.value;
    if (info === null) {
        const reason = String(vmixInfo.error);
        setBoxStatus(box, 'error', 'Unreachable: ' + reason);
        infoElem.innerHTML = `<div class="text-error" title="${getHtmlAttributeText(reason)}">Unavailable</div>`;
        return;
    }
    setBoxStatus(box, 'ok', 'Connected');
    const active = info.inputs[info.active];
    const preview = info.inputs[info.preview];
    metaElem.innerHTML = getVmixInfoHeader(info);
    infoElem.innerHTML = `
      ${getProgramPreviewLine(active, 'badge-primary', info.inputs)}
      ${getProgramPreviewLine(preview, 'badge-warning', info.inputs)}`;
}

function getVmixInfoHeader(info: VmixInfo): string {
    const preset = info.preset
        ? `<span class="text-base-content/40">·</span>
           <span class="min-w-0 truncate text-base-content/70">${getHtmlAttributeText(info.preset)}</span>`
        : '';
    return `${preset}<span class="ml-auto flex shrink-0 items-center gap-1">${getVmixStatusBadges(info)}</span>`;
}

function getVmixStatusBadges(info: VmixInfo): string {
    const badgeClass =
        'badge badge-error badge-outline h-3.5 min-h-0 rounded-xs px-1 text-[10px] leading-none';
    return [
        info.recording ? `<span class="${badgeClass}">REC</span>` : '',
        info.external ? `<span class="${badgeClass}">EXT</span>` : '',
        info.streaming ? `<span class="${badgeClass}">STREAM</span>` : '',
        info.fadeToBlack ? `<span class="${badgeClass}">FTB</span>` : '',
    ].join('');
}

function getProgramPreviewLine(input: VmixInput, badgeClass: string, inputs: VmixInput[]): string {
    return `
      <div class="flex min-w-0 items-center gap-1">
        <span class="badge ${badgeClass} h-4 w-6 py-0">${input.number}</span>
        ${input.duration !== '0' ? `<div class="inline-block min-w-[77px] text-center text-xs">${getShortInputProgress(input)}</div>` : ''}
        <span class="inline-flex min-w-0 flex-1 overflow-hidden whitespace-nowrap" title="${getHtmlAttributeText(getInputTitleTip(input, inputs))}">${getResponsiveTitle(input.title)}</span>
      </div>`;
}

function getBusName(bus: string, capital = false): string {
    const name = bus === 'M' ? 'master' : `bus${bus}`;
    console.assert(name !== undefined, bus);
    return capital ? name.charAt(0).toUpperCase() + name.slice(1) : name;
}

function getShortInputProgress(input: VmixInput): string {
    if (input.duration === '0') return '';

    console.assert(['Video', 'AudioFile', 'Photos', 'PowerPoint'].includes(input.type), input.type);
    const duration = parseInt(input.duration);
    const position = parseInt(input.position);
    const remaining = duration - position;

    if (['Photos', 'PowerPoint'].includes(input.type)) {
        return `${position} / ${duration} / ${remaining}`;
    }
    return `${formatTimeMMSS(duration)} | ${formatTimeMMSS(remaining)}`;
}

function getInputDuration(input: VmixInput): string | number {
    if (input.duration === '0') return '';

    console.assert(['Video', 'AudioFile', 'Photos', 'PowerPoint'].includes(input.type), input.type);
    const duration = parseInt(input.duration);
    if (['Photos', 'PowerPoint'].includes(input.type)) {
        return duration;
    }

    return formatTimeMMSS(duration);
}

function getVolumeInfo(input: VmixInput): string {
    let gain = '';
    if (input.gainDb !== undefined && input.gainDb !== '0') {
        gain = ' | ' + Math.round(input.gainDb * 100) / 100 + 'dB';
    }
    return Math.round(input.volume) + '%' + gain;
}

function drawAudioLevels(canvas: HTMLCanvasElement, input: VmixInput): void {
    const ctx = canvas.getContext('2d');
    if (ctx === null) {
        return;
    }
    ctx.clearRect(0, 0, 100, 100);
    const left = Math.log10(parseFloat(input.meterF1)) * 20;
    const right = Math.log10(parseFloat(input.meterF2)) * 20;
    drawDbMeter(ctx, 0, left, input.muted === 'True');
    drawDbMeter(ctx, 52, right, input.muted === 'True');
}
