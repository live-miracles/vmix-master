import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import vm from 'node:vm';

// demo.ts is a browser script, so run its compiled output in a sandbox.
const source = readFileSync(new URL('../../public/js/demo.js', import.meta.url), 'utf8');
const context = vm.createContext({ URL, URLSearchParams, Date, Math });
vm.runInContext(source, context);

interface Demo {
    execute(params: URLSearchParams): void;
    toXml(): string;
    inputs: { number: number; position: number; running: boolean; duration: number }[];
}
const DemoVmix = vm.runInContext('DemoVmix', context) as new (
    preset: string,
    now: () => number,
    random: () => number,
    openingExtraMs?: number,
) => Demo;
const handleDemoRequest = vm.runInContext('handleDemoRequest', context) as (
    url: string,
) => string | null;
const getDemoHostname = vm.runInContext('getDemoHostname', context) as (
    url: string,
) => string | null;

function create(clock = { t: 0 }) {
    const demo = new DemoVmix(
        'Test',
        () => clock.t,
        () => 0.5,
    );
    const run = (query: string) => demo.execute(new URLSearchParams(query));
    const xml = () => demo.toXml();
    return { demo, run, xml, clock };
}

const tag = (xml: string, name: string) => new RegExp(`<${name}>([^<]*)</${name}>`).exec(xml)?.[1];
const input = (xml: string, n: number) =>
    new RegExp(`<input [^>]*number="${n}"[^>]*>`).exec(xml)?.[0] ?? '';
const attr = (element: string, name: string) => new RegExp(` ${name}="([^"]*)"`).exec(element)?.[1];

describe('demo hosts', () => {
    it('recognises only demo hostnames', () => {
        assert.equal(getDemoHostname('http://demo:8088/api/'), 'demo');
        assert.equal(getDemoHostname('http://demo2:8088/api/?Function=Cut'), 'demo2');
        assert.equal(getDemoHostname('http://192.168.1.20:8088/api/'), null);
        assert.equal(getDemoHostname('http://demo.example.com:8088/api/'), null);
        assert.equal(getDemoHostname('not a url'), null);
    });

    it('answers demo requests locally and ignores other hosts', () => {
        assert.equal(handleDemoRequest('http://192.168.1.20:8088/api/'), null);
        assert.match(handleDemoRequest('http://demo:8088/api/') ?? '', /^<vmix>/);
        assert.equal(handleDemoRequest('http://demo:8088/api/?Function=Cut&Input=5'), '');
    });

    it('keeps one state per demo host', () => {
        handleDemoRequest('http://demo9:8088/api/?Function=FadeToBlack');
        assert.equal(tag(handleDemoRequest('http://demo9:8088/api/') ?? '', 'fadeToBlack'), 'True');
        assert.equal(
            tag(handleDemoRequest('http://demo8:8088/api/') ?? '', 'fadeToBlack'),
            'False',
        );
    });

    it('tags language-specific inputs per system and shares the rest', () => {
        const title = (host: string, n: number) =>
            attr(input(handleDemoRequest(`http://${host}:8088/api/`) ?? '', n), 'title');
        assert.equal(title('demo', 5), '05 Opening Video - EN.mp4');
        assert.equal(title('demo2', 5), '05 Opening Video - HI.mp4');
        assert.equal(title('demo3', 9), '09 Q&amp;A Slide - ES.png');
        assert.equal(title('demo2', 10), '10 Translator Mic - HI');
        // Cameras and the black are the same on every system.
        assert.equal(title('demo2', 2), '02 Stage Camera');
        assert.equal(title('demo3', 1), '01 Black');
        // Further demo systems have no language to tag.
        assert.equal(title('demo4', 5), '05 Opening Video.mp4');
    });

    it('makes the third system differ so Group Compare has something to report', () => {
        const duration = (host: string) =>
            attr(input(handleDemoRequest(`http://${host}:8088/api/`) ?? '', 5), 'duration');
        assert.equal(duration('demo'), '270000');
        assert.equal(duration('demo2'), '270000');
        assert.equal(duration('demo3'), '282000');
    });
});

describe('demo status', () => {
    it('describes the whole system', () => {
        const { xml } = create();
        const out = xml();
        assert.equal(tag(out, 'preview'), '5');
        assert.equal(tag(out, 'active'), '2');
        assert.equal(out.match(/<input /g)?.length, 12);
        assert.match(out, /<busA /);
        assert.match(out, /<busC /);
        assert.match(out, /<master /);
        assert.match(out, /<preset>C:\\Demo\\Test\.vmix<\/preset>/);
    });

    it('escapes titles', () => {
        assert.match(create().xml(), /title="09 Q&amp;A Slide\.png"/);
    });

    it('leaves audio attributes off inputs without audio', () => {
        const { xml } = create();
        assert.equal(attr(input(xml(), 4), 'volume'), undefined);
        assert.equal(attr(input(xml(), 2), 'volume'), '100');
    });
});

