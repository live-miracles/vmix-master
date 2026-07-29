/// <reference path="./types.d.ts" />

const INPUTS_SIZE = 100;
const AUDIO_BUSES = ['M', 'A', 'B', 'C', 'D', 'E', 'F', 'G'];

function prerenderVmixWeb() {
    let inputsHTML = '';
    let busHTML = ``;
    AUDIO_BUSES.forEach(
        (bus) =>
            (busHTML += `
      <div id="mixer-${bus}" class="relative mx-px my-1 hidden w-fit rounded border border-base-content/25 bg-base-200 pr-3 align-top shadow-sm">
        <canvas class="volume-canvas absolute right-0 top-0 h-full w-2.5" width="100" height="100"></canvas>
        <div class="mixer-header btn flex h-fit min-h-0 w-full justify-start gap-0 rounded-none p-0">
          <span class="badge badge-neutral mx-1 my-1 w-6">${bus}</span>
          <span class="whitespace-nowrap">${getBusName(bus, true)}</span>
        </div>
        <div class="m-1 flex h-5 items-center gap-0.5">
          <button class="bus-volume-minus btn btn-neutral h-5 min-h-0 w-5.5 rounded-xs p-0 text-xs font-semibold" onclick="adjustBusVolume('${bus}', -3)">-</button>
          <span class="volume-value badge badge-neutral h-5 w-12 rounded-xs px-0 text-xs font-semibold"></span>
          <button class="bus-volume-plus btn btn-neutral h-5 min-h-0 w-5.5 rounded-xs p-0 text-xs font-semibold" onclick="adjustBusVolume('${bus}', 3)">+</button>
          <button class="mute-btn btn btn-neutral h-5 min-h-0 w-6 rounded-xs p-0" onclick="toggleBusAudio('${bus}')" aria-label="Toggle bus audio" title="Toggle bus audio">
            <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
          </button>
          ${bus === 'M' ? '' : `<button class="bus-M btn btn-neutral btn-sm h-5 min-h-0 w-5.5 rounded-xs p-0 text-xs" onclick="toggleSendToMaster('${bus}')">M</button>`}
        </div>
      </div>`),
    );

    for (let i = 1; i <= INPUTS_SIZE; i++) {
        inputsHTML += `
          <div id="input-${i}" class="relative mx-px my-1 hidden rounded border border-base-content/25 bg-base-200 pr-3 align-top shadow-sm">
            <canvas class="volume-canvas absolute right-0 top-0 w-2.5 h-full" width="100" height="100"></canvas>
            <button class="preview-btn btn w-52 whitespace-nowrap overflow-hidden flex h-fit min-h-0 justify-start p-0 gap-0 rounded-none" onclick="previewInput(${i})">
              <span class="badge badge-neutral mx-1 my-1 w-6">${i}</span>
              <span class="input-title whitespace-nowrap overflow-hidden inline-flex flex-1"></span>
            </button>
            <div class="mx-1 mb-1 mt-0">
              <button class="overlay1-btn btn btn-neutral h-5 w-5.5 min-h-0 p-0 rounded-xs" onclick="overlayInput(${i}, 1)">1</button>
              <button class="overlay2-btn btn btn-neutral h-5 w-5.5 min-h-0 p-0 rounded-xs" onclick="overlayInput(${i}, 2)">2</button>
              <button class="overlay3-btn btn btn-neutral h-5 w-5.5 min-h-0 p-0 rounded-xs" onclick="overlayInput(${i}, 3)">3</button>
              <button class="overlay4-btn btn btn-neutral h-5 w-5.5 min-h-0 p-0 rounded-xs" onclick="overlayInput(${i}, 4)">4</button>
              <button class="overlay5-btn btn btn-neutral h-5 w-5.5 min-h-0 p-0 rounded-xs" onclick="overlayInput(${i}, 5)">5</button>
              <button class="overlay6-btn btn btn-neutral h-5 w-5.5 min-h-0 p-0 rounded-xs" onclick="overlayInput(${i}, 6)">6</button>
              <button class="loop-btn btn btn-neutral h-5 w-6 min-h-0 p-0 rounded-xs" onclick="loopInput(${i})" aria-label="Toggle loop" title="Toggle loop">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></svg>
              </button>
            </div>
            <div class="input-audio-row m-1 mt-0 flex h-5 items-center gap-0.5">
              <button class="input-volume-minus btn btn-neutral h-5 w-5.5 min-h-0 rounded-xs p-0 text-xs font-semibold" onclick="adjustInputAudio(${i}, -1)">-</button>
              <span class="input-audio-value badge badge-neutral h-5 w-12 rounded-xs px-0 text-xs font-semibold"></span>
              <button class="input-volume-plus btn btn-neutral h-5 w-5.5 min-h-0 rounded-xs p-0 text-xs font-semibold" onclick="adjustInputAudio(${i}, 1)">+</button>
              <button class="audio-btn btn btn-neutral h-5 w-6 min-h-0 p-0 rounded-xs" onclick="muteInput(${i})" aria-label="Toggle audio" title="Toggle audio">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
              </button>
              ${AUDIO_BUSES.map(
                  (bus) =>
                      `<button class="bus-${bus} audio-bus-btn btn btn-neutral btn-sm h-5 min-h-0 w-5.5 rounded-xs p-0 text-xs" onclick="toggleAudioBus(${i}, '${bus}')">${bus}</button>`,
              ).join('')}
            </div>
          </div>`;
    }

    requireElementById('vmix-inputs').innerHTML = busHTML + inputsHTML;
}

