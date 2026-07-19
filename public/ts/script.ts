function addBox(name = '', host = '') {
    const boxes = document.getElementById('boxes');
    boxes.appendChild(createBox(name, host, getBoxCount() + 1));
}

function splitOnce(str, separator) {
    const index = str.indexOf(separator);

    if (index === -1) {
        return [str, '']; // no dot found
    }

    return [str.slice(0, index), str.slice(index + 1)];
}

function initBoxes() {
    const params = new URLSearchParams(window.location.search);
    const boxesParam = params.get('boxes') ? params.get('boxes') : '';
    if (boxesParam === '') addBox();
    boxesParam
        .split('¦')
        .filter(Boolean)
        .map((str) => splitOnce(str, '.'))
        .forEach((param) => addBox(param[0], param[1]));
}

async function refreshInstance(box) {
    const num = getBoxNumber(box);
    const host = getBoxHost(box);
    if (host === '') {
        setVmixInfo(num, null);
    } else {
        setVmixInfo(num, await fetchVmixInfo(host));
    }
    renderVmixInfo(box);
    if (num === getMaster()) {
        renderVmixWeb();
    }
}

async function refreshInstances(cnt = 0) {
    if (cnt === 0 && refreshRate !== -1) {
        getBoxes().forEach(async (box) => refreshInstance(box));
    }

    const masterBox = getBox(getMaster());
    if (cnt !== 0 && masterBox !== null) {
        refreshInstance(masterBox);
    } else if (masterBox === null) {
        renderVmixWeb();
    }

    await sleep(1000);
    requestAnimationFrame(() => refreshInstances((cnt + 1) % refreshRate));
}

function showElements() {
    document.querySelectorAll('.show-toggle').forEach((elem) => {
        const name = elem.id.slice('show-'.length);
        const show = elem.checked;
        document.querySelectorAll('.' + name).forEach((e) => {
            if (show) {
                e.classList.remove('hidden');
            } else {
                e.classList.add('hidden');
            }
        });
    });
}

function updateRefreshRates() {
    const val1 = document.getElementById('refresh-rate').value;
    refreshRate = val1 === '' ? -1 : Math.max(1, parseInt(val1));
}

const HOST_OPTIONS_KEY = 'vmix-master-host-options';
const DEFAULT_HOST_OPTIONS = [{ name: 'My System', host: '192.168.154.x' }];

function getHostOptions() {
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
            name: row.querySelector('.host-option-name').value.trim(),
            host: row.querySelector('.host-option-host').value.trim(),
        }))
        .filter((option) => option.host !== '');

    localStorage.setItem(HOST_OPTIONS_KEY, JSON.stringify(options));
    renderHostDatalist();
}

function renderHostDatalist() {
    const hosts = document.getElementById('hosts');
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

function addHostOptionRow(name = '', host = '') {
    const hostOptions = document.getElementById('host-options');
    const row = document.createElement('div');
    row.className = 'host-option-row flex items-center gap-2';
    row.innerHTML = `
        <input type="text" class="host-option-name input input-xs w-36" placeholder="Name" value="">
        <input type="text" class="host-option-host input input-xs flex-1" placeholder="IP or domain" value="">
        <button type="button" class="remove-host-option btn btn-error btn-outline btn-square btn-xs" aria-label="Remove host suggestion">
          <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
            <path d="M5 12h14" />
          </svg>
        </button>`;

    row.querySelector('.host-option-name').value = name;
    row.querySelector('.host-option-host').value = host;
    row.querySelectorAll('input').forEach((input) =>
        input.addEventListener('change', saveHostOptions),
    );
    row.querySelector('.remove-host-option').addEventListener('click', () => {
        row.remove();
        saveHostOptions();
    });
    hostOptions.appendChild(row);
}

function renderHostOptions() {
    const hostOptions = document.getElementById('host-options');
    hostOptions.innerHTML = '';

    const options = getHostOptions();
    if (options.length === 0) {
        addHostOptionRow();
        return;
    }

    options.forEach((option) => addHostOptionRow(option.name, option.host));
}

async function showVmixScriptVersions() {
    try {
        const response = await fetch('./versions.json');
        if (!response.ok) return;

        const versions = await response.json();
        document.querySelectorAll('[data-script-version-key]').forEach((link) => {
            const key = link.getAttribute('data-script-version-key');
            const version = versions[key];
            if (!version) return;

            const name = link.textContent.split(' v')[0];
            link.textContent = `${name} v${version}`;
        });
    } catch (ex) {
        console.warn('Could not load vMix script versions', ex);
    }
}

let refreshRate = -1;
const vmixInfos = [];

(() => {
    setDocumentUrlParams();
    initBoxes();

    renderCustomFunctions();
    prerenderVmixWeb();
    renderHostDatalist();
    renderHostOptions();
    showVmixScriptVersions();
    showStoredLogs();
    showElements();

    document
        .querySelectorAll('.url-param')
        .forEach((input) => input.addEventListener('change', updateUrlParam));

    document
        .querySelectorAll('.show-toggle')
        .forEach((elem) => elem.addEventListener('click', showElements));

    document.getElementById('add-box').addEventListener('click', () => addBox());
    document.getElementById('add-host-option').addEventListener('click', () => addHostOptionRow());

    updateRefreshRates();
    document.getElementById('refresh-rate').addEventListener('change', updateRefreshRates);
    refreshInstances();

    new Sortable(document.getElementById('boxes'), {
        animation: 150,
        handle: '.cursor-grab', // Draggable by the entire row
        ghostClass: 'bg-base-300', // Adds a class for the dragged item
        onEnd: function (e) {
            updateBoxNums();
            updateBoxesParam();
        },
    });
})();
