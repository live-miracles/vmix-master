/// <reference path="./types.d.ts" />
/// <reference path="./tools.ts" />
/// <reference path="./box.ts" />
/// <reference path="./vmix-info.ts" />
/// <reference path="./vmix-web.ts" />
/// <reference path="./custom-functions.ts" />

function addBox(name = '', host = '', group = false): void {
    const boxes = requireElementById('boxes');
    boxes.appendChild(createBox(name, host, getBoxCount() + 1, group));
    updateBoxNums();
}

function splitOnce(str: string, separator: string): string[] {
    const index = str.indexOf(separator);

    if (index === -1) {
        return [str, '']; // no dot found
    }

    return [str.slice(0, index), str.slice(index + 1)];
}

function initBoxes() {
    const params = new URLSearchParams(window.location.search);
    const boxesParam = params.get('boxes') || '';
    if (boxesParam === '') addBox();
    boxesParam
        .split('¦')
        .filter(Boolean)
        .map((str) => splitOnce(str, '.'))
        .forEach((param) => addBox(param[0], param[1]));
}

async function refreshInstance(box: Element): Promise<void> {
    const num = getBoxNumber(box);
    const host = getBoxHost(box);
    if (host === '') {
        setVmixInfo(num, null);
    } else {
        if (getVmixInfo(num) === null) {
            renderVmixInfo(box); // Show "Connecting…" until the first reply
        }
        setVmixInfo(num, await fetchVmixInfo(host));
    }
    renderVmixInfo(box);
    if (num === getMaster()) {
        renderVmixWeb();
    }
}

async function refreshInstances(cnt = 0) {
    if (cnt === 0) {
        getBoxes().forEach(async (box) => refreshInstance(box));
    }

    if (getBox(getMaster()) === null) {
        renderVmixWeb();
    }

    await sleep(1000);
    requestAnimationFrame(() => refreshInstances((cnt + 1) % refreshRate));
}

function updateRefreshRates() {
    const seconds = parseInt(requireElementById<HTMLInputElement>('refresh-rate').value);
    // An empty or invalid value means the default of one second.
    refreshRate = Number.isNaN(seconds) ? 1 : Math.max(1, seconds);
}

const HOST_OPTIONS_KEY = 'vmix-master-host-options';
const DEFAULT_HOST_OPTIONS: HostOption[] = [{ name: 'My System', host: '192.168.154.x' }];

function getHostOptions(): HostOption[] {
    const stored = localStorage.getItem(HOST_OPTIONS_KEY);
    if (!stored) return DEFAULT_HOST_OPTIONS;

    try {
        return JSON.parse(stored);
    } catch (ex) {
        console.warn('Could not load host suggestions', ex);
        return [];
    }
}

function saveHostOptions() {
    const options = Array.from(document.querySelectorAll('.host-option-row'))
        .map((row) => ({
            name: requireElement('.host-option-name', row).value.trim(),
            host: requireElement('.host-option-host', row).value.trim(),
        }))
        .filter((option) => option.host !== '');

    localStorage.setItem(HOST_OPTIONS_KEY, JSON.stringify(options));
    renderHostDatalist();
}

function renderHostDatalist() {
    const hosts = requireElementById<HTMLDataListElement>('hosts');
    hosts.innerHTML = '';

    getHostOptions().forEach((option) => {
        const hostOption = document.createElement('option');
        hostOption.value = option.host;
        if (option.name) {
            hostOption.label = option.name;
            hostOption.textContent = option.name;
        }
        hosts.appendChild(hostOption);
    });
}

function addHostOptionRow(name = '', host = ''): void {
    const hostOptions = requireElementById('host-options');
    const row = document.createElement('div');
    row.className = 'host-option-row flex items-center gap-2';
    row.innerHTML = `
        <button type="button" class="host-option-handle btn btn-ghost btn-square btn-xs cursor-grab" aria-label="Reorder host suggestion" title="Reorder host suggestion">
          <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true">
            <path d="M9 5h.01" />
            <path d="M15 5h.01" />
            <path d="M9 12h.01" />
            <path d="M15 12h.01" />
            <path d="M9 19h.01" />
            <path d="M15 19h.01" />
          </svg>
        </button>
        <input type="text" class="host-option-name input input-xs w-36" placeholder="Name" value="">
        <input type="text" class="host-option-host input input-xs flex-1" placeholder="IP, host:port, or URL" value="">
        <button type="button" class="remove-host-option btn btn-error btn-outline btn-square btn-xs" aria-label="Remove host suggestion">
          <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
            <path d="M5 12h14" />
          </svg>
        </button>`;

    requireElement('.host-option-name', row).value = name;
    requireElement('.host-option-host', row).value = host;
    row.querySelectorAll('input').forEach((input) =>
        input.addEventListener('change', saveHostOptions),
    );
    requireElement('.remove-host-option', row).addEventListener('click', () => {
        row.remove();
        saveHostOptions();
    });
    hostOptions.appendChild(row);
}

function renderHostOptions() {
    const hostOptions = requireElementById('host-options');
    hostOptions.innerHTML = '';

    const options = getHostOptions();
    if (options.length === 0) {
        addHostOptionRow();
        return;
    }

    options.forEach((option: HostOption) => addHostOptionRow(option.name, option.host));
}

async function showVmixScriptVersions() {
    try {
        const response = await fetch('./versions.json');
        if (!response.ok) return;

        const versions = await response.json();
        document.querySelectorAll('[data-script-version-key]').forEach((link) => {
            const key = link.getAttribute('data-script-version-key');
            if (key === null) return;
            const version = versions[key];
            if (!version) return;

            const name = link.textContent.split(' v')[0];
            link.textContent = `${name} v${version}`;
        });
    } catch (ex) {
        console.warn('Could not load vMix script versions', ex);
    }
}

let refreshRate = 1;

(() => {
    applyDemoParam();
    setDocumentUrlParams();
    initBoxes();
    setInitialMasterBox();
    setInitialGroupBoxes();
    updateDemoUi();

    renderCustomFunctions();
    prerenderVmixWeb();
    renderHostDatalist();
    renderHostOptions();
    showVmixScriptVersions();
    showStoredLogs();

    document
        .querySelectorAll('.url-param')
        .forEach((input) => input.addEventListener('change', updateUrlParam));

    requireElementById('add-box').addEventListener('click', addNewBox);
    requireElementById('confirm-box-delete').addEventListener('click', confirmBoxDelete);
    requireElementById('add-host-option').addEventListener('click', () => addHostOptionRow());

    updateRefreshRates();
    requireElementById('refresh-rate').addEventListener('change', updateRefreshRates);
    refreshInstances();

    new Sortable(document.getElementById('boxes'), {
        animation: 150,
        handle: '.cursor-grab', // Draggable by the entire row
        filter: '.box-field-edit', // Keep text selection working while renaming
        preventOnFilter: false,
        ghostClass: 'bg-base-300', // Adds a class for the dragged item
        onEnd: function (_e: unknown) {
            updateBoxNums();
            updateBoxesParam();
            updateMasterParam();
            updateGroupParam();
            renderVmixWeb();
        },
    });

    new Sortable(document.getElementById('host-options'), {
        animation: 150,
        handle: '.host-option-handle',
        ghostClass: 'bg-base-300',
        onEnd: saveHostOptions,
    });
})();
