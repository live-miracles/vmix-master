const INPUTS_SIZE = 100;
function prerenderVmixWeb() {
    let inputsHTML = '';
    let busHTML = ``;
    ['M', 'A', 'B'].forEach((bus) => (busHTML += `
      <div id="mixer-${bus}" class="relative mx-1 my-1 hidden rounded border border-base-content/25 bg-base-200 pr-[12px] align-top shadow-sm">
        <canvas class="volume-canvas absolute right-0 top-0 h-full w-[10px]" width="100" height="100"></canvas>
        <div class="mixer-header btn flex h-fit min-h-0 w-52 justify-start gap-0 rounded-none p-0">
          <span class="badge badge-neutral mx-1 my-1 w-[24px]">${bus}</span>
          <span class="whitespace-nowrap">${getBusName(bus, true)}</span>
        </div>
        <div class="m-1 flex h-[20px] items-center gap-0.5">
          <button class="bus-volume-minus btn btn-neutral h-[20px] min-h-0 w-[22px] rounded-xs p-0 text-xs font-semibold" onclick="adjustBusVolume('${bus}', -3)">-</button>
          <span class="volume-value badge badge-neutral h-[20px] w-[58px] rounded-xs px-0 text-xs font-semibold"></span>
          <button class="bus-volume-plus btn btn-neutral h-[20px] min-h-0 w-[22px] rounded-xs p-0 text-xs font-semibold" onclick="adjustBusVolume('${bus}', 3)">+</button>
          <button class="mute-btn btn btn-neutral h-[20px] min-h-0 w-[24px] rounded-xs p-0" onclick="toggleBusAudio('${bus}')" aria-label="Toggle bus audio" title="Toggle bus audio">
            <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
          </button>
          ${bus === 'M' ? '' : `<button class="bus-M btn btn-neutral btn-sm h-[20px] min-h-0 w-[22px] rounded-xs p-0 text-xs" onclick="toggleSendToMaster('${bus}')">M</button>`}
        </div>
      </div>`));
    for (let i = 1; i <= INPUTS_SIZE; i++) {
        inputsHTML += `
          <div id="input-${i}" class="relative mx-1 my-1 hidden rounded border border-base-content/25 bg-base-200 pr-[12px] align-top shadow-sm">
            <canvas class="volume-canvas absolute right-0 top-0 w-[10px] h-full" width="100" height="100"></canvas>
            <button class="preview-btn btn w-52 whitespace-nowrap overflow-hidden flex h-fit min-h-0 justify-start p-0 gap-0 rounded-none" onclick="previewInput(${i})">
              <span class="badge badge-neutral mx-1 my-1 w-[24px]">${i}</span>
              <span class="input-title whitespace-nowrap overflow-hidden inline-flex flex-1"></span>
            </button>
            <div class="m-1">
              <button class="overlay1-btn btn btn-neutral w-[22px] h-[20px] min-h-0 p-0 rounded-xs" onclick="overlayInput(${i}, 1)">1</button>
              <button class="overlay2-btn btn btn-neutral w-[22px] h-[20px] min-h-0 p-0 rounded-xs" onclick="overlayInput(${i}, 2)">2</button>
              <button class="overlay3-btn btn btn-neutral w-[22px] h-[20px] min-h-0 p-0 rounded-xs" onclick="overlayInput(${i}, 3)">3</button>
              <button class="overlay4-btn btn btn-neutral w-[22px] h-[20px] min-h-0 p-0 rounded-xs" onclick="overlayInput(${i}, 4)">4</button>
              <button class="overlay5-btn btn btn-neutral w-[22px] h-[20px] min-h-0 p-0 rounded-xs" onclick="overlayInput(${i}, 5)">5</button>
              <button class="overlay6-btn btn btn-neutral w-[22px] h-[20px] min-h-0 p-0 rounded-xs" onclick="overlayInput(${i}, 6)">6</button>
              <button class="loop-btn btn btn-neutral w-[24px] h-[20px] min-h-0 p-0 rounded-xs" onclick="loopInput(${i})" aria-label="Toggle loop" title="Toggle loop">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></svg>
              </button>
            </div>
            <div class="input-audio-row m-1 mt-0 flex h-[20px] items-center gap-0.5">
              <button class="input-volume-minus btn btn-neutral w-[22px] h-[20px] min-h-0 rounded-xs p-0 text-xs font-semibold" onclick="adjustInputAudio(${i}, -1)">-</button>
              <span class="input-audio-value badge badge-neutral h-[20px] w-[58px] rounded-xs px-0 text-xs font-semibold"></span>
              <button class="input-volume-plus btn btn-neutral w-[22px] h-[20px] min-h-0 rounded-xs p-0 text-xs font-semibold" onclick="adjustInputAudio(${i}, 1)">+</button>
              <button class="audio-btn btn btn-neutral w-[24px] h-[20px] min-h-0 p-0 rounded-xs" onclick="muteInput(${i})" aria-label="Toggle audio" title="Toggle audio">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
              </button>
              <button class="bus-M btn btn-neutral btn-sm w-[22px] h-[20px] min-h-0 rounded-xs p-0 text-xs" onclick="toggleAudioBus(${i}, 'M')">M</button>
              <button class="bus-A btn btn-neutral btn-sm w-[22px] h-[20px] min-h-0 rounded-xs p-0 text-xs" onclick="toggleAudioBus(${i}, 'A')">A</button>
              <button class="bus-B btn btn-neutral btn-sm w-[22px] h-[20px] min-h-0 rounded-xs p-0 text-xs" onclick="toggleAudioBus(${i}, 'B')">B</button>
            </div>
          </div>`;
    }
    document.getElementById('vmix-inputs').innerHTML = busHTML + inputsHTML;
}
async function renderVmixWeb() {
    const masterInput = document.getElementById('master');
    const master = getMaster();
    if (master === null) {
        hideVmixWeb();
        masterInput.classList.add('input-error');
        return;
    }
    masterInput.classList.remove('input-error');
    const vmixInfo = getVmixInfo(master);
    if (vmixInfo === null || vmixInfo.error) {
        hideVmixWeb();
        return;
    }
    showVmixWeb();
    const info = vmixInfo.value;
    const active = info.inputs[info.active];
    const preview = info.inputs[info.preview];
    const screensElem = document.getElementById('vmix-screens');
    document.getElementById('active-title').innerHTML = active.title;
    document.getElementById('preview-title').innerHTML = preview.title;
    document.getElementById('active-progress').innerHTML = getInputProgress(active);
    document.getElementById('preview-progress').innerHTML = getInputProgress(preview);
    const ftbBtn = screensElem.querySelector('.ftb-btn');
    if (info.fadeToBlack) {
        ftbBtn.classList.remove('btn-neutral');
        ftbBtn.classList.add('btn-error');
    }
    else {
        ftbBtn.classList.add('btn-neutral');
        ftbBtn.classList.remove('btn-error');
    }
    const inputLength = info.inputs.length;
    for (let i = inputLength; i <= INPUTS_SIZE; i++) {
        const inputElem = document.getElementById('input-' + i);
        inputElem.classList.add('hidden');
        inputElem.classList.remove('inline-block');
    }
    ['M', 'A', 'B'].forEach((bus) => {
        const mixerElem = document.getElementById('mixer-' + bus);
        const busInfo = info.audio[getBusName(bus)];
        if (busInfo === undefined) {
            mixerElem.classList.add('hidden');
            mixerElem.classList.remove('inline-block');
            return;
        }
        const busHeader = mixerElem.querySelector('.mixer-header');
        setColor(busHeader, busInfo.muted === 'False');
        mixerElem.classList.add('inline-block');
        mixerElem.classList.remove('hidden');
        const volumeElem = mixerElem.querySelector('.volume-value');
        volumeElem.innerHTML = Math.round(busInfo.volume) + '%';
        const volumeCanvas = mixerElem.querySelector('.volume-canvas');
        drawAudioLevels(volumeCanvas, busInfo);
        const muteBtn = mixerElem.querySelector('.mute-btn');
        setColor(muteBtn, busInfo.muted === 'False');
        if (bus !== 'M') {
            const sendToMasterBtn = mixerElem.querySelector('.bus-M');
            setColor(sendToMasterBtn, busInfo.sendToMaster === 'True');
        }
    });
    info.inputs.forEach((input, i) => {
        // Render input tile
        const inputElem = document.getElementById('input-' + i);
        inputElem.classList.add('inline-block');
        inputElem.classList.remove('hidden');
        const inputTitleElem = inputElem.querySelector('.input-title');
        const inputTitleTip = getInputTitleTip(input, info.inputs);
        inputTitleElem.innerHTML = getResponsiveTitle(input.title);
        inputTitleElem.setAttribute('title', inputTitleTip);
        const previewBtn = inputElem.querySelector('.preview-btn');
        previewBtn.setAttribute('title', inputTitleTip);
        setColor(previewBtn, i === info.active, i === info.preview);
        const hasAudio = input.volume !== undefined;
        inputElem.classList.toggle('pr-[12px]', hasAudio);
        const overlay1Btn = inputElem.querySelector('.overlay1-btn');
        setColor(overlay1Btn, info.overlays[1] === i);
        const overlay2Btn = inputElem.querySelector('.overlay2-btn');
        setColor(overlay2Btn, info.overlays[2] === i);
        const overlay3Btn = inputElem.querySelector('.overlay3-btn');
        setColor(overlay3Btn, info.overlays[3] === i);
        const overlay4Btn = inputElem.querySelector('.overlay4-btn');
        setColor(overlay4Btn, info.overlays[4] === i);
        const overlay5Btn = inputElem.querySelector('.overlay5-btn');
        setColor(overlay5Btn, info.overlays[5] === i);
        const overlay6Btn = inputElem.querySelector('.overlay6-btn');
        setColor(overlay6Btn, info.overlays[6] === i);
        const audioBtn = inputElem.querySelector('.audio-btn');
        setColor(audioBtn, input.muted === 'False');
        if (!hasAudio) {
            audioBtn.classList.add('invisible');
        }
        else {
            audioBtn.classList.remove('invisible');
        }
        const loopBtn = inputElem.querySelector('.loop-btn');
        setColor(loopBtn, input.loop === 'True');
        if (input.type === 'Image') {
            loopBtn.classList.add('invisible');
        }
        else {
            loopBtn.classList.remove('invisible');
        }
        const volumeCanvas = inputElem.querySelector('.volume-canvas');
        if (hasAudio) {
            volumeCanvas.classList.remove('hidden');
            drawAudioLevels(volumeCanvas, input);
        }
        else {
            volumeCanvas.classList.add('hidden');
        }
        const audioRow = inputElem.querySelector('.input-audio-row');
        if (!hasAudio) {
            audioRow.classList.add('hidden');
            return;
        }
        audioRow.classList.remove('hidden');
        const audioValue = inputElem.querySelector('.input-audio-value');
        audioValue.innerHTML = getInputAudioText(input);
        const busM = inputElem.querySelector('.bus-M');
        setColor(busM, input.audiobusses.includes('M'));
        const busA = inputElem.querySelector('.bus-A');
        setColor(busA, input.audiobusses.includes('A'));
        const busB = inputElem.querySelector('.bus-B');
        setColor(busB, input.audiobusses.includes('B'));
    });
}
function getMaster() {
    const master = parseInt(document.getElementById('master').value);
    return isNaN(master) ? null : master;
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
function getSlaves() {
    const slaves = document.getElementById('slaves').value;
    return parseNumbers(slaves);
}
function hideVmixWeb() {
    const vmixContainer = document.getElementById('vmix-container');
    vmixContainer.classList.add('hidden');
}
function showVmixWeb() {
    const vmixContainer = document.getElementById('vmix-container');
    vmixContainer.classList.remove('hidden');
}
function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const pad = (num) => String(num).padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}
function getInputProgress(input) {
    if (input.duration === '0')
        return '';
    console.assert(['Video', 'AudioFile', 'Photos', 'PowerPoint'].includes(input.type));
    const duration = parseInt(input.duration);
    const position = parseInt(input.position);
    const remaining = duration - position;
    if (['Photos', 'PowerPoint'].includes(input.type)) {
        return `${position} / ${duration} / ${remaining}`;
    }
    return `${formatTime(position)} / ${formatTime(duration)} / ${formatTime(remaining)}`;
}
function getInputAudioText(input) {
    return Math.round(getEffectiveInputVolume(input)) + '%';
}
function setColor(elem, active, preview = false, type = 'btn') {
    // btn-neutral btn-primary btn-warning
    if (active) {
        elem.classList.remove(type + '-neutral');
        elem.classList.add(type + '-primary');
        elem.classList.remove(type + '-warning');
        elem.classList.remove(type + '-outline');
    }
    else if (preview) {
        elem.classList.remove(type + '-neutral');
        elem.classList.remove(type + '-primary');
        elem.classList.add(type + '-warning');
        elem.classList.remove(type + '-outline');
    }
    else {
        elem.classList.add(type + '-neutral');
        elem.classList.remove(type + '-primary');
        elem.classList.remove(type + '-warning');
        elem.classList.remove(type + '-outline');
    }
}
//# sourceMappingURL=vmix-web.js.map