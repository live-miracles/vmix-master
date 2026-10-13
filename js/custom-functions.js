"use strict";
function customExecution(request) {
    masterSlaveExecute(request);
}
function renderCustomFunctions() {
    const input = {
        name: 'input',
        type: 'number',
        placeholder: 'Input',
        value: '',
        width: 'w-14',
        min: '1',
        max: '100',
    };
    const gain = {
        name: 'gain',
        type: 'number',
        placeholder: '0-24',
        value: '',
        width: 'w-14',
        min: '0',
        max: '24',
    };
    const volume = {
        name: 'volume',
        type: 'number',
        placeholder: '0-100',
        value: '100',
        width: 'w-14',
        min: '0',
        max: '100',
    };
    const min = {
        name: 'min',
        type: 'number',
        placeholder: 'min',
        value: '',
        width: 'w-14',
        min: '0',
        max: '10000',
    };
    const sec = {
        name: 'sec',
        type: 'number',
        placeholder: 'sec',
        value: '',
        width: 'w-14',
        min: '0',
        max: '10000',
    };
    const ms = {
        name: 'ms',
        type: 'number',
        placeholder: 'ms',
        value: '3000',
        width: 'w-14',
        min: '0',
        max: '60000',
    };
    const output = {
        name: 'output',
        type: 'number',
        placeholder: 'Output',
        value: '',
        width: 'w-16',
        min: '0',
    };
    const scriptName = {
        name: 'script-name',
        type: 'text',
        placeholder: 'Script Name',
        value: '',
        width: 'w-26',
    };
    const groups = [
        {
            title: 'Outputs',
            buttons: [
                { func: 'StartExternal', inputs: [] },
                { func: 'StopExternal', inputs: [] },
                { func: 'StartSRTOutput', inputs: [output] },
                { func: 'StopSRTOutput', inputs: [output] },
            ],
        },
        {
            title: 'Transitions',
            buttons: [
                { func: 'FadeToBlack', inputs: [] },
                { func: 'Stinger1', inputs: [input] },
                { func: 'Fade', inputs: [input] },
                { func: 'Cut', inputs: [input] },
            ],
        },
        {
            title: 'Audio',
            buttons: [
                { func: 'SetGain', inputs: [gain, input] },
                { func: 'SetVolumeFade', inputs: [volume, ms, input] },
                { func: 'SetMasterVolume', inputs: [volume] },
                { func: 'SetBusAVolume', inputs: [volume] },
                { func: 'SetBusBVolume', inputs: [volume] },
                { func: 'AudioOn', inputs: [input] },
                { func: 'AudioOff', inputs: [input] },
                { func: 'MasterAudioOn', inputs: [] },
                { func: 'MasterAudioOff', inputs: [] },
                { func: 'BusAAudioOn', inputs: [] },
                { func: 'BusAAudioOff', inputs: [] },
                { func: 'BusBAudioOn', inputs: [] },
                { func: 'BusBAudioOff', inputs: [] },
            ],
        },
        {
            title: 'Playback & Timers',
            buttons: [
                { func: 'SetPosition', inputs: [min, sec, input] },
                { func: 'StartCountdown', inputs: [input] },
                { func: 'StopCountdown', inputs: [input] },
            ],
        },
        {
            title: 'Scripts',
            buttons: [
                { func: 'ScriptStart', inputs: [scriptName] },
                { func: 'ScriptStop', inputs: [scriptName] },
            ],
        },
    ];
    const buttonColor = (func) => {
        if (/Start|On$/.test(func))
            return 'btn-success';
        if (/Stop|Off$/.test(func))
            return 'btn-error';
        return 'btn-accent';
    };
    const renderButton = (b) => `
            <div class="join">${b.inputs
        .map((input) => `
              <input
                type="${input.type}"
                placeholder="${input.placeholder}"
                name="${input.name}"
                class="${input.name}-param input input-xs join-item ${input.width}"
                value="${input.value}"
                min="${input.min ?? ''}"
                max="${input.max ?? ''}" />`)
        .join('')}
              <button class="function-btn btn btn-soft ${buttonColor(b.func)} btn-xs join-item">${b.func}</button>
            </div>`;
    const innerHTML = groups
        .map((g) => `
          <div class="rounded-box border border-base-content/10 bg-base-200 p-3">
            <h3 class="mb-2 text-xs font-semibold tracking-widest uppercase opacity-60">${g.title}</h3>
            <div class="flex flex-wrap gap-2">${g.buttons.map(renderButton).join('')}</div>
          </div>`)
        .join('');
    requireElement('.custom-functions-container').innerHTML += innerHTML;
    const executeBtn = requireElementById('execute-btn');
    executeBtn.onclick = () => customExecution(requireElementById('rawRequest').value);
    document.querySelectorAll('.function-btn').forEach((btn) => {
        btn.onclick = () => {
            const container = btn.parentElement;
            const inputParam = container.querySelector('.input-param');
            const gainParam = container.querySelector('.gain-param');
            const volumeParam = container.querySelector('.volume-param');
            const minParam = container.querySelector('.min-param');
            const secParam = container.querySelector('.sec-param');
            const msParam = container.querySelector('.ms-param');
            const scriptNameParam = container.querySelector('.script-name-param');
            const outputParam = container.querySelector('.output-param');
            let request = 'Function=' + btn.innerHTML;
            if (inputParam?.value) {
                request += '&Input=' + inputParam.value;
            }
            if (gainParam?.value) {
                request += '&Value=' + gainParam.value;
            }
            if (volumeParam?.value && msParam?.value) {
                request += '&Value=' + volumeParam.value + ',' + msParam.value;
            }
            else if (volumeParam?.value) {
                request += '&Value=' + volumeParam.value;
            }
            if (minParam?.value && secParam?.value) {
                request +=
                    '&Value=' + (parseInt(minParam.value) * 60 + parseInt(secParam.value)) + '000';
            }
            if (scriptNameParam?.value) {
                request += '&Value=' + scriptNameParam.value;
            }
            if (outputParam?.value) {
                request += '&Value=' + outputParam.value;
            }
            customExecution(request);
        };
    });
}
//# sourceMappingURL=custom-functions.js.map