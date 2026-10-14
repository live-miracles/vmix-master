"use strict";
/// <reference path="./types.d.ts" />
const DEMO_BUSES = ['A', 'B', 'C'];
function demoClamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}
function demoEscapeXml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
// "+=3" and "-=3" are relative, anything else is absolute.
function demoApplyValue(current, value, min, max) {
    // A "+" that was not URL-encoded arrives as a space.
    const text = value.startsWith(' =') ? '+' + value.slice(1) : value;
    if (text.startsWith('+='))
        return demoClamp(current + Number(text.slice(2)), min, max);
    if (text.startsWith('-='))
        return demoClamp(current - Number(text.slice(2)), min, max);
    const number = Number(text);
    return text === '' || Number.isNaN(number) ? current : demoClamp(number, min, max);
}
class DemoVmix {
    constructor(preset, now, random, openingExtraMs = 0, language = '') {
        this.now = now;
        this.random = random;
        this.preview = 5;
        this.active = 2;
        this.fadeToBlack = false;
        this.recording = false;
        this.external = false;
        this.streaming = false;
        this.overlays = [0, 0, 0, 0, 0, 0, 0, 0, 0]; // 1..8 hold the input number, 0 is off
        this.master = { volume: 100, muted: false, sendToMaster: true };
        this.buses = {
            A: { volume: 100, muted: false, sendToMaster: true },
            B: { volume: 85, muted: false, sendToMaster: true },
            C: { volume: 100, muted: false, sendToMaster: false },
        };
        this.preset = preset;
        const t = now();
        const make = (number, type, title, options = {}) => ({
            number,
            type,
            title,
            duration: 0,
            position: 0,
            running: false,
            since: t,
            loop: false,
            hasAudio: false,
            muted: false,
            volume: 100,
            gainDb: 0,
            buses: [],
            ...options,
        });
        // Slides, videos and the translator are per language, cameras and the like are shared.
        const named = (name, extension = '') => language === '' ? name + extension : `${name} - ${language}${extension}`;
        const live = () => ({ running: true, hasAudio: true, buses: ['M', 'A'] });
        const video = (duration) => ({ duration, hasAudio: true, buses: ['M', 'A'] });
        this.inputs = [
            make(1, 'Colour', '01 Black'),
            make(2, 'Capture', '02 Stage Camera', live()),
            make(3, 'Capture', '03 Speaker Close-up', live()),
            make(4, 'Image', named('04 Welcome Slide', '.png')),
            make(5, 'Video', named('05 Opening Video', '.mp4'), video(270000 + openingExtraMs)),
            make(6, 'Video', named('06 Pranayama Intro', '.mp4'), video(754000)),
            make(7, 'AudioFile', named('07 Meditation Music', '.mp3'), {
                duration: 480000,
                hasAudio: true,
                buses: ['M'],
                volume: 70,
                loop: true,
            }),
            make(8, 'Photos', '08 Photo Slideshow', { duration: 12, position: 3 }),
            make(9, 'Image', named('09 Q&A Slide', '.png')),
            make(10, 'Audio', named('10 Translator Mic'), {
                running: true,
                hasAudio: true,
                buses: ['M', 'B'],
            }),
            make(11, 'Image', named('11 Break Slide', '.png')),
            make(12, 'Video', named('12 Closing Video', '.mp4'), video(90000)),
        ];
    }
    findInput(raw) {
        const number = Number(raw);
        return this.inputs.find((input) => input.number === number) ?? null;
    }
    // Moves the playback position forward to "now" (and stops at the end unless looping).
    sync(input) {
        const t = this.now();
        if (input.running && input.duration > 0 && input.type !== 'Photos') {
            let position = input.position + (t - input.since);
            if (position >= input.duration) {
                if (input.loop) {
                    position %= input.duration;
                }
                else {
                    position = input.duration;
                    input.running = false;
                }
            }
            input.position = position;
        }
        input.since = t;
    }
    goToProgram(number) {
        if (number === this.active)
            return;
        this.preview = this.active;
        this.active = number;
    }
    // Runs one vMix API function such as "Function=Cut&Input=5".
    execute(params) {
        const fn = params.get('Function') ?? '';
        const value = params.get('Value') ?? '';
        const input = this.findInput(params.get('Input'));
        if (input !== null)
            this.sync(input);
        let match;
        if (fn === 'PreviewInput' && input) {
            this.preview = input.number;
        }
        else if (fn === 'ActiveInput' && input) {
            this.active = input.number;
        }
        else if (/^(Cut|CutDirect|Fade|Merge|Stinger[1-4])$/.test(fn)) {
            // Without an Input the transition uses the preview; an unknown Input does nothing.
            const target = params.has('Input') ? input?.number : this.preview;
            if (target !== undefined)
                this.goToProgram(target);
        }
        else if (fn === 'QuickPlay' && input) {
            this.goToProgram(input.number);
            input.position = 0;
            input.running = input.duration > 0 || input.hasAudio;
        }
        else if (fn === 'FadeToBlack') {
            this.fadeToBlack = !this.fadeToBlack;
        }
        else if ((match = /^OverlayInput([1-8])$/.exec(fn)) && input) {
            const n = Number(match[1]);
            this.overlays[n] = this.overlays[n] === input.number ? 0 : input.number;
        }
        else if (fn === 'Restart' && input) {
            input.position = 0;
            input.running = true;
        }
        else if (fn === 'Play' && input) {
            input.running = true;
        }
        else if (fn === 'Pause' && input) {
            input.running = false;
        }
        else if (fn === 'PlayPause' && input) {
            input.running = !input.running;
        }
        else if (fn === 'SetPosition' && input) {
            input.position = demoClamp(Number(value) || 0, 0, input.duration);
        }
        else if (fn === 'Loop' && input) {
            input.loop = !input.loop;
        }
        else if (fn === 'LoopOn' && input) {
            input.loop = true;
        }
        else if (fn === 'LoopOff' && input) {
            input.loop = false;
        }
        else if (fn === 'AudioOn' && input) {
            input.muted = false;
        }
        else if (fn === 'AudioOff' && input) {
            input.muted = true;
        }
        else if (fn === 'SetVolume' && input) {
            input.volume = demoApplyValue(input.volume, value, 0, 100);
        }
        else if (fn === 'SetVolumeFade' && input) {
            input.volume = demoApplyValue(input.volume, value.split(',')[0], 0, 100);
        }
        else if (fn === 'SetGain' && input) {
            input.gainDb = demoApplyValue(input.gainDb, value, 0, 24);
        }
        else if ((match = /^AudioBus(On|Off)$/.exec(fn)) && input) {
            const others = input.buses.filter((bus) => bus !== value);
            input.buses = match[1] === 'On' ? [...others, value] : others;
        }
        else if ((match = /^(Master|Bus([A-G]))Audio(On|Off)$/.exec(fn))) {
            const bus = match[2] === undefined ? this.master : this.buses[match[2]];
            if (bus)
                bus.muted = match[3] === 'Off';
        }
        else if ((match = /^Set(Master|Bus([A-G]))Volume$/.exec(fn))) {
            const bus = match[2] === undefined ? this.master : this.buses[match[2]];
            if (bus)
                bus.volume = demoApplyValue(bus.volume, value, 0, 100);
        }
        else if ((match = /^BusXSendToMaster(On|Off)$/.exec(fn))) {
            const bus = this.buses[value];
            if (bus)
                bus.sendToMaster = match[1] === 'On';
        }
        else if (fn === 'StartExternal' || fn === 'StopExternal') {
            this.external = fn === 'StartExternal';
        }
        else if (fn === 'StartStreaming' || fn === 'StopStreaming') {
            this.streaming = fn === 'StartStreaming';
        }
        else if (fn === 'StartRecording' || fn === 'StopRecording') {
            this.recording = fn === 'StartRecording';
        }
        // Everything else is accepted and ignored, like a vMix without that feature set up.
    }
    // A loudness between 0 and 1 for something that is producing sound right now.
    level(input) {
        if (!input.hasAudio || input.muted || !input.running)
            return 0;
        const gain = Math.pow(10, input.gainDb / 20);
        return (0.06 + 0.3 * this.random() * this.random()) * (input.volume / 100) * gain;
    }
    meters(level) {
        const side = () => Math.min(1, level * (0.85 + 0.3 * this.random())).toFixed(5);
        return `meterF1="${side()}" meterF2="${side()}"`;
    }
    inputXml(input) {
        this.sync(input);
        const title = demoEscapeXml(input.title);
        const key = `00000000-0000-4000-8000-${String(input.number).padStart(12, '0')}`;
        const media = input.duration > 0;
        const attributes = [
            `key="${key}"`,
            `number="${input.number}"`,
            `type="${input.type}"`,
            `title="${title}"`,
            `shortTitle="${title}"`,
            `state="${input.running ? 'Running' : 'Paused'}"`,
            `position="${media ? Math.round(input.position) : 0}"`,
            `duration="${input.duration}"`,
            `loop="${input.loop ? 'True' : 'False'}"`,
        ];
        if (input.hasAudio) {
            attributes.push(`muted="${input.muted ? 'True' : 'False'}"`, `volume="${input.volume}"`, 'balance="0"', 'solo="False"', 'soloPFL="False"', `audiobusses="${input.buses.join(',')}"`, this.meters(this.level(input)), `gainDb="${input.gainDb}"`);
        }
        return `<input ${attributes.join(' ')}>${title}</input>`;
    }
    toXml() {
        const levels = this.inputs.map((input) => ({ input, level: this.level(input) }));
        const loudest = (bus) => Math.max(0, ...levels.filter((l) => l.input.buses.includes(bus)).map((l) => l.level));
        const busXml = DEMO_BUSES.map((name) => {
            const bus = this.buses[name];
            const level = bus.muted ? 0 : loudest(name) * (bus.volume / 100);
            return `<bus${name} volume="${bus.volume}" muted="${bus.muted ? 'True' : 'False'}" ${this.meters(level)} solo="False" sendToMaster="${bus.sendToMaster ? 'True' : 'False'}"/>`;
        });
        const toMaster = Math.max(loudest('M'), ...DEMO_BUSES.filter((name) => this.buses[name].sendToMaster && !this.buses[name].muted).map((name) => loudest(name) * (this.buses[name].volume / 100)));
        const masterLevel = this.master.muted ? 0 : toMaster * (this.master.volume / 100);
        const flag = (on) => (on ? 'True' : 'False');
        return [
            '<vmix>',
            '<version>27.0.0.83</version>',
            '<edition>4K</edition>',
            `<preset>C:\\Demo\\${demoEscapeXml(this.preset)}.vmix</preset>`,
            '<inputs>',
            ...this.inputs.map((input) => this.inputXml(input)),
            '</inputs>',
            '<overlays>',
            ...this.overlays
                .slice(1)
                .map((input, i) => input === 0
                ? `<overlay number="${i + 1}"/>`
                : `<overlay number="${i + 1}">${input}</overlay>`),
            '</overlays>',
            `<preview>${this.preview}</preview>`,
            `<active>${this.active}</active>`,
            `<fadeToBlack>${flag(this.fadeToBlack)}</fadeToBlack>`,
            `<recording>${flag(this.recording)}</recording>`,
            `<external>${flag(this.external)}</external>`,
            `<streaming>${flag(this.streaming)}</streaming>`,
            '<audio>',
            `<master volume="${this.master.volume}" muted="${flag(this.master.muted)}" ${this.meters(masterLevel)} headphonesVolume="100"/>`,
            ...busXml,
            '</audio>',
            '</vmix>',
        ].join('\n');
    }
}
// ===== Request handling =====
const DEMO_PRESETS = ['English Satsang', 'Hindi Satsang', 'Spanish Satsang'];
const DEMO_LANGUAGES = ['EN', 'HI', 'ES'];
const demoInstances = {};
function getDemoHostname(url) {
    try {
        const hostname = new URL(url).hostname;
        return /^demo\d*$/.test(hostname) ? hostname : null;
    }
    catch {
        return null;
    }
}
function createDemoVmix(hostname) {
    const index = Number(hostname.slice('demo'.length)) || 1;
    const preset = DEMO_PRESETS[index - 1] ?? `Demo ${index}`;
    // The third system has a slightly longer opening video, so "Group Compare" has something to find.
    return new DemoVmix(preset, Date.now, Math.random, index === 3 ? 12000 : 0, DEMO_LANGUAGES[index - 1] ?? '');
}
// Returns the response body for a demo host, or null when the URL is not a demo host.
function handleDemoRequest(url) {
    const hostname = getDemoHostname(url);
    if (hostname === null)
        return null;
    const instance = (demoInstances[hostname] ?? (demoInstances[hostname] = createDemoVmix(hostname)));
    const params = new URL(url).searchParams;
    if (params.has('Function')) {
        instance.execute(params);
        return '';
    }
    return instance.toXml();
}
function isDemoHost(host) {
    try {
        return getDemoHostname(getApiUrl(host)) !== null;
    }
    catch {
        return false;
    }
}
// "?demo" opens three grouped demo systems, unless the URL already lists boxes.
function applyDemoParam() {
    const url = new URL(window.location.href);
    if (!url.searchParams.has('demo'))
        return;
    url.searchParams.delete('demo');
    if (!url.searchParams.has('boxes')) {
        url.searchParams.set('boxes', 'English.demo¦Hindi.demo2¦Spanish.demo3');
        url.searchParams.set('group', '1 2 3');
        url.searchParams.set('master', '1');
    }
    window.history.replaceState({}, '', url);
}
// Shows the demo banner, or the welcome card while no box has an address yet.
function updateDemoUi() {
    const hosts = getBoxes()
        .map((box) => getBoxHost(box).trim())
        .filter((host) => host !== '');
    document.getElementById('demo-banner')?.classList.toggle('hidden', !hosts.some(isDemoHost));
    document.getElementById('welcome')?.classList.toggle('hidden', hosts.length > 0);
}
//# sourceMappingURL=demo.js.map