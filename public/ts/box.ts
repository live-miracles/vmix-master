function updateBoxNums() {
    let cnt = 1;
    Array.from(document.getElementsByClassName('box')).forEach((box) => {
        box.querySelector('.box-number')!.textContent = String(cnt++);
    });
    ensureMasterBox();
    updateBoxMasterStyles();
}

interface RemovedBox {
    name: string;
    host: string;
    group: boolean;
    master: boolean;
    index: number;
}

let undoToastTimer: number | undefined;

function hideUndoToast(): void {
    window.clearTimeout(undoToastTimer);
    document.getElementById('undo-toast')?.remove();
}

function showUndoToast(message: string, onUndo: () => void): void {
    hideUndoToast();
    const toast = document.createElement('div');
    toast.id = 'undo-toast';
    toast.className = 'toast toast-end z-50';
    toast.innerHTML = `
        <div class="alert alert-soft py-2 text-sm">
          <span class="undo-message"></span>
          <button class="btn btn-soft btn-accent btn-xs">Undo</button>
        </div>`;
    requireElement('.undo-message', toast).textContent = message;
    requireElement('button', toast).addEventListener('click', () => {
        hideUndoToast();
        onUndo();
    });
    document.body.appendChild(toast);
    undoToastTimer = window.setTimeout(hideUndoToast, 8000);
}

function restoreBox(removed: RemovedBox): void {
    const box = createBox(removed.name, removed.host, removed.index + 1, removed.group);
    requireElementById('boxes').insertBefore(box, getBoxes()[removed.index] ?? null);
    updateBoxNums();
    if (removed.master) {
        setMasterBox(box);
    }
    updateBoxesParam();
    updateGroupParam();
    updateMasterParam();
    renderVmixWeb();
    getBoxes().forEach((current) => refreshInstance(current));
}

let boxPendingDelete: Element | null = null;

function closeBox(e: Event): void {
    const box = (e.currentTarget as Element).closest('.box')!;
    const modal = document.getElementById('box-delete-modal') as HTMLDialogElement;
    const host = getBoxHost(box);
    boxPendingDelete = box;
    requireElement('.box-delete-name', modal).textContent = getBoxName(box);
    requireElement('.box-delete-host', modal).textContent = host ? ` (${host})` : '';
    modal.showModal();
}

function confirmBoxDelete(): void {
    const modal = document.getElementById('box-delete-modal') as HTMLDialogElement;
    modal.close();
    if (boxPendingDelete !== null) {
        deleteBox(boxPendingDelete);
        boxPendingDelete = null;
    }
}

function deleteBox(box: Element): void {
    const removed: RemovedBox = {
        name: getBoxName(box),
        host: getBoxHost(box),
        group: getBoxGroup(box),
        master: box.classList.contains('is-master'),
        index: getBoxes().indexOf(box),
    };
    box.parentNode!.removeChild(box);
    updateBoxNums();
    updateBoxesParam();
    updateGroupParam();
    updateMasterParam();
    renderVmixWeb();
    showUndoToast(`Removed "${removed.name}"`, () => restoreBox(removed));
}

function ensureMasterBox() {
    const boxes = getBoxes();
    if (boxes.length === 0) {
        return;
    }
    if (!boxes.some((box) => box.classList.contains('is-master'))) {
        boxes[0]!.classList.add('is-master');
    }
}

function setInitialMasterBox() {
    const params = new URLSearchParams(window.location.search);
    const master = parseInt(params.get('master') || '');
    const masterBox = getBox(master);
    if (masterBox !== null) {
        getBoxes().forEach((box) => box.classList.remove('is-master'));
        masterBox.classList.add('is-master');
    }
    ensureMasterBox();
    updateBoxMasterStyles();
    updateMasterParam();
}

function setInitialGroupBoxes() {
    const params = new URLSearchParams(window.location.search);
    const group = parseNumbers(params.get('group') || '');
    getBoxes().forEach((box) => {
        requireElement('.group-input', box).value = group.includes(getBoxNumber(box)) ? '1' : '0';
    });
    updateBoxMasterStyles();
    updateGroupParam();
}