async function renderVmixWeb() {
    const master = getMaster();
    if (master === null) {
        hideVmixWeb();
        return;
    }

    const vmixInfo = getVmixInfo(master);
    if (vmixInfo === null || vmixInfo.error || vmixInfo.value === null) {
        hideVmixWeb();
        return;
    }
    showVmixWeb();
    const info = vmixInfo.value;

    const active = info.inputs[info.active];
    const preview = info.inputs[info.preview];

    requireElementById('active-title').innerHTML = active.title;
    requireElementById('preview-title').innerHTML = preview.title;
    requireElementById('active-progress').innerHTML = getInputProgress(active);
    requireElementById('preview-progress').innerHTML = getInputProgress(preview);

    const screensElem = requireElementById('vmix-screens');
    const ftbBtn = requireElement('.ftb-btn', screensElem);
    if (info.fadeToBlack) {
        ftbBtn.classList.remove('btn-neutral');
        ftbBtn.classList.add('btn-error');
    } else {
        ftbBtn.classList.add('btn-neutral');
        ftbBtn.classList.remove('btn-error');
    }

    const inputLength = info.inputs.length;
    for (let i = inputLength; i <= INPUTS_SIZE; i++) {
        const inputElem = requireElementById('input-' + i);
        inputElem.classList.add('hidden');
        inputElem.classList.remove('inline-block');
    }

    const enabledBuses = AUDIO_BUSES.filter((bus) => info.audio[getBusName(bus)] !== undefined);

    AUDIO_BUSES.forEach((bus) => {
        const mixerElem = requireElementById('mixer-' + bus);
        const busInfo = info.audio[getBusName(bus)];
        if (busInfo === undefined) {
            mixerElem.classList.add('hidden');
            mixerElem.classList.remove('inline-block');
            return;
        }
        const busHeader = requireElement('.mixer-header', mixerElem);
        setColor(busHeader, busInfo.muted === 'False');
        mixerElem.classList.add('inline-block');
        mixerElem.classList.remove('hidden');
        const volumeElem = requireElement('.volume-value', mixerElem);
        volumeElem.innerHTML = Math.round(busInfo.volume) + '%';
        const volumeCanvas = requireElement<HTMLCanvasElement>('.volume-canvas', mixerElem);
        drawAudioLevels(volumeCanvas, busInfo);
        const muteBtn = requireElement('.mute-btn', mixerElem);
        setColor(muteBtn, busInfo.muted === 'False');
        if (bus !== 'M') {
            const sendToMasterBtn = requireElement('.bus-M', mixerElem);
            setColor(sendToMasterBtn, busInfo.sendToMaster === 'True');
        }
    });

    info.inputs.forEach((input: VmixInput, i: number) => {
        // Render input tile
        const inputElem = requireElementById('input-' + i);
        inputElem.classList.add('inline-block');
        inputElem.classList.remove('hidden');
        const inputTitleElem = requireElement('.input-title', inputElem);
        const inputTitleTip = getInputTitleTip(input, info.inputs);
        inputTitleElem.innerHTML = getResponsiveTitle(input.title);
        inputTitleElem.setAttribute('title', inputTitleTip);
        const previewBtn = requireElement('.preview-btn', inputElem);
        previewBtn.setAttribute('title', inputTitleTip);
        setColor(previewBtn, i === info.active, i === info.preview);
        const hasAudio = input.volume !== undefined;
        inputElem.classList.toggle('pr-3', hasAudio);

        const overlay1Btn = requireElement('.overlay1-btn', inputElem);
        setColor(overlay1Btn, info.overlays[1] === i);
        const overlay2Btn = requireElement('.overlay2-btn', inputElem);
        setColor(overlay2Btn, info.overlays[2] === i);
        const overlay3Btn = requireElement('.overlay3-btn', inputElem);
        setColor(overlay3Btn, info.overlays[3] === i);
        const overlay4Btn = requireElement('.overlay4-btn', inputElem);
        setColor(overlay4Btn, info.overlays[4] === i);
        const overlay5Btn = requireElement('.overlay5-btn', inputElem);
        setColor(overlay5Btn, info.overlays[5] === i);
        const overlay6Btn = requireElement('.overlay6-btn', inputElem);
        setColor(overlay6Btn, info.overlays[6] === i);

        const audioBtn = requireElement('.audio-btn', inputElem);
        setColor(audioBtn, input.muted === 'False');
        if (!hasAudio) {
            audioBtn.classList.add('invisible');
        } else {
            audioBtn.classList.remove('invisible');
        }
        const loopBtn = requireElement('.loop-btn', inputElem);
        setColor(loopBtn, input.loop === 'True');
        if (input.type === 'Image') {
            loopBtn.classList.add('invisible');
        } else {
            loopBtn.classList.remove('invisible');
        }
        const volumeCanvas = requireElement<HTMLCanvasElement>('.volume-canvas', inputElem);
        if (hasAudio) {
            volumeCanvas.classList.remove('hidden');
            drawAudioLevels(volumeCanvas, input);
        } else {
            volumeCanvas.classList.add('hidden');
        }

        const audioRow = requireElement('.input-audio-row', inputElem);
        if (!hasAudio) {
            audioRow.classList.add('hidden');
            return;
        }
        audioRow.classList.remove('hidden');

        const audioValue = requireElement('.input-audio-value', inputElem);
        audioValue.innerHTML = getInputAudioText(input);

        AUDIO_BUSES.forEach((bus) => {
            const busBtn = requireElement('.bus-' + bus, inputElem);
            busBtn.classList.toggle('hidden', !enabledBuses.includes(bus));
            setColor(busBtn, input.audiobusses.includes(bus));
        });
    });
}

