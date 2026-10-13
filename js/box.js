"use strict";
function updateBoxNums() {
    let cnt = 1;
    Array.from(document.getElementsByClassName('box')).forEach((box) => {
        box.querySelector('.box-number').textContent = String(cnt++);
    });
    ensureMasterBox();
    updateBoxMasterStyles();
}
function closeBox(e) {
    const box = e.currentTarget.closest('.box');
    box.parentNode.removeChild(box);
    updateBoxNums();
    updateBoxesParam();
    updateGroupParam();
    updateMasterParam();
    renderVmixWeb();
}
function ensureMasterBox() {
    const boxes = getBoxes();
    if (boxes.length === 0) {
        return;
    }
    if (!boxes.some((box) => box.classList.contains('is-master'))) {
        boxes[0].classList.add('is-master');
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
function setMasterBox(box) {
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
        panel.classList.toggle('border-accent', isMaster);
        panel.classList.toggle('border-base-content/25', !isMaster);
        requireElement('.boxDisplayName', box).classList.toggle('text-accent', !isGroup);
        requireElement('.boxDisplayName', box).classList.toggle('text-primary', isGroup);
        const groupBtn = requireElement('.group-btn', box);
        groupBtn.classList.toggle('btn-primary', isGroup);
        groupBtn.classList.toggle('btn-soft', isGroup);
        groupBtn.classList.toggle('btn-ghost', !isGroup);
        groupBtn.classList.toggle('opacity-50', !isGroup);
        groupBtn.setAttribute('aria-pressed', String(isGroup));
        groupBtn.title = isGroup ? 'In group (click to remove)' : 'Not in group (click to add)';
        requireElement('.group-on', box).classList.toggle('hidden', !isGroup);
        requireElement('.group-off', box).classList.toggle('hidden', isGroup);
    });
    updateGroupCompareButton();
}
function updateGroupCompareButton() {
    const button = document.getElementById('group-compare');
    const masterBox = getBox(getMaster());
    if (button === null) {
        return;
    }
    button.disabled = masterBox === null || !getBoxGroup(masterBox);
}
function openNewBoxForm() {
    const modal = document.getElementById('box-edit-modal');
    requireElement('.box-edit-name', modal).value = getDefaultBoxName(getBoxCount() + 1);
    requireElement('.box-edit-host', modal).value = '';
    requireElement('.box-edit-group', modal).checked = false;
    clearBoxEditValidation();
    modal.showModal();
}
function setInputValidationStyle(input) {
    input.classList.toggle('input-error', !input.checkValidity());
}
function clearBoxEditValidation() {
    const modal = document.getElementById('box-edit-modal');
    modal.querySelectorAll('.box-edit-name, .box-edit-host').forEach((input) => {
        input.classList.remove('input-error');
    });
}
function saveBoxEdit() {
    const modal = document.getElementById('box-edit-modal');
    const nameInput = requireElement('.box-edit-name', modal);
    const hostInput = requireElement('.box-edit-host', modal);
    const groupInput = requireElement('.box-edit-group', modal);
    const name = nameInput.value.trim();
    const host = hostInput.value.trim();
    nameInput.value = name;
    hostInput.value = host;
    setInputValidationStyle(nameInput);
    setInputValidationStyle(hostInput);
    if (!nameInput.reportValidity() || !hostInput.reportValidity()) {
        return;
    }
    addBox(name, host, groupInput.checked);
    updateBoxesParam();
    updateGroupParam();
    modal.close();
}
function toggleBoxGroup(box) {
    requireElement('.group-input', box).value = getBoxGroup(box) ? '0' : '1';
    updateGroupParam();
    updateBoxMasterStyles();
}
function updateBoxHostDisplay(box) {
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
function startBoxFieldEdit(box, field) {
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
    }
    else {
        input.placeholder = 'IP, host:port, or full API URL';
        input.setAttribute('list', 'hosts');
    }
    input.value = store.value;
    input.setAttribute('aria-label', isName ? 'Box name' : 'vMix address');
    display.classList.add('hidden');
    display.after(input);
    input.focus();
    input.select();
    let finished = false;
    const finish = (save) => {
        if (finished) {
            return;
        }
        finished = true;
        const value = input.value.trim();
        input.remove();
        display.classList.remove('hidden');
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
        }
        else if (e.key === 'Escape') {
            finish(false);
        }
    });
    input.addEventListener('click', (e) => e.stopPropagation());
    input.addEventListener('blur', () => finish(true));
}
function createBox(name, host, num, group = false) {
    const box = document.createElement('div');
    const boxName = name || getDefaultBoxName(num);
    box.className = 'box w-72 shrink-0';
    box.innerHTML = `
        <div class="box-panel container max-w-full cursor-grab rounded-md border border-base-content/25 bg-base-200 p-2">
          <span class="box-number hidden">${num}</span>
          <div class="mb-1 flex items-start gap-2">
            <div class="flex min-w-0 flex-1 items-center gap-1">
              <div class="boxDisplayName min-w-0 cursor-text select-none overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-accent" title="${getBoxNameTitle(boxName)}">${getHtmlAttributeText(boxName)}</div>
            </div>
            <div class="flex shrink-0 items-center justify-center gap-0.5">
              <button class="group-btn focus btn btn-square h-5 min-h-0 w-5 p-0" aria-pressed="false">
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
              </button>
              <button class="close-btn focus btn btn-square btn-error btn-outline h-5 min-h-0 w-5 p-0" title="Delete box" aria-label="Delete box">
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
          <div class="boxDisplayHost mb-1 min-w-0 cursor-text select-none truncate text-xs"></div>
          <div class="vmixInfo min-w-0 text-sm"></div>
          <input type="hidden" value="${getHtmlAttributeText(boxName)}" class="name-input" name="vmix-name">
          <input type="hidden" value="${getHtmlAttributeText(host)}" class="host-input" name="vmix-host">
          <input type="hidden" value="${group ? '1' : '0'}" class="group-input" name="vmix-group">
        </div>`;
    requireElement('.group-btn', box).addEventListener('click', () => toggleBoxGroup(box));
    ['name', 'host'].forEach((field) => {
        const display = requireElement(field === 'name' ? '.boxDisplayName' : '.boxDisplayHost', box);
        display.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            startBoxFieldEdit(box, field);
        });
    });
    updateBoxHostDisplay(box);
    requireElement('.close-btn', box).addEventListener('click', closeBox);
    box.querySelectorAll('button').forEach((button) => button.addEventListener('click', (e) => e.stopPropagation()));
    box.onclick = () => setMasterBox(box);
    return box;
}
//# sourceMappingURL=box.js.map