function setMasterBox(box: Element): void {
    getBoxes().forEach((currentBox) => currentBox.classList.remove('is-master'));
    box.classList.add('is-master');
    updateBoxMasterStyles();
    updateMasterParam();
    renderVmixWeb();
}

function updateBoxMasterStyles() {
    getBoxes().forEach((box) => {
        const panel = requireElement('.box-panel', box);
        const isMaster = box.classList.contains('is-master');
        const isGroup = getBoxGroup(box);
        // Master only changes behaviour when it is in a group (actions then fan out), so the
        // MASTER label and the green outline are for the group master. Otherwise it is just selected.
        const isGroupMaster = isMaster && isGroup;
        panel.classList.toggle('border-primary', isGroupMaster);
        panel.classList.toggle('border-accent', isMaster && !isGroup);
        panel.classList.toggle('border-base-content/25', !isMaster);
        const groupBtn = requireElement('.group-btn', box);
        groupBtn.classList.toggle('btn-primary', isGroup);
        groupBtn.classList.toggle('btn-soft', isGroup);
        groupBtn.classList.toggle('btn-ghost', !isGroup);
        groupBtn.classList.toggle('opacity-70', !isGroup);
        groupBtn.setAttribute('aria-pressed', String(isGroup));
        // The group master shows its role next to the icon, so the button grows to fit the label.
        groupBtn.classList.toggle('btn-square', !isGroupMaster);
        groupBtn.classList.toggle('w-5', !isGroupMaster);
        groupBtn.classList.toggle('p-0', !isGroupMaster);
        groupBtn.classList.toggle('px-1.5', isGroupMaster);
        requireElement('.master-label', box).classList.toggle('hidden', !isGroupMaster);
        const groupState = isGroupMaster
            ? 'Group master (click to remove from group)'
            : isGroup
              ? 'In group (click to remove)'
              : 'Not in group (click to add)';
        groupBtn.title =
            groupState + '\nActions on group members will propagate to the other group members.';
        requireElement('.group-on', box).classList.toggle('hidden', !isGroup);
        requireElement('.group-off', box).classList.toggle('hidden', isGroup);
    });
    updateGroupCompareButton();
}

function updateGroupCompareButton() {
    const button = document.getElementById('group-compare') as HTMLButtonElement;
    const masterBox = getBox(getMaster());
    if (button === null) {
        return;
    }
    button.disabled = masterBox === null || !getBoxGroup(masterBox);
}

function addNewBox(): void {
    addBox();
    updateBoxesParam();
    updateMasterParam();
    const box = getBoxes()[getBoxCount() - 1]!;
    box.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    refreshInstance(box);
    startBoxFieldEdit(box, 'host');
}

function toggleBoxGroup(box: Element): void {
    requireElement('.group-input', box).value = getBoxGroup(box) ? '0' : '1';
    updateGroupParam();
    updateBoxMasterStyles();
}

function updateBoxHostDisplay(box: Element): void {
    const host = getBoxHost(box);
    const display = requireElement('.boxDisplayHost', box);
    display.textContent = host || 'Set address';
    display.title = host
        ? host + ' (double-click to edit address)'
        : 'Double-click to set the vMix address';
    display.classList.toggle('italic', host === '');
    display.classList.toggle('text-base-content', host !== '');
    display.classList.toggle('text-base-content/80', host === '');
}

