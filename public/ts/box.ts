function updateBoxNums() {
    let cnt = 1;
    Array.from(document.getElementsByClassName('box')).forEach((box) => {
        box.querySelector('.box-number').innerHTML = String(cnt++);
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
        box.querySelector('.group-input').value = group.includes(getBoxNumber(box)) ? '1' : '0';
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
        const panel = box.querySelector('.box-panel');
        const isMaster = box.classList.contains('is-master');
        const isGroup = getBoxGroup(box);
        panel.classList.toggle('border-accent', isMaster);
        panel.classList.toggle('border-base-content/25', !isMaster);
        box.querySelector('.boxDisplayName').classList.toggle('text-accent', !isGroup);
        box.querySelector('.boxDisplayName').classList.toggle('text-primary', isGroup);
        box.querySelector('.group-icon').classList.toggle('hidden', !isGroup);
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

function openBoxEdit(e) {
    const box = e.currentTarget.closest('.box');
    const modal = document.getElementById('box-edit-modal') as HTMLDialogElement;
    modal.querySelector('.box-edit-number').value = String(getBoxNumber(box));
    modal.querySelector('.box-edit-name').value = getBoxName(box);
    modal.querySelector('.box-edit-host').value = getBoxHost(box);
    modal.querySelector('.box-edit-group').checked = getBoxGroup(box);
    clearBoxEditValidation();
    modal.showModal();
}

function openNewBoxForm() {
    const modal = document.getElementById('box-edit-modal') as HTMLDialogElement;
    modal.querySelector('.box-edit-number').value = '';
    modal.querySelector('.box-edit-name').value = '';
    modal.querySelector('.box-edit-host').value = '';
    modal.querySelector('.box-edit-group').checked = false;
    clearBoxEditValidation();
    modal.showModal();
}

function setInputValidationStyle(input) {
    input.classList.toggle('input-error', !input.checkValidity());
}

function clearBoxEditValidation() {
    const modal = document.getElementById('box-edit-modal') as HTMLDialogElement;
    modal.querySelectorAll('.box-edit-name, .box-edit-host').forEach((input) => {
        input.classList.remove('input-error');
    });
}

function saveBoxEdit() {
    const modal = document.getElementById('box-edit-modal') as HTMLDialogElement;
    const nameInput = modal.querySelector('.box-edit-name');
    const hostInput = modal.querySelector('.box-edit-host');
    const groupInput = modal.querySelector('.box-edit-group');
    const boxNumber = parseInt(modal.querySelector('.box-edit-number').value);
    const name = nameInput.value.trim();
    const host = hostInput.value.trim();
    const group = groupInput.checked;

    nameInput.value = name;
    hostInput.value = host;
    setInputValidationStyle(nameInput);
    setInputValidationStyle(hostInput);
    if (!nameInput.reportValidity() || !hostInput.reportValidity()) {
        return;
    }

    if (isNaN(boxNumber)) {
        addBox(name, host, group);
        updateBoxesParam();
        updateGroupParam();
        modal.close();
        return;
    }

    const box = getBox(boxNumber);
    if (box === null) {
        return;
    }
    box.querySelector('.name-input').value = name;
    box.querySelector('.host-input').value = host;
    box.querySelector('.group-input').value = group ? '1' : '0';
    updateBoxesParam();
    updateGroupParam();
    updateBoxMasterStyles();
    renderVmixInfo(box);
    modal.close();
}

function createBox(name, host, num, group = false) {
    const box = document.createElement('div');
    const boxName = name || `Box ${num}`;
    box.className = 'box w-64 shrink-0';
    box.innerHTML = `
        <div class="box-panel container max-w-full cursor-grab rounded-md border border-base-content/25 bg-base-200 p-2">
          <span class="box-number hidden">${num}</span>
          <div class="mb-1 flex items-start gap-2">
            <div class="flex min-w-0 flex-1 items-center gap-1">
              <div class="boxDisplayName min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-accent" title="${getHtmlAttributeText(boxName)}">${getHtmlAttributeText(boxName)}</div>
              <svg class="group-icon hidden h-3.5 w-3.5 shrink-0 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-label="Part of group" role="img">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div class="flex shrink-0 items-center justify-center gap-0.5">
              <button class="edit-btn focus btn btn-square btn-accent btn-outline h-[20px] min-h-0 w-[20px] p-0" title="Edit box" aria-label="Edit box">
                <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                </svg>
              </button>
              <button class="close-btn focus btn btn-square btn-error btn-outline h-[20px] min-h-0 w-[20px] p-0" title="Delete box" aria-label="Delete box">
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
          <div class="vmixInfo min-w-0 text-sm"></div>
          <input type="hidden" value="${getHtmlAttributeText(name)}" class="name-input" name="vmix-name">
          <input type="hidden" value="${getHtmlAttributeText(host)}" class="host-input" name="vmix-host">
          <input type="hidden" value="${group ? '1' : '0'}" class="group-input" name="vmix-group">
        </div>`;

    box.querySelector('.edit-btn').onclick = openBoxEdit;
    box.querySelector('.close-btn').onclick = closeBox;
    box.querySelectorAll('button').forEach((button) =>
        button.addEventListener('click', (e) => e.stopPropagation()),
    );
    box.onclick = () => setMasterBox(box);

    return box;
}
