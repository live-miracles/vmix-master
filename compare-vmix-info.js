function extractLeadingNumbers(input) {
    const match = input.match(/^(Virtual - )?(\d+(?:_\d+)?)/);
    if (match) {
        return match[1] ? match[1] + match[2] : match[2];
    }
    return '';
}

function getError(type, msg) {
    return `<div><span class="text-error font-semibold">Error: ${type}.</span> ${msg}</div>`;
}

function getWarning(type, msg) {
    return `<div><span class="text-warning font-semibold">Warning: ${type}.</span> ${msg}</div>`;
}

function similarTypes(type1, type2) {
    const audioTypes = ['Audio', 'VideoCall'];
    if (audioTypes.includes(type1) && audioTypes.includes(type2)) {
        return true;
    }
    const videoTypes = ['Capture', 'SRT'];
    if (videoTypes.includes(type1) && videoTypes.includes(type2)) {
        return true;
    }
    return type1 === type2;
}

function compareSlaves() {
    const className = 'border rounded-box p-3 mb-5 w-[750px] max-w-[750px] mx-auto ';
    const compareReport = document.getElementById('compare-report');
    const infoMsg = `
      Please specify the master and slaves. The script will do the following:
       <ul>
         <li>Compare first slave's buss settings with others (<code>mute</code>, <code>sendToMaster</code>).</li>
         <li>Compare first slave's vMix Call settings with others
           (<code>callVideoSource</code>, <code>callAudioSource</code>).</li>
         <li>Compare master input <b>leading numbers</b> with slaves.</li>
         <li>Compare master input <b>types</b> with slaves.</li>
         <li>Compare master input <b>layers</b> with slaves.</li>
         <li>Compare master input <b>duration</b> with slaves.</li>
       </ul>

       The comparison will be done only for inputs with a <b>leading number</b> like <code>05</code>, <code>05_3</code>
       or <code>05_03</code>.`;
    const master = getMaster();
    if (master === null) {
        compareReport.className = className + 'border-info prose';
        compareReport.innerHTML = infoMsg;
        return;
    }

    const slaves = getSlaves();
    slaves.unshift(master);
    const nums = removeDuplicates(slaves);
    if (nums.length === 1) {
        compareReport.className = className + 'border-info prose';
        compareReport.innerHTML = infoMsg;
        return;
    }

    const infos = [];
    for (let i = 0; i < nums.length; i++) {
        const number = nums[i];
        const info = getVmixInfo(number)?.value;
        const name = getBox(number) ? getBoxName(getBox(number)) : '';
        if (info === undefined || info === null) {
            compareReport.className = className + 'border-info';
            compareReport.innerHTML = `Could not fetch status for #${number} ${name}.`;
            return;
        }
        infos.push(info);
    }

    let innerHtml = '';
    let msg = '';
    const warnings = [];
    const errors = [];

    // check buses
    Object.entries(infos[1].audio).forEach(([k, v1]) => {
        for (let j = 2; j < infos.length; j++) {
            const v2 = infos[j].audio[k];
            const num2 = nums[j];
            const name2 = getBoxName(getBox(num2));
            if (v2 === undefined) {
                errors.push(getError('missing bus', `Bus ${k} is disabled for #${num2} ${name2}.`));
                continue;
            }

            if (v1.muted !== v2.muted) {
                msg = `Bus ${k} is ${v2.muted === 'True' ? '' : 'not '}muted for #${num2} ${name2}.`;
                errors.push(getError('bus muted', msg));
            }
            if (v1.sendToMaster !== v2.sendToMaster) {
                msg = `Bus ${k} sendToMaster is ${v2.sendToMaster === 'True' ? '' : 'not '}enabled for #${num2} ${name2}.`;
                errors.push(getError('bus sendToMaster', msg));
            }
        }
    });

    // check vMix call settings
    infos[1].inputs
        .filter((input) => input.type === 'VideoCall')
        .forEach((input1) => {
            for (let j = 2; j < infos.length; j++) {
                const input2 = infos[j].inputs[input1.number];
                const num2 = nums[j];
                const name2 = getBoxName(getBox(num2));
                if (input2.type !== 'VideoCall') {
                    continue;
                }
                if (input1.callVideoSource !== input2.callVideoSource) {
                    msg = `VideoCall input #${input1.number} ${input1.title} video source is
                      "${input2.callVideoSource}" instead of "${input1.callVideoSource}" for #${num2} ${name2}.`;
                    errors.push(getError('vMix call settings', msg));
                }
                if (input1.callAudioSource !== input2.callAudioSource) {
                    msg = `VideoCall input #${input1.number} ${input1.title} audio source is 
                      "${input2.callAudioSource}" instead of "${input1.callAudioSource}" for #${num2} ${name2}.`;
                    errors.push(getError('vMix call settings', msg));
                }
            }
        });

    infos[0].inputs.forEach((input1, i) => {
        const leadNum1 = extractLeadingNumbers(input1.title);
        for (let j = 1; j < infos.length; j++) {
            const input2 = infos[j].inputs[i];
            const num2 = nums[j];
            const name2 = getBoxName(getBox(num2));

            // check missing inputs
            if (input2 === undefined) {
                if (leadNum1 !== '') {
                    msg = `Input #${i} ${input1.title} is missing for #${num2} ${name2}.`;
                    errors.push(getError('missing input', msg));
                }
                continue;
            }

            // check leading numbers (e.g. 05, 05_1)
            const leadNum2 = extractLeadingNumbers(input2.title);
            if (leadNum1 !== leadNum2) {
                msg = `Input #${i} ${input2.title} starts with "${leadNum2}" instead of "${leadNum1}" for #${num2} ${name2}.`;
                errors.push(getError('order mismatch', msg));
            }

            if (leadNum1 === '') {
                continue;
            }

            // Handle vMix bug, it thinks m4a is video
            if (input1.title.endsWith('.m4a') && input1.type === 'Video') input1.type = 'AudioFile';
            if (input2.title.endsWith('.m4a') && input2.type === 'Video') input2.type = 'AudioFile';

            // check input types
            if (!similarTypes(input1.type, input2.type)) {
                msg = `Input #${i} ${input2.title} has type "${input2.type}" instead of "${input1.type}" for #${num2} ${name2}.`;
                warnings.push(getWarning('type mismatch', msg));
            }

            // check layers
            input1.overlays.forEach((over1, k) => {
                const overInput1 = infos[0].inputs[over1.number];
                const overLeadNum = extractLeadingNumbers(overInput1.title);
                const over2 = input2.overlays[k];
                if (overLeadNum === '') {
                    return;
                } else if (over2 === undefined) {
                    msg = `Input #${i} ${input2.title} layer #${over1.index + 1} <${over2.number}>
                        is missing for #${num2} ${name2}.`;
                    errors.push(getError('missing layer', msg));
                } else if (over1.index !== over2.index || over1.number !== over2.number) {
                    msg = `Input #${i} ${input2.title} layer #${over2.index + 1} <${over2.number}> 
                        do not match layer #${over1.index + 1} <${over1.number}>.`;
                    errors.push(getError('layer mismatch', msg));
                }
            });
            if (input1.overlays.length < input2.overlays.length) {
                msg = `Input #${i} ${input2.title} has ${input2.overlays.length} layer(s) instead of
                    ${input1.overlays.length} layer(s) for #${num2} ${name2}.`;
                errors.push(getError('additional layers', msg));
            }

            // check input duration
            const dur1 = parseInt(input1.duration);
            const dur2 = parseInt(input2.duration);
            const durDiff = Math.round(Math.abs(dur1 - dur2) / 1000);
            if (
                ['AudioFile', 'Video'].includes(input1.type) &&
                ['AudioFile', 'Video'].includes(input2.type) &&
                durDiff >= 5
            ) {
                msg = `Input #${i} ${input2.title} duration is ${formatTimeMMSS(dur2)} is
                    ${dur2 > dur1 ? 'more' : 'less'} than ${formatTimeMMSS(dur1)} by ${durDiff}s for #${num2} ${name2}.`;
                warnings.push(getWarning('type mismatch', msg));
            }
        }
    });

    if (errors.length > 0) {
        compareReport.className = className + 'border-error';
        innerHtml += errors.join('');
    } else if (warnings.length > 0) {
        compareReport.className = className + 'border-warning';
    } else {
        compareReport.className = className + 'border-success';
        innerHtml += 'Looks good 👍';
    }
    if (errors.length > 0 && warnings.length > 0) {
        innerHtml += '<div class="divider"></div>';
    }
    innerHtml += warnings.join('');
    compareReport.innerHTML = innerHtml;
}

function hideCompareReport() {
    const compareReport = document.getElementById('compare-report');
    compareReport.className = 'hidden';
}