function startBoxFieldEdit(box: Element, field: 'name' | 'host'): void {
    if (box.querySelector('.box-field-edit') !== null) {
        return;
    }
    const isName = field === 'name';
    const display = requireElement(isName ? '.boxDisplayName' : '.boxDisplayHost', box);
    const store = requireElement(isName ? '.name-input' : '.host-input', box);
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'box-field-edit input input-xs w-full min-w-0';
    if (isName) {
        input.classList.add('flex-1', 'text-sm', 'font-semibold');
    } else {
        input.placeholder = 'IP, host:port, or full API URL';
        input.setAttribute('list', 'hosts');
    }
    input.value = store.value;
    input.setAttribute('aria-label', isName ? 'Box name' : 'vMix address');
    const meta = isName ? null : requireElement('.vmixMeta', box);
    display.classList.add('hidden');
    meta?.classList.add('hidden');
    display.after(input);
    input.focus();
    input.select();

    let finished = false;
    const finish = (save: boolean) => {
        if (finished) {
            return;
        }
        finished = true;
        const value = input.value.trim();
        input.remove();
        display.classList.remove('hidden');
        meta?.classList.remove('hidden');
        // An empty name is not allowed, so it keeps the previous one. An empty address is.
        if (!save || value === store.value || (isName && value === '')) {
            return;
        }
        store.value = value;
        updateBoxesParam();
        if (isName) {
            renderVmixInfo(box);
            return;
        }
        updateBoxHostDisplay(box);
        setVmixInfo(getBoxNumber(box), null);
        renderVmixInfo(box);
        refreshInstance(box);
    };
    input.addEventListener('keydown', (e) => {
        e.stopPropagation();
        if (e.key === 'Enter') {
            finish(true);
        } else if (e.key === 'Escape') {
            finish(false);
        }
    });
    input.addEventListener('click', (e) => e.stopPropagation());
    input.addEventListener('blur', () => finish(true));
}

function createBox(name: string, host: string, num: number, group = false): HTMLDivElement {
    const box = document.createElement('div');
    const boxName = name || getDefaultBoxName(num);
    box.className = 'box w-72 shrink-0';
    box.innerHTML = `
        <div class="box-panel container max-w-full cursor-grab rounded-md border border-base-content/25 bg-base-200 p-2.5">
          <span class="box-number hidden">${num}</span>
          <div class="mb-1 flex items-start gap-2">
            <div class="flex min-w-0 flex-1 items-center gap-1.5">
              <span class="status-dot h-2 w-2 shrink-0 rounded-full bg-base-content/30" title="Not connected"></span>
              <div class="boxDisplayName min-w-0 cursor-text select-none overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold" title="${getBoxNameTitle(boxName)}">${getHtmlAttributeText(boxName)}</div>
            </div>
            <div class="flex shrink-0 items-center justify-center gap-0.5">
              <button class="group-btn focus btn btn-square h-5 min-h-0 w-5 gap-1 p-0" aria-pressed="false">
                <svg class="group-on hidden h-3 w-3" viewBox="0 0 24 24" fill="currentColor" fill-opacity="0.3" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <svg class="group-off h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                </svg>
                <span class="master-label hidden text-[10px] leading-none font-semibold">MASTER</span>
              </button>
              <button class="close-btn focus btn btn-square btn-ghost h-5 min-h-0 w-5 p-0 text-base-content/50 hover:text-error" title="Delete box" aria-label="Delete box">
                <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M3 6h18" />
                  <path d="M8 6V4h8v2" />
                  <path d="M19 6l-1 14H6L5 6" />
                  <path d="M10 11v5" />
                  <path d="M14 11v5" />
                </svg>
              </button>
            </div>
          </div>
          <div class="mb-1 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs">
            <div class="boxDisplayHost min-w-0 cursor-text select-none truncate"></div>
            <div class="vmixMeta flex min-w-0 flex-1 items-center gap-1.5"></div>
          </div>
          <div class="vmixInfo min-w-0 text-sm"></div>
          <input type="hidden" value="${getHtmlAttributeText(boxName)}" class="name-input" name="vmix-name">
          <input type="hidden" value="${getHtmlAttributeText(host)}" class="host-input" name="vmix-host">
          <input type="hidden" value="${group ? '1' : '0'}" class="group-input" name="vmix-group">
        </div>`;

    requireElement('.group-btn', box).addEventListener('click', () => toggleBoxGroup(box));
    (['name', 'host'] as const).forEach((field) => {
        const display = requireElement(
            field === 'name' ? '.boxDisplayName' : '.boxDisplayHost',
            box,
        );
        display.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            startBoxFieldEdit(box, field);
        });
    });
    updateBoxHostDisplay(box);
    requireElement('.close-btn', box).addEventListener('click', closeBox);
    box.querySelectorAll('button').forEach((button) =>
        button.addEventListener('click', (e) => e.stopPropagation()),
    );
    box.onclick = () => setMasterBox(box);

    return box;
}