describe('demo switching', () => {
    it('swaps preview and program on a cut, and on the other transitions', () => {
        const { run, xml } = create();
        run('Function=Cut&Input=5');
        assert.equal(tag(xml(), 'active'), '5');
        assert.equal(tag(xml(), 'preview'), '2');
        run('Function=Stinger2&Input=9');
        assert.equal(tag(xml(), 'active'), '9');
        run('Function=Fade&Input=9');
        assert.equal(tag(xml(), 'preview'), '5');
    });

    it('sends an input to preview and program directly', () => {
        const { run, xml } = create();
        run('Function=PreviewInput&Input=11');
        assert.equal(tag(xml(), 'preview'), '11');
        run('Function=ActiveInput&Input=3');
        assert.equal(tag(xml(), 'active'), '3');
    });

    it('toggles fade to black and the streaming flags', () => {
        const { run, xml } = create();
        run('Function=FadeToBlack');
        assert.equal(tag(xml(), 'fadeToBlack'), 'True');
        run('Function=FadeToBlack');
        assert.equal(tag(xml(), 'fadeToBlack'), 'False');
        run('Function=StartExternal');
        assert.equal(tag(xml(), 'external'), 'True');
        run('Function=StopExternal');
        assert.equal(tag(xml(), 'external'), 'False');
        run('Function=StartStreaming');
        assert.equal(tag(xml(), 'streaming'), 'True');
    });

    it('toggles overlays on and off', () => {
        const { run, xml } = create();
        run('Function=OverlayInput3&Input=4');
        assert.match(xml(), /<overlay number="3">4<\/overlay>/);
        run('Function=OverlayInput3&Input=4');
        assert.match(xml(), /<overlay number="3"\/>/);
        run('Function=OverlayInput3&Input=4');
        run('Function=OverlayInput3&Input=9');
        assert.match(xml(), /<overlay number="3">9<\/overlay>/);
    });

    it('ignores unknown functions and missing inputs', () => {
        const { run, xml } = create();
        const before = xml();
        run('Function=ScriptStart&Value=Slave');
        run('Function=Cut&Input=99');
        run('Function=Nonsense');
        assert.equal(tag(xml(), 'active'), tag(before, 'active'));
    });
});

describe('demo playback', () => {
    it('advances a playing video with the clock', () => {
        const { run, xml, clock } = create();
        run('Function=Restart&Input=5');
        clock.t = 10000;
        assert.equal(attr(input(xml(), 5), 'position'), '10000');
        assert.equal(attr(input(xml(), 5), 'state'), 'Running');
    });

    it('pauses, plays and toggles', () => {
        const { run, xml, clock } = create();
        run('Function=Restart&Input=5');
        clock.t = 5000;
        run('Function=Pause&Input=5');
        clock.t = 20000;
        assert.equal(attr(input(xml(), 5), 'position'), '5000');
        assert.equal(attr(input(xml(), 5), 'state'), 'Paused');
        run('Function=Play&Input=5');
        clock.t = 21000;
        assert.equal(attr(input(xml(), 5), 'position'), '6000');
        run('Function=PlayPause&Input=5');
        assert.equal(attr(input(xml(), 5), 'state'), 'Paused');
    });

    it('seeks and clamps to the duration', () => {
        const { run, xml } = create();
        run('Function=SetPosition&Value=120000&Input=5');
        assert.equal(attr(input(xml(), 5), 'position'), '120000');
        run('Function=SetPosition&Value=99999999&Input=5');
        assert.equal(attr(input(xml(), 5), 'position'), '270000');
    });

    it('stops at the end, or wraps when looping', () => {
        const { run, xml, clock } = create();
        run('Function=Restart&Input=12');
        clock.t = 100000; // longer than the 90 s video
        assert.equal(attr(input(xml(), 12), 'position'), '90000');
        assert.equal(attr(input(xml(), 12), 'state'), 'Paused');

        run('Function=Restart&Input=7'); // the music loops
        clock.t = 100000 + 500000; // 480 s long
        assert.equal(attr(input(xml(), 7), 'state'), 'Running');
        assert.equal(attr(input(xml(), 7), 'position'), '20000');
    });

    it('quick plays an input from the start', () => {
        const { run, xml, clock } = create();
        run('Function=SetPosition&Value=100000&Input=6');
        run('Function=QuickPlay&Input=6');
        assert.equal(tag(xml(), 'active'), '6');
        assert.equal(attr(input(xml(), 6), 'position'), '0');
        assert.equal(attr(input(xml(), 6), 'state'), 'Running');
        clock.t = 3000;
        assert.equal(attr(input(xml(), 6), 'position'), '3000');
    });

    it('toggles looping', () => {
        const { run, xml } = create();
        run('Function=LoopOn&Input=5');
        assert.equal(attr(input(xml(), 5), 'loop'), 'True');
        run('Function=LoopOff&Input=5');
        assert.equal(attr(input(xml(), 5), 'loop'), 'False');
    });

    it('does not move slideshows with the clock', () => {
        const { xml, clock } = create();
        clock.t = 60000;
        assert.equal(attr(input(xml(), 8), 'position'), '3');
    });
});

describe('demo audio', () => {
    it('mutes and unmutes inputs', () => {
        const { run, xml } = create();
        run('Function=AudioOff&Input=2');
        assert.equal(attr(input(xml(), 2), 'muted'), 'True');
        run('Function=AudioOn&Input=2');
        assert.equal(attr(input(xml(), 2), 'muted'), 'False');
    });

    it('handles absolute and relative volume, clamped to 0-100', () => {
        const { run, xml } = create();
        run('Function=SetVolume&Value=50&Input=2');
        assert.equal(attr(input(xml(), 2), 'volume'), '50');
        run('Function=SetVolume&Value=' + encodeURIComponent('+=3') + '&Input=2');
        assert.equal(attr(input(xml(), 2), 'volume'), '53');
        run('Function=SetVolume&Value=' + encodeURIComponent('-=60') + '&Input=2');
        assert.equal(attr(input(xml(), 2), 'volume'), '0');
        run('Function=SetVolume&Value=150&Input=2');
        assert.equal(attr(input(xml(), 2), 'volume'), '100');
    });

    it('treats a "+" that lost its encoding as relative', () => {
        const { run, xml } = create();
        run('Function=SetVolume&Value=50&Input=2');
        run('Function=SetVolume&Value=+=3&Input=2');
        assert.equal(attr(input(xml(), 2), 'volume'), '53');
    });

    it('sets gain between 0 and 24 dB', () => {
        const { run, xml } = create();
        run('Function=SetGain&Value=6&Input=2');
        assert.equal(attr(input(xml(), 2), 'gainDb'), '6');
        run('Function=SetGain&Value=40&Input=2');
        assert.equal(attr(input(xml(), 2), 'gainDb'), '24');
    });

    it('routes inputs to buses', () => {
        const { run, xml } = create();
        assert.equal(attr(input(xml(), 2), 'audiobusses'), 'M,A');
        run('Function=AudioBusOff&Value=A&Input=2');
        assert.equal(attr(input(xml(), 2), 'audiobusses'), 'M');
        run('Function=AudioBusOn&Value=C&Input=2');
        assert.equal(attr(input(xml(), 2), 'audiobusses'), 'M,C');
        run('Function=AudioBusOn&Value=C&Input=2');
        assert.equal(attr(input(xml(), 2), 'audiobusses'), 'M,C');
    });

    it('controls the buses and master', () => {
        const { run, xml } = create();
        run('Function=MasterAudioOff');
        assert.match(xml(), /<master volume="100" muted="True"/);
        run('Function=BusAAudioOff');
        assert.match(xml(), /<busA volume="100" muted="True"/);
        run('Function=SetBusBVolume&Value=' + encodeURIComponent('-=3'));
        assert.match(xml(), /<busB volume="82"/);
        run('Function=SetMasterVolume&Value=40');
        assert.match(xml(), /<master volume="40"/);
        run('Function=BusXSendToMasterOff&Value=A');
        assert.match(xml(), /<busA [^>]*sendToMaster="False"/);
    });

    it('only meters sources that are producing sound', () => {
        const { run, xml } = create();
        const meter = (n: number) => Number(attr(input(xml(), n), 'meterF1'));
        assert.ok(meter(2) > 0, 'live camera audio is metered');
        assert.equal(meter(5), 0, 'a paused video is silent');
        run('Function=Play&Input=5');
        assert.ok(meter(5) > 0, 'a playing video is metered');
        run('Function=AudioOff&Input=5');
        assert.equal(meter(5), 0, 'a muted input is silent');
    });
});
