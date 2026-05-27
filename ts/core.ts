export function splitOnce(str: string, separator: string): [string, string] {
    const index = str.indexOf(separator);
    return index === -1 ? [str, ''] : [str.slice(0, index), str.slice(index + separator.length)];
}

export function removeDuplicates<T>(arr: T[]): T[] {
    return arr.filter((val, index) => arr.indexOf(val) === index);
}

export function getShortText(str: string, len: number): string {
    return str.length > len ? str.slice(0, len / 2) + '...' + str.slice(-len / 2) : str;
}

export function parseNumbers(str: string): number[] {
    return str
        .split(' ')
        .map((num) => num.trim())
        .filter((num) => num !== '')
        .map((num) => parseInt(num));
}

export function ensureArray<T>(element: T | T[] | undefined): T[] {
    if (element === undefined) return [];
    return Array.isArray(element) ? element : [element];
}

export function formatTimeMMSS(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const pad = (num: number) => String(num).padStart(2, '0');
    return `${hours === 0 ? '' : hours + ':'}${pad(minutes)}:${pad(seconds)}`;
}

export function formatTime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const pad = (num: number) => String(num).padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export function extractLeadingNumbers(input: string): string {
    const match = input.match(/^(Virtual - )?(\d+(?:_\d+)?)/);
    return match ? `${match[1] ?? ''}${match[2]}` : '';
}

export function similarTypes(type1: string, type2: string): boolean {
    const audioTypes = ['Audio', 'VideoCall'];
    const videoTypes = ['Capture', 'SRT'];
    if (audioTypes.includes(type1) && audioTypes.includes(type2)) return true;
    if (videoTypes.includes(type1) && videoTypes.includes(type2)) return true;
    return type1 === type2;
}

export function getApiUrl(host: string, request = ''): string {
    const fullHost = host.includes(':') ? host : `${host}:8088`;
    return `http://${fullHost}/api/?${request}`;
}
