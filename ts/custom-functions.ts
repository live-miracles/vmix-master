function customExecution(request: string): void {
    masterSlaveExecute(request);
}

function renderCustomFunctions() {
    const input = {
        name: 'input',
        type: 'number',
        placeholder: 'Input',
        value: '',
        width: 'w-16',
        min: '1',
        max: '100',
    };
    const gain = {
        name: 'gain',
        type: 'number',
        placeholder: '0-24',
        value: '',
        width: 'w-16',
        min: '0',
        max: '24',
    };
    const volume = {
        name: 'volume',
        type: 'number',
        placeholder: '0-100',
        value: '100',
        width: 'w-16',
        min: '0',
        max: '100',
    };
    const min = {
        name: 'min',
        type: 'number',
        placeholder: 'min',
        value: '',
        width: 'w-16',
        min: '0',
        max: '10000',
    };
    const sec = {
        name: 'sec',
        type: 'number',
        placeholder: 'sec',
        value: '',
        width: 'w-16',
        min: '0',
        max: '10000',
    };
    const ms = {
        name: 'ms',
        type: 'number',
        placeholder: 'ms',
        value: '3000',
        width: 'w-16',
        min: '0',
        max: '60000',
    };
    const output = {
        name: 'output',
        type: 'number',
        placeholder: '0',
        value: '',
        width: 'w-16',
        min: '0',
    };
    const scriptName = {
        name: 'script-name',
        type: 'text',
        placeholder: 'Script Name',
        value: '',
        width: 'w-36',
    };

    // A field sent as one named parameter of the request: Value, or SelectedName for titles.
    const arg = (
        key: 'Value' | 'SelectedName',
        label: string,
        placeholder: string,
        options: { type?: string; width?: string; min?: string; max?: string; step?: string } = {},
    ) => ({
        name: 'arg',
        key,
        label,
        placeholder,
        type: options.type ?? 'text',
        value: '',
        width: options.width ?? 'w-24',
        min: options.min,
        max: options.max,
        step: options.step,
    });
    const number = (
        label: string,
        placeholder: string,
        min?: string,
        max?: string,
        step?: string,
    ) => arg('Value', label, placeholder, { type: 'number', width: 'w-16', min, max, step });
    const bus = arg('Value', 'Bus', 'A-G', { width: 'w-14' });
    const speed = number('Speed', '0-1', '0', '1', '0.1');
    const time = arg('Value', 'hh:mm:ss', '00:05:00', { width: 'w-24' });
    const field = arg('SelectedName', 'Field', 'optional', { width: 'w-28' });
    const text = arg('Value', 'Text', 'Text', { width: 'w-40' });

    const none: any[] = [];
    // Names are the vMix API function names. Functions that discard data, replace the whole
    // project or send keystrokes (OpenPreset, RemoveInput, ResetInput, SendKeys, ...) are left out.
    const groups: { title: string; collapsed?: boolean; buttons: any[] }[] = [
        {
            title: 'Outputs',
            buttons: [
                { func: 'StartExternal', inputs: none },
                { func: 'StopExternal', inputs: none },
                { func: 'StartStopExternal', inputs: none },
                { func: 'StartRecording', inputs: none },
                { func: 'StopRecording', inputs: none },
                { func: 'StartStopRecording', inputs: none },
                { func: 'StartMultiCorder', inputs: none },
                { func: 'StopMultiCorder', inputs: none },
                { func: 'StartStopMultiCorder', inputs: none },
                { func: 'Fullscreen', inputs: none },
                { func: 'StartSRTOutput', inputs: [output] },
                { func: 'StopSRTOutput', inputs: [output] },
                { func: 'StartStopSRTOutput', inputs: [output] },
                { func: 'StartStreaming', inputs: [number('Stream', 'all', '0')] },
                { func: 'StopStreaming', inputs: [number('Stream', 'all', '0')] },
                { func: 'StartStopStreaming', inputs: [number('Stream', 'all', '0')] },
                { func: 'Snapshot', inputs: [arg('Value', 'File name', 'snapshot.jpg')] },
            ],
        },
        {
            title: 'Transitions',
            buttons: [
                { func: 'FadeToBlack', inputs: none },
                { func: 'Transition1', inputs: none },
                { func: 'Transition2', inputs: none },
                { func: 'Transition3', inputs: none },
                { func: 'Transition4', inputs: none },
                { func: 'PreviewInputNext', inputs: none },
                { func: 'PreviewInputPrevious', inputs: none },
                { func: 'Stinger1', inputs: [input] },
                { func: 'Stinger2', inputs: [input] },
                { func: 'Stinger3', inputs: [input] },
                { func: 'Stinger4', inputs: [input] },
                { func: 'Fade', inputs: [input] },
                { func: 'Cut', inputs: [input] },
                { func: 'CutDirect', inputs: [input] },
                { func: 'QuickPlay', inputs: [input] },
                { func: 'PreviewInput', inputs: [input] },
                { func: 'ActiveInput', inputs: [input] },
                { func: 'SetFader', inputs: [number('T-bar', '0-255', '0', '255')] },
                ...[1, 2, 3, 4].map((n) => ({
                    func: 'SetTransitionDuration' + n,
                    inputs: [number('Duration ms', 'ms', '0')],
                })),
            ],
        },
        {
            title: 'Audio',
            buttons: [
                { func: 'MasterAudioOn', inputs: none },
                { func: 'MasterAudioOff', inputs: none },
                { func: 'BusAAudioOn', inputs: none },
                { func: 'BusAAudioOff', inputs: none },
                { func: 'BusBAudioOn', inputs: none },
                { func: 'BusBAudioOff', inputs: none },
                { func: 'SoloAllOff', inputs: none },
                { func: 'SetGain', inputs: [gain, input] },
                { func: 'SetVolume', inputs: [volume, input] },
                { func: 'SetVolumeFade', inputs: [volume, ms, input] },
                {
                    func: 'SetBalance',
                    inputs: [number('Balance', '-1 to 1', '-1', '1', '0.1'), input],
                },
                { func: 'SetMasterVolume', inputs: [volume] },
                { func: 'SetHeadphonesVolume', inputs: [volume] },
                { func: 'SetBusAVolume', inputs: [volume] },
                { func: 'SetBusBVolume', inputs: [volume] },
                { func: 'AudioOn', inputs: [input] },
                { func: 'AudioOff', inputs: [input] },
                { func: 'Audio', inputs: [input] },
                { func: 'Solo', inputs: [input] },
                { func: 'AudioBusOn', inputs: [bus, input] },
                { func: 'AudioBusOff', inputs: [bus, input] },
                { func: 'BusXAudio', inputs: [bus] },
                { func: 'BusXAudioOn', inputs: [bus] },
                { func: 'BusXAudioOff', inputs: [bus] },
                { func: 'BusXSendToMasterOn', inputs: [bus] },
                { func: 'BusXSendToMasterOff', inputs: [bus] },
            ],
        },
        {
            title: 'Overlays',
            collapsed: true,
            buttons: [
                { func: 'OverlayInputAllOff', inputs: none },
                ...[1, 2, 3, 4].map((n) => ({ func: `OverlayInput${n}Off`, inputs: none })),
                ...[1, 2, 3, 4].map((n) => ({ func: `OverlayInput${n}Zoom`, inputs: none })),
                ...[1, 2, 3, 4].map((n) => ({ func: `OverlayInput${n}`, inputs: [input] })),
                ...[1, 2, 3, 4].map((n) => ({ func: `OverlayInput${n}In`, inputs: [input] })),
                ...[1, 2, 3, 4].map((n) => ({ func: `OverlayInput${n}Out`, inputs: none })),
            ],
        },
        {
            title: 'Playback',
            collapsed: true,
            buttons: [
                { func: 'SetPosition', inputs: [min, sec, input] },
                { func: 'Play', inputs: [input] },
                { func: 'Pause', inputs: [input] },
                { func: 'PlayPause', inputs: [input] },
                { func: 'Restart', inputs: [input] },
                { func: 'Loop', inputs: [input] },
                { func: 'LoopOn', inputs: [input] },
                { func: 'LoopOff', inputs: [input] },
                { func: 'SetRate', inputs: [number('Rate', '0.1-4', '0.1', '4', '0.1'), input] },
                { func: 'NextItem', inputs: [input] },
                { func: 'PreviousItem', inputs: [input] },
                { func: 'NextPicture', inputs: [input] },
                { func: 'PreviousPicture', inputs: [input] },
            ],
        },
        {
            title: 'Countdowns',
            collapsed: true,
            buttons: [
                { func: 'StartCountdown', inputs: [input] },
                { func: 'StopCountdown', inputs: [input] },
                { func: 'PauseCountdown', inputs: [input] },
                { func: 'SuspendCountdown', inputs: [input] },
                { func: 'SetCountdown', inputs: [time, input] },
                { func: 'ChangeCountdown', inputs: [time, input] },
                { func: 'AdjustCountdown', inputs: [number('Seconds', '+/- s'), input] },
            ],
        },
        {
            title: 'Titles',
            collapsed: true,
            buttons: [
                { func: 'NextTitlePreset', inputs: [input] },
                { func: 'PreviousTitlePreset', inputs: [input] },
                { func: 'SelectTitlePreset', inputs: [number('Preset', '1', '1'), input] },
                { func: 'SetText', inputs: [field, text, input] },
                { func: 'SetTextVisible', inputs: [field, input] },
                { func: 'SetTextVisibleOn', inputs: [field, input] },
                { func: 'SetTextVisibleOff', inputs: [field, input] },
            ],
        },
        {
            title: 'Layers & Picture',
            collapsed: true,
            buttons: [
                { func: 'LayerOn', inputs: [number('Layer', '1', '1'), input] },
                { func: 'LayerOff', inputs: [number('Layer', '1', '1'), input] },
                { func: 'LayerOnOff', inputs: [number('Layer', '1', '1'), input] },
                { func: 'SetZoom', inputs: [number('Zoom', '1 = 100%', '0', '5', '0.1'), input] },
                { func: 'SetAlpha', inputs: [number('Alpha', '0-255', '0', '255'), input] },
            ],
        },
        {
            title: 'PTZ',
            collapsed: true,
            buttons: [
                { func: 'PTZHome', inputs: [input] },
                { func: 'PTZMoveStop', inputs: [input] },
                { func: 'PTZZoomStop', inputs: [input] },
                { func: 'PTZFocusAuto', inputs: [input] },
                ...['MoveUp', 'MoveDown', 'MoveLeft', 'MoveRight', 'ZoomIn', 'ZoomOut'].map(
                    (move) => ({ func: 'PTZ' + move, inputs: [speed, input] }),
                ),
            ],
        },
        {
            title: 'PlayLists',
            collapsed: true,
            buttons: [
                { func: 'StartPlayList', inputs: none },
                { func: 'StopPlayList', inputs: none },
                { func: 'NextPlayListEntry', inputs: none },
                { func: 'PreviousPlayListEntry', inputs: none },
                { func: 'SelectPlayList', inputs: [arg('Value', 'PlayList', 'Name')] },
            ],
        },
        {
            title: 'Scripts',
            collapsed: true,
            buttons: [
                { func: 'ScriptStopAll', inputs: none },
                { func: 'ScriptStart', inputs: [scriptName] },
                { func: 'ScriptStop', inputs: [scriptName] },
            ],
        },
    ];

    const buttonColor = (func: string) => {
        if (/StartStop/.test(func)) return 'btn-accent'; // toggles
        if (/Start|On$/.test(func)) return 'btn-success';
        if (/Stop|Off$/.test(func)) return 'btn-error';
        return 'btn-accent';
    };

    // "BusAAudioOn" -> "Bus A Audio On"
    const humanize = (func: string) =>
        func.replace(/([A-Z])([A-Z][a-z])/g, '$1 $2').replace(/([a-z0-9])([A-Z])/g, '$1 $2');

    const searchText = (func: string) => (func + ' ' + humanize(func)).toLowerCase();

    const fieldLabels: Record<string, string> = {
        input: 'Input',
        gain: 'Gain dB',
        volume: 'Volume',
        min: 'Min',
        sec: 'Sec',
        ms: 'Fade ms',
        output: 'Output',
        'script-name': 'Script',
    };

    const renderField = (input: any) => `
              <label class="flex flex-col gap-0.5">
                <span class="text-[11px] font-medium tracking-wide text-neutral-content/60 uppercase">${input.label ?? fieldLabels[input.name] ?? input.name}</span>
                <input
                  type="${input.type}"
                  placeholder="${input.placeholder}"
                  name="${input.name}"
                  class="${input.name}-param input input-xs ${input.width}"
                  ${input.key ? `data-key="${input.key}"` : ''}
                  value="${input.value}"
                  min="${input.min ?? ''}"
                  max="${input.max ?? ''}"
                  step="${input.step ?? ''}" />
              </label>`;

    // Functions without parameters are plain buttons; the rest get a row with labelled fields.
    const renderQuickButton = (b: any) =>
        `<button class="function-btn btn btn-soft ${buttonColor(b.func)} btn-sm" data-func="${b.func}" data-search="${searchText(b.func)}">${humanize(b.func)}</button>`;

    const renderRow = (b: any) => `
            <div data-search="${searchText(b.func)}" class="flex flex-wrap items-end justify-between gap-x-3 gap-y-2 rounded-lg border border-hairline bg-base-100/50 px-3 py-2">
              <span class="min-w-0 self-center text-sm font-medium">${humanize(b.func)}</span>
              <div class="flex flex-wrap items-end justify-end gap-2">${b.inputs.map(renderField).join('')}
                <button class="function-btn btn btn-soft ${buttonColor(b.func)} btn-xs" data-func="${b.func}">Run</button>
              </div>
            </div>`;

    // Open or closed groups are remembered on this device; the defaults apply until one is toggled.
    const GROUPS_KEY = 'vmix-master-function-groups';
    let savedGroups: Record<string, boolean> = {};
    try {
        savedGroups = JSON.parse(localStorage.getItem(GROUPS_KEY) ?? '{}');
    } catch {
        // Unreadable storage: fall back to the defaults.
    }
    const isOpen = (g: { title: string; collapsed?: boolean }) =>
        savedGroups[g.title] ?? !g.collapsed;

    const renderGroup = (g: { title: string; collapsed?: boolean; buttons: any[] }) => {
        const quick = g.buttons.filter((b) => b.inputs.length === 0);
        const rows = g.buttons.filter((b) => b.inputs.length > 0);
        return `
          <details class="fn-group rounded-box border border-hairline bg-base-200" data-group="${g.title}" ${isOpen(g) ? 'open' : ''}>
            <summary>${g.title}<span class="ml-auto text-[11px] font-normal tracking-normal text-neutral-content/60 normal-case">${g.buttons.length}</span></summary>
            <div class="flex flex-col gap-3 px-3 pb-3">
              ${quick.length ? `<div class="flex flex-wrap gap-2">${quick.map(renderQuickButton).join('')}</div>` : ''}
              ${rows.length ? `<div class="grid grid-cols-[repeat(auto-fill,minmax(min(20rem,100%),1fr))] gap-2">${rows.map(renderRow).join('')}</div>` : ''}
            </div>
          </details>`;
    };

    const filterBox = `
          <input
            id="function-filter"
            type="search"
            placeholder="Filter functions, e.g. volume or bus"
            aria-label="Filter functions"
            class="input input-sm w-full" />
          <p id="function-filter-empty" class="hidden px-1 text-sm text-neutral-content/70">No function matches.</p>`;

    const innerHTML = filterBox + groups.map(renderGroup).join('');

    requireElement('.custom-functions-container').innerHTML += innerHTML;

    const filter = requireElementById<HTMLInputElement>('function-filter');
    filter.addEventListener('input', () => {
        const words = filter.value.toLowerCase().split(/\s+/).filter(Boolean);
        let matches = 0;
        document.querySelectorAll('.fn-group').forEach((group) => {
            let groupMatches = 0;
            group.querySelectorAll('[data-search]').forEach((item) => {
                const text = item.getAttribute('data-search') ?? '';
                const show = words.every((word) => text.includes(word));
                item.classList.toggle('hidden', !show);
                if (show) groupMatches++;
            });
            group.classList.toggle('hidden', groupMatches === 0);
            // Matches are shown even if their group was collapsed.
            if (words.length > 0 && groupMatches > 0) (group as HTMLDetailsElement).open = true;
            matches += groupMatches;
        });
        requireElementById('function-filter-empty').classList.toggle('hidden', matches > 0);
    });

    document.querySelectorAll('.fn-group').forEach((group) => {
        group.addEventListener('toggle', () => {
            // Groups the filter opens or closes are not the user's choice.
            if (filter.value.trim() !== '') return;
            const def = groups.find((g) => g.title === group.getAttribute('data-group'));
            const open = (group as HTMLDetailsElement).open;
            // The browser also fires toggle for groups rendered open; only real changes are saved.
            if (!def || open === isOpen(def)) return;
            savedGroups[def.title] = open;
            try {
                localStorage.setItem(GROUPS_KEY, JSON.stringify(savedGroups));
            } catch {
                // Storage is optional.
            }
        });
    });

    const executeBtn = requireElementById('execute-btn');
    executeBtn.onclick = () =>
        customExecution(requireElementById<HTMLInputElement>('rawRequest').value);

    document.querySelectorAll('.function-btn').forEach((btn) => {
        btn.onclick = () => {
            const container = btn.parentElement!;
            const inputParam = container.querySelector('.input-param');
            const gainParam = container.querySelector('.gain-param');
            const volumeParam = container.querySelector('.volume-param');
            const minParam = container.querySelector('.min-param');
            const secParam = container.querySelector('.sec-param');
            const msParam = container.querySelector('.ms-param');
            const scriptNameParam = container.querySelector('.script-name-param');
            const outputParam = container.querySelector('.output-param');

            let request = 'Function=' + btn.getAttribute('data-func');
            if (inputParam?.value) {
                request += '&Input=' + inputParam.value;
            }
            if (gainParam?.value) {
                request += '&Value=' + gainParam.value;
            }
            if (volumeParam?.value && msParam?.value) {
                request += '&Value=' + volumeParam.value + ',' + msParam.value;
            } else if (volumeParam?.value) {
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
            container.querySelectorAll('.arg-param').forEach((arg) => {
                if (arg.value) {
                    request += `&${arg.getAttribute('data-key')}=${encodeURIComponent(arg.value)}`;
                }
            });
            customExecution(request);
        };
        // Enter in any field of a row runs that row's function.
        btn.parentElement!.querySelectorAll('input').forEach((field) =>
            field.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') (btn as HTMLElement).click();
            }),
        );
    });
}
