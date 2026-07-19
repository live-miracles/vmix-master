import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
    ensureArray,
    extractLeadingNumbers,
    formatTime,
    formatTimeMMSS,
    getApiUrl,
    getShortText,
    parseNumbers,
    removeDuplicates,
    similarTypes,
    splitOnce,
} from '../public/ts/core.js';

describe('core helpers', () => {
    it('splits only on the first separator', () => {
        assert.deepEqual(splitOnce('main.192.168.1.20', '.'), ['main', '192.168.1.20']);
        assert.deepEqual(splitOnce('main', '.'), ['main', '']);
        assert.deepEqual(splitOnce('main::preview::program', '::'), ['main', 'preview::program']);
    });

    it('parses box numbers from space-separated input', () => {
        assert.deepEqual(parseNumbers(' 1  2 03 '), [1, 2, 3]);
        assert.deepEqual(parseNumbers(''), []);
        assert.deepEqual(parseNumbers('04 invalid 6'), [4, NaN, 6]);
    });

    it('preserves first occurrence order when removing duplicates', () => {
        assert.deepEqual(removeDuplicates([2, 1, 2, 3, 1]), [2, 1, 3]);
        assert.deepEqual(removeDuplicates(['main', 'slave', 'main']), ['main', 'slave']);
    });

    it('formats vMix durations', () => {
        assert.equal(formatTimeMMSS(0), '00:00');
        assert.equal(formatTimeMMSS(65000), '01:05');
        assert.equal(formatTimeMMSS(3661000), '1:01:01');
        assert.equal(formatTime(0), '00:00:00');
        assert.equal(formatTime(3661000), '01:01:01');
        assert.equal(formatTime(86399000), '23:59:59');
    });

    it('shortens long text symmetrically', () => {
        assert.equal(getShortText('abcdefghijkl', 6), 'abc...jkl');
        assert.equal(getShortText('abc', 6), 'abc');
        assert.equal(getShortText('abcdefghij', 5), 'ab...ij');
    });

    it('normalizes optional values into arrays', () => {
        assert.deepEqual(ensureArray(undefined), []);
        assert.deepEqual(ensureArray(null), [null]);
        assert.deepEqual(ensureArray('A'), ['A']);
        assert.deepEqual(ensureArray(['A', 'B']), ['A', 'B']);
    });

    it('extracts input title prefixes used for comparisons', () => {
        assert.equal(extractLeadingNumbers('05 Intro'), '05');
        assert.equal(extractLeadingNumbers('Virtual - 05_3 Speaker'), 'Virtual - 05_3');
        assert.equal(extractLeadingNumbers('12_8 Replay'), '12_8');
        assert.equal(extractLeadingNumbers('Virtual - Speaker 05'), '');
        assert.equal(extractLeadingNumbers('No prefix'), '');
    });

    it('groups compatible vMix media types', () => {
        assert.equal(similarTypes('Audio', 'VideoCall'), true);
        assert.equal(similarTypes('VideoCall', 'Audio'), true);
        assert.equal(similarTypes('Capture', 'SRT'), true);
        assert.equal(similarTypes('SRT', 'Capture'), true);
        assert.equal(similarTypes('Image', 'Image'), true);
        assert.equal(similarTypes('Video', 'Audio'), false);
    });

    it('builds vMix API URLs with the default port', () => {
        assert.equal(
            getApiUrl('192.168.1.2', 'Function=Cut'),
            'http://192.168.1.2:8088/api/?Function=Cut',
        );
        assert.equal(getApiUrl('192.168.1.2:8090'), 'http://192.168.1.2:8090/api/?');
        assert.equal(
            getApiUrl('vmix.local', 'Function=SetVolume&Value=%2B%3D3'),
            'http://vmix.local:8088/api/?Function=SetVolume&Value=%2B%3D3',
        );
    });
});
