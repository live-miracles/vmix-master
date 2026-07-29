/// <reference path="./types.d.ts" />

// ===== vMix API Utils =====
async function fetchUrl(
    url: string,
): Promise<{ status: number | null; value: string | null; error: unknown }> {
    try {
        const response = await fetch(url, { signal: AbortSignal.timeout(2000) });
        const data = await response.text();
        return {
            status: response.status,
            value: data,
            error: null,
        };
    } catch (error) {
        return {
            status: null,
            value: null,
            error: error,
        };
    }
}

function getApiUrl(host: string, request = ''): string {
    const rawUrl = host.trim();
    const url = new URL(/^https?:\/\//i.test(rawUrl) ? rawUrl : 'http://' + rawUrl);

    if (url.port === '') {
        url.port = '8088';
    }

    if (!/\/api\/?$/i.test(url.pathname)) {
        url.pathname = url.pathname.replace(/\/?$/, '/api/');
    } else if (!url.pathname.endsWith('/')) {
        url.pathname += '/';
    }

    return url.origin + url.pathname + '?' + request;
}

async function execute(url: string, isShow = true): Promise<void> {
    const res = await fetchUrl(url);
    const timestamp = new Date().toLocaleTimeString();
    const status = res.status ?? 0;
    const value = res.value ?? '';
    storeLog(url, status, value, res.error, timestamp);
    if (isShow) {
        showLog(url, status, value, String(res.error), timestamp);
    }
}

// ===== vMix Web Commands =====
function previewInput(inputNum: number): void {
    masterSlaveExecute('Function=PreviewInput&Input=' + inputNum);
}

function transition(type: string): void {
    const info = getMasterInfo();
    if (info === null) {
        return;
    }
    const inputNum = info.preview;
    const inputParam = type === 'FadeToBlack' ? '' : '&Input=' + inputNum;
    masterSlaveExecute('Function=' + type + inputParam);
}

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

function getEffectiveInputVolume(input: VmixInput): number {
    const volume = Number(input.volume);
    const gain = input.gainDb === undefined ? 0 : Number(input.gainDb);
    return volume * Math.pow(10, gain / 20);
}

function getIncreasedInputAudio(input: VmixInput): string[] {
    const volume = getEffectiveInputVolume(input);
    const dB = Math.round(20 * Math.log10(volume / 100));

    if (volume < 100) {
        return ['+=3', '0'];
    }
    return ['100', String(clamp(dB + 1, 0, 24))];
}

function getDecreasedInputAudio(input: VmixInput): string[] {
    const volume = getEffectiveInputVolume(input);
    const dB = Math.round(20 * Math.log10(volume / 100));

    if (volume <= 100 || dB === 0) {
        return ['-=3', '0'];
    }
    return ['100', String(clamp(dB - 1, 0, 24))];
}

function adjustInputAudio(inputNum: number, direction: number): void {
    const info = getMasterInfo();
    if (info === null) {
        return;
    }
    const input = info.inputs[inputNum];
    const [volume, gain] =
        direction > 0 ? getIncreasedInputAudio(input) : getDecreasedInputAudio(input);
    masterSlaveExecute(
        'Function=SetVolume&Value=' + encodeURIComponent(volume) + '&Input=' + inputNum,
    );
    setTimeout(() => {
        masterSlaveExecute(
            'Function=SetGain&Value=' + encodeURIComponent(gain) + '&Input=' + inputNum,
        );
    }, 200);
}

function toggleAudioBus(inputNum: number, bus: string): void {
    const info = getMasterInfo();
    if (info === null) {
        return;
    }
    const on = info.inputs[inputNum].audiobusses.includes(bus);
    masterSlaveExecute(`Function=AudioBus${on ? 'Off' : 'On'}&Value=${bus}&Input=${inputNum}`);
}

function toggleSendToMaster(bus: string): void {
    const info = getMasterInfo();
    if (info === null) {
        return;
    }
    const on = info.audio[getBusName(bus)].sendToMaster === 'True';
    masterSlaveExecute(`Function=BusXSendToMaster${on ? 'Off' : 'On'}&Value=${bus}`);
}

function toggleBusAudio(bus: string): void {
    const info = getMasterInfo();
    if (info === null) {
        return;
    }
    const on = info.audio[getBusName(bus)].muted === 'False';
    masterSlaveExecute(`Function=${getBusName(bus, true)}Audio${on ? 'Off' : 'On'}`);
}

function adjustBusVolume(bus: string, amount: number): void {
    const info = getMasterInfo();
    if (info === null) {
        return;
    }
    const value = amount > 0 ? `+=${amount}` : `-=${Math.abs(amount)}`;
    masterSlaveExecute(
        `Function=Set${getBusName(bus, true)}Volume&Value=${encodeURIComponent(value)}`,
    );
}

function overlayInput(inputNum: number, overlayNum: number): void {
    masterSlaveExecute('Function=OverlayInput' + overlayNum + '&Input=' + inputNum);
}

function muteInput(inputNum: number): void {
    const info = getMasterInfo();
    if (info === null) {
        return;
    }
    const on = info.inputs[inputNum].muted === 'False';
    masterSlaveExecute(`Function=${on ? 'AudioOff' : 'AudioOn'}&Input=${inputNum}`);
}

function loopInput(inputNum: number): void {
    const info = getMasterInfo();
    if (info === null) {
        return;
    }
    const on = info.inputs[inputNum].loop === 'True';
    masterSlaveExecute(`Function=${on ? 'LoopOff' : 'LoopOn'}&Input=${inputNum}`);
}

function masterSlaveExecute(command: string): void {
    const master = getMaster();
    if (master === null) {
        return;
    }

    const targets = getGroupTargetNumbers();
    targets.unshift(master);
    removeDuplicates(targets)
        .filter((num) => getBox(num) !== null)
        .map((num) => getBoxHost(getBox(num)!))
        .forEach((host) => execute(getApiUrl(host, command)));
}
