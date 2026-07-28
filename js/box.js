function updateBoxNums() {
    let cnt = 1;
    Array.from(document.getElementsByClassName('box')).forEach((box) => {
        box.querySelector('.box-number').innerHTML = String(cnt++);
    });
}
function closeBox(e) {
    const box = e.currentTarget.closest('.box');
    box.parentNode.removeChild(box);
    updateBoxNums();
    updateBoxesParam();
}
function openBoxEdit(e) {
    const box = e.currentTarget.closest('.box');
    const modal = document.getElementById('box-edit-modal');
    modal.querySelector('.box-edit-number').value = String(getBoxNumber(box));
    modal.querySelector('.box-edit-name').value = getBoxName(box);
    modal.querySelector('.box-edit-host').value = getBoxHost(box);
    modal.showModal();
}
function openNewBoxForm() {
    const modal = document.getElementById('box-edit-modal');
    modal.querySelector('.box-edit-number').value = '';
    modal.querySelector('.box-edit-name').value = '';
    modal.querySelector('.box-edit-host').value = '';
    modal.showModal();
}
function saveBoxEdit() {
    const modal = document.getElementById('box-edit-modal');
    const boxNumber = parseInt(modal.querySelector('.box-edit-number').value);
    const name = modal.querySelector('.box-edit-name').value;
    const host = modal.querySelector('.box-edit-host').value;
    if (isNaN(boxNumber)) {
        addBox(name, host);
        updateBoxesParam();
        modal.close();
        return;
    }
    const box = getBox(boxNumber);
    if (box === null) {
        return;
    }
    box.querySelector('.name-input').value = name;
    box.querySelector('.host-input').value = host;
    updateBoxesParam();
    renderVmixInfo(box);
    modal.close();
}
function createBox(name, host, num) {
    const box = document.createElement('div');
    box.className = 'box m-1 w-full';
    box.innerHTML = `
        <div class="container max-w-full cursor-grab rounded-lg border border-accent bg-base-200 p-3">
          <span class="box-number hidden">${num}</span>
          <div class="mb-1 flex items-center gap-2">
            <div class="vmixStatus flex min-w-0 flex-1 flex-wrap items-center gap-1"></div>
            <div class="flex shrink-0 items-center justify-center gap-1">
              <button class="edit-btn focus btn btn-square btn-accent btn-outline btn-xs" title="Edit box" aria-label="Edit box">
                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                </svg>
              </button>
              <button class="close-btn focus btn btn-square btn-error btn-outline btn-xs" title="Delete box" aria-label="Delete box">
                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
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
          <input type="hidden" value="${name}" class="name-input" name="vmix-name">
          <input type="hidden" value="${host}" class="host-input" name="vmix-host">
        </div>`;
    box.querySelector('.edit-btn').onclick = openBoxEdit;
    box.querySelector('.close-btn').onclick = closeBox;
    return box;
}
//# sourceMappingURL=box.js.map