function getMaster() {
    ensureMasterBox();
    const masterBox = getBoxes().find((box) => box.classList.contains('is-master'));
    return masterBox ? getBoxNumber(masterBox) : null;
}

function getMasterInfo() {
    const master = getMaster();
    const info = getVmixInfo(master)?.value;
    if (info === undefined || info === null) {
        showError('Internal Error', "Couldn't fetch vMix status for box " + master);
        return null;
    }
    return info;
}

function getGroupTargetNumbers() {
    const master = getMaster();
    const masterBox = getBox(master);
    if (masterBox === null || !getBoxGroup(masterBox)) {
        return [];
    }

    return getBoxes()
        .filter((box) => getBoxGroup(box) && getBoxNumber(box) !== master)
        .map((box) => getBoxNumber(box));
}

function hideVmixWeb() {
    const vmixContainer = requireElementById('vmix-container');
    vmixContainer.classList.add('hidden');
}

function showVmixWeb() {
    const vmixContainer = requireElementById('vmix-container');
    vmixContainer.classList.remove('hidden');
}

function formatTime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (num: number) => String(num).padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

function getInputProgress(input: VmixInput): string {
    if (input.duration === '0') return '';
    console.assert(['Video', 'AudioFile', 'Photos', 'PowerPoint'].includes(input.type));
    const duration = parseInt(input.duration);
    const position = parseInt(input.position);
    const remaining = duration - position;

    if (['Photos', 'PowerPoint'].includes(input.type)) {
        return `${position} / ${duration} / ${remaining}`;
    }
    return `${formatTime(position)} / ${formatTime(duration)} / ${formatTime(remaining)}`;
}

function getInputAudioText(input: VmixInput): string {
    return Math.round(getEffectiveInputVolume(input)) + '%';
}

function setColor(elem: Element, active: boolean, preview = false, type = 'btn'): void {
    // btn-neutral btn-primary btn-warning
    if (active) {
        elem.classList.remove(type + '-neutral');
        elem.classList.add(type + '-primary');
        elem.classList.remove(type + '-warning');
        elem.classList.remove(type + '-outline');
    } else if (preview) {
        elem.classList.remove(type + '-neutral');
        elem.classList.remove(type + '-primary');
        elem.classList.add(type + '-warning');
        elem.classList.remove(type + '-outline');
    } else {
        elem.classList.add(type + '-neutral');
        elem.classList.remove(type + '-primary');
        elem.classList.remove(type + '-warning');
        elem.classList.remove(type + '-outline');
    }
}
