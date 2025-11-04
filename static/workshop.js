// =========================================================
//               توابع عمومی برای گزارش‌ها
// =========================================================

function printReport(direction) {
    const url = `/reports/ready-for-delivery/detailed-html?direction=${direction}`;
    const reportWindow = window.open(url, '_blank');
    if (reportWindow) reportWindow.focus();
}

function printSimpleSupervisorReport() {
    const url = '/reports/supervisor-approval/simple/html';
    const reportWindow = window.open(url, '_blank');
    if (reportWindow) reportWindow.focus();
}

function printChecklistSupervisorReport() {
    const url = '/reports/supervisor-approval/checklist/html';
    const reportWindow = window.open(url, '_blank');
    if (reportWindow) reportWindow.focus();
}

// =========================================================
//               منطق اصلی صفحه کارگاه (نسخه نهایی)
// =========================================================

document.addEventListener('DOMContentLoaded', () => {
    // State
    let allProjectsCache = [];

    // DOM Elements Cache
    const DOM = {};
    const elementIds = [
        'workshopProjectsList', 'searchInput', 'statusFilter', 'sortSelect', 'applyFilterBtn',
        'clearFilterBtn', 'loadingPlaceholder', 'noResultsMessage', 'toastContainer',
        'barcodeInput', 'barcodeStatusMessage', 
        'exited-date-picker', 'getExitedExcelBtn', 'printExitedBtn'
    ];
    elementIds.forEach(id => { DOM[id] = document.getElementById(id); });

    if (!DOM.workshopProjectsList || !DOM.loadingPlaceholder) {
        document.body.innerHTML = "<h1>خطای بحرانی: ساختار HTML صفحه ناقص است.</h1>";
        console.error("Critical DOM elements are missing.");
        return;
    }

    // Constants
    const STEP_DEFINITIONS = { 
        "START_ASSEMBLY": "شروع مونتاژ", "END_ASSEMBLY": "پایان مونتاژ", 
        "TEAM_LEAD_APPROVAL": "تأیید سرگروه مونتاژ", "TEST": "تست سماک", 
        "QUALITY_CONTROL": "کنترل کیفیت", "SUPERVISOR_APPROVAL": "تأیید ناظر", 
        "EXIT_PANEL": "خروج تابلو" 
    };
    const ORDERED_STEP_KEYS = Object.keys(STEP_DEFINITIONS);
    const STATUS_DEFINITIONS = { 'not-started': { text: 'شروع نشده', color: 'slate', icon: 'fa-hourglass-start' }, 'in-progress': { text: 'در حال انجام', color: 'amber', icon: 'fa-cogs' }, 'completed': { text: 'خارج شده', color: 'green', icon: 'fa-check-circle' } };
	// این دیکشنری را در فایل workshop.js به طور کامل جایگزین کنید


	const PANEL_TYPE_DEFINITIONS = {
		"FAHAM_WITH_FRAME": "فهام با قاب",
		"FAHAM_WITHOUT_FRAME": "فهام بدون قاب",
		"ID2R": "ID2R - تابلو کامپوزیتی 1-2 کنتور تکفاز ریلی",
		"ID5R": "ID5R - تابلو کامپوزیتی 3-5 کنتور تکفاز ریلی",
		"ID116": "ID116 - تابلو 2 کنتوره تکفاز ریلی روی دیوار",
		"ID6_1R": "ID6+1R - تابلو 6 کنتور فلزی دیواری",
		"ID12_1R": "ID12+1R - تابلو 12 کنتور فلزی دیواری",
		"ID18_1R": "ID18+1R - تابلو 18 کنتور فلزی دیواری",
		"ID24_1R": "ID24+1R - تابلو 24 کنتور فلزی دیواری",
		"ID101": "ID101 - تابلو تک کنتور (هوایی) - فیوز در محل",
		"ID102": "ID102 - تابلو تک کنتور (هوایی) - فیوز دار روی پایه",
		"ID104": "ID104 - تابلو تک کنتور (زمینی) - فیوز روی پایه",
		"ID105": "ID105 - تابلو کامپوزیتی زمینی تک کنتوره یکطرفه",
		"ID107": "ID107 - تابلو کامپوزیتی دیواری تک کنتوره سه فاز با فیوز",
		"ID115": "ID115 - تابلو تک کنتور دیواری - فیوز در محل",
		"ID108": "ID108 - تابلو زمینی چند کنتوره یکطرفه",
		"ID109": "ID109 - تابلو زمینی چند کنتوره دوطرفه",
		"ID110": "ID110 - تابلو 2 کنتوره تکفاز (هوایی) - فیوز در محل",
		"ID111": "ID111 - تابلو 2 کنتوره تکفاز (زمینی) - فیوز روی پایه",
		"ID112_STAR": "ID112* - تابلو چند کنتوره تک فاز روی پایه (کلی)",
		"ID120": "ID120 - تابلو 2 کنتوره سه فاز (هوایی) - فیوز در محل",
		"ID121": "ID121 - تابلو 2 کنتوره سه فاز (زمینی) - فیوز روی پایه",
		"ID122": "ID122 - 2x تابلو 2 کنتوره سه فاز - جعبه 8 فیوز",
		"ID123": "ID123 - 2x تابلو 2 کنتوره سه فاز - جعبه 16 فیوز",
		"ID124_STAR": "ID124* - تابلو چند کنتوره سه فاز روی پایه (کلی)",
		"ID211": "ID211 - تابلو دیماندی هوایی 30-150 kW",
		"ID212": "ID212 - تابلو دیماندی هوایی 151-249 kW",
		"ID213": "ID213 - تابلو دیماندی زمینی یکطرفه",
		"ID214": "ID214 - تابلو دیماندی زمینی دوطرفه",
		"ID215": "ID215 - تابلو دیماندی فلزی زمینی",
		"ID216": "ID216 - تابلو دو دیماندی هوایی",
		"ID218": "ID218 - تابلو چند دیماندی زمینی دوطرفه"
	};
    function showToast(message, isError = false) { 
        if (!DOM.toastContainer) return; 
        const toastId = 'toast-' + Date.now(); 
        const bgColor = isError ? 'bg-red-600' : 'bg-slate-800'; 
        const icon = isError ? `<i class="fas fa-exclamation-circle ml-2"></i>` : `<i class="fas fa-info-circle ml-2"></i>`; 
        const toastHtml = `<div id="${toastId}" class="max-w-xs ${bgColor} text-white text-sm rounded-lg shadow-lg p-3 flex items-center" role="alert">${icon}<span>${message}</span></div>`; 
        DOM.toastContainer.insertAdjacentHTML('beforeend', toastHtml); 
        setTimeout(() => { 
            const el = document.getElementById(toastId); 
            if (el) el.remove(); 
        }, 5000); 
    }
    
    function processProjectData(project) {
        const completedStepKeys = new Set(
            (project.steps && Array.isArray(project.steps)) ? project.steps.map(s => s.name_key) : []
        );

        let status = 'not-started';
        if (completedStepKeys.has("EXIT_PANEL")) { 
            status = 'completed'; 
        } else if (completedStepKeys.size > 0) { 
            status = 'in-progress'; 
        }
        
        const completedCount = ORDERED_STEP_KEYS.filter(key => completedStepKeys.has(key)).length;
        const progress = ORDERED_STEP_KEYS.length > 0 ? Math.round((completedCount / ORDERED_STEP_KEYS.length) * 100) : 0;
        
        const lastStepTimestamp = (project.steps && project.steps.length > 0) 
            ? new Date(Math.max(...project.steps.map(s => new Date(s.timestamp)))) 
            : new Date(project.created_at);

        const startStep = (project.steps || []).find(s => s.name_key === "START_ASSEMBLY");
        const startDate = startStep ? new Date(startStep.timestamp) : new Date(project.created_at);
        
        return { 
            ...project, 
            status, 
            progress, 
            last_updated_at: lastStepTimestamp, 
            start_date: startDate, 
            completedStepKeys: Array.from(completedStepKeys)
        };
    }
    
    async function fetchProjects() {
        DOM.loadingPlaceholder.style.display = 'block';
        DOM.workshopProjectsList.innerHTML = '';
        DOM.noResultsMessage.style.display = 'none';
        try {
            const response = await fetch('/projects/');
            if (!response.ok) throw new Error(`خطای سرور: ${response.status}`);
            const rawProjects = await response.json();
            allProjectsCache = rawProjects.map(processProjectData);
            applyFiltersAndRender();
        } catch (error) {
            showToast(`خطا در دریافت پروژه‌ها: ${error.message}`, true);
            DOM.loadingPlaceholder.innerHTML = `<i class="fas fa-exclamation-triangle text-red-500 mr-2"></i> خطا در بارگذاری داده‌ها.`;
        } finally {
            DOM.loadingPlaceholder.style.display = 'none';
        }
    }

    async function updateSingleProject(projectId) { 
        try { 
            const res = await fetch(`/projects/${projectId}`); 
            if (!res.ok) { 
                const cardToRemove = document.getElementById(`project-card-${projectId}`); 
                if (cardToRemove) cardToRemove.remove(); 
                return; 
            } 
            const newProjectData = processProjectData(await res.json()); 
            const index = allProjectsCache.findIndex(p => p.id === projectId); 
            if (index !== -1) { 
                allProjectsCache[index] = newProjectData; 
            } else { 
                allProjectsCache.unshift(newProjectData); 
            } 
            const oldCard = document.getElementById(`project-card-${projectId}`); 
            if (oldCard) { 
                const newCardHtml = createProjectCardHtml(newProjectData); 
                const tempDiv = document.createElement('div'); 
                tempDiv.innerHTML = newCardHtml; 
                const newCardNode = tempDiv.firstElementChild; 
                const oldDetails = oldCard.querySelector('details'); 
                const activeTabBtn = oldDetails?.querySelector('.tab-button.active'); 
                if (oldDetails?.open) newCardNode.querySelector('details').open = true; 
                if(activeTabBtn) { 
                    const targetId = activeTabBtn.dataset.tabTarget; 
                    newCardNode.querySelectorAll('.tab-button').forEach(btn => btn.classList.toggle('active', btn.dataset.tabTarget === targetId)); 
                    newCardNode.querySelectorAll('.tab-content').forEach(content => content.classList.toggle('active', content.id === targetId)); 
                } 
                oldCard.replaceWith(newCardNode); 
                addCardEventListeners(newCardNode); 
                const updatedDetails = document.getElementById(`project-card-${projectId}`).querySelector('details'); 
                updatedDetails.classList.add('updating'); 
                setTimeout(() => updatedDetails.classList.remove('updating'), 1500); 
            } else { 
                applyFiltersAndRender(); 
            } 
        } catch (error) { 
            console.error(`Failed to update project ${projectId}:`, error); 
        } 
    }
    
    function applyFiltersAndRender() { 
        const searchTerm = DOM.searchInput.value.toLowerCase().trim(); 
        const status = DOM.statusFilter.value; 
        const sortBy = DOM.sortSelect.value; 
        let filteredProjects = allProjectsCache.filter(p => 
            (!searchTerm || (p.name?.toLowerCase().includes(searchTerm) || p.request_id?.toLowerCase().includes(searchTerm) || p.customer_name?.toLowerCase().includes(searchTerm) || p.panel_code?.toLowerCase().includes(searchTerm))) 
            && (status === 'all' || p.status === status) 
        ); 
        filteredProjects.sort((a, b) => { 
            switch (sortBy) { 
                case 'progress-desc': return b.progress - a.progress; 
                case 'progress-asc': return a.progress - b.progress; 
                case 'start-date': return new Date(b.start_date) - new Date(a.start_date); 
                case 'last-change': 
                default: return new Date(b.last_updated_at) - new Date(a.last_updated_at); 
            } 
        }); 
        renderProjectCards(filteredProjects); 
    }
    
    function _getStepsHtml(p) {
        let stepsHtml = '<ul class="space-y-3 mt-2">';
        let prevStepDone = true;
        const canStartSteps = p.panel_type_key && p.assembler_1;

        ORDERED_STEP_KEYS.forEach(key => {
            const name = STEP_DEFINITIONS[key];
            const isDone = p.completedStepKeys.includes(key);
            const isExitStep = key === 'EXIT_PANEL';
            const canInteract = prevStepDone && !isDone && canStartSteps && !isExitStep;
            
            let checkboxAttrs = `data-project-id="${p.id}" data-step-key="${key}" class="ml-3 h-5 w-5 rounded focus:ring-indigo-500 text-indigo-600"`;
            if (isDone || !canInteract || isExitStep) checkboxAttrs += ' disabled';
            if (isDone) checkboxAttrs += ' checked';
            
            stepsHtml += `
                <li class="flex items-center justify-between">
                    <label class="flex items-center flex-grow ${!canInteract && !isDone ? 'cursor-not-allowed text-slate-400' : 'cursor-pointer'}">
                        <input type="checkbox" ${checkboxAttrs}>
                        <span>${name}</span>
                    </label>
                    ${isDone && !isExitStep ? `<button class="cancel-step-btn text-red-500 hover:text-red-700 text-sm" data-project-id="${p.id}" data-step-key="${key}"><i class="fas fa-times-circle"></i> لغو</button>` : ''}
                </li>
                <li class="pl-8"><span class="step-error-message text-red-500 text-xs" data-project-id="${p.id}" data-step-key="${key}"></span></li>
            `;
            if (!isDone) prevStepDone = false;
        });
        stepsHtml += '</ul>';
        return stepsHtml;
    }

    function _getAssemblyDetailsHtml(p) { const isAssemblyEditable = (p.steps || []).length === 0; if (isAssemblyEditable) { const optionsHtml = Object.entries(PANEL_TYPE_DEFINITIONS).map(([key, name]) => `<option value="${key}" ${p.panel_type_key === key ? 'selected' : ''}>${name}</option>`).join(''); return `<div class="space-y-3 text-sm"><div><label class="block font-medium text-slate-700">نوع تابلو</label><select data-project-id="${p.id}" class="panel-type-select mt-1 block w-full p-2 border border-slate-300 rounded-md"><option value="">انتخاب کنید...</option>${optionsHtml}</select></div><div class="grid grid-cols-1 sm:grid-cols-2 gap-3"><div><label class="block font-medium text-slate-700">مونتاژکار ۱</label><input type="text" data-project-id="${p.id}" class="assembler1-input mt-1 block w-full p-2 border rounded-md" value="${p.assembler_1 || ''}"></div><div><label class="block font-medium text-slate-700">مونتاژکار ۲</label><input type="text" data-project-id="${p.id}" class="assembler2-input mt-1 block w-full p-2 border rounded-md" value="${p.assembler_2 || ''}"></div></div><button class="save-assembly-btn w-full bg-indigo-600 text-white px-4 py-2 rounded-md mt-2" data-project-id="${p.id}">ذخیره اطلاعات مونتاژ</button><div class="assembly-error-message text-red-500 text-xs text-center mt-1" data-project-id="${p.id}"></div></div>`; } else { return `<div class="space-y-3 text-sm"><div><label class="block font-medium text-slate-700">نوع تابلو</label><p class="mt-1 text-slate-800 bg-slate-100 p-2 rounded-md">${p.panel_type_name || 'تعیین نشده'}</p></div><div class="grid grid-cols-1 sm:grid-cols-2 gap-3"><div><label class="block font-medium text-slate-700">مونتاژکار ۱</label><p class="mt-1 text-slate-800 bg-slate-100 p-2 rounded-md">${p.assembler_1 || '-'}</p></div><div><label class="block font-medium text-slate-700">مونتاژکار ۲</label><p class="mt-1 text-slate-800 bg-slate-100 p-2 rounded-md">${p.assembler_2 || '-'}</p></div></div></div>`; } }
    function _getCommentsHtml(p) { const commentsList = (p.comments && p.comments.length > 0) ? p.comments.map(c => `<div class="bg-slate-100 p-3 rounded-lg mb-2"><div class="flex justify-between items-center text-xs text-slate-500 mb-1"><strong>${c.author}</strong><span>${new Date(c.timestamp).toLocaleString('fa-IR')}</span></div><p class="text-sm text-slate-800">${c.text}</p></div>`).join('') : '<p class="text-sm text-slate-400 text-center p-4">یادداشتی ثبت نشده است.</p>'; return `<div class="max-h-48 overflow-y-auto pr-2">${commentsList}</div><div class="mt-4 pt-4 border-t border-slate-200"><textarea id="comment-input-${p.id}" class="w-full p-2 border border-slate-300 rounded-md text-sm" rows="2" placeholder="یادداشت جدید..."></textarea><button class="post-comment-btn w-full mt-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm" data-project-id="${p.id}">ثبت یادداشت</button></div>`; }
    function createProjectCardHtml(p) { const statusInfo = STATUS_DEFINITIONS[p.status] || { text: 'نامشخص', color: 'gray' }; const assemblyDetailsHtml = _getAssemblyDetailsHtml(p); const stepsHtml = _getStepsHtml(p); const commentsHtml = _getCommentsHtml(p); const completedStepKeys = p.completedStepKeys; const hasSupervisorApproval = completedStepKeys.includes("SUPERVISOR_APPROVAL"); const isExited = completedStepKeys.includes("EXIT_PANEL"); let actionButtonsHtml = ''; if (hasSupervisorApproval || isExited) { actionButtonsHtml += `<button onclick="window.open('/projects/${p.id}/exit-slip', '_blank')" class="bg-purple-600 hover:bg-purple-700 text-white text-xs px-3 py-1.5 rounded-md flex items-center gap-1.5 shadow-sm transition-transform transform hover:scale-105" title="چاپ برگه خروج انفرادی"><i class="fas fa-receipt"></i><span>برگه خروج</span></button>`; } actionButtonsHtml += `<button onclick="window.open('/projects/${p.id}/qc-checklist', '_blank')" class="bg-teal-600 hover:bg-teal-700 text-white text-xs px-3 py-1.5 rounded-md flex items-center gap-1.5 shadow-sm transition-transform transform hover:scale-105" title="چاپ چک‌لیست کنترل کیفیت"><i class="fas fa-tasks"></i><span>چک‌لیست QC</span></button>`; actionButtonsHtml += `<a href="/projects/${p.id}/label" target="_blank" class="bg-gray-600 hover:bg-gray-700 text-white text-xs px-3 py-1.5 rounded-md flex items-center gap-1.5 shadow-sm transition-transform transform hover:scale-105" title="چاپ برچسب پروژه"><i class="fas fa-print"></i><span>برچسب</span></a>`; return `<div class="project-card" id="project-card-${p.id}"><details class="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden"><summary class="p-4 flex items-center gap-4 cursor-pointer"><div class="flex-grow"><h4 class="font-bold text-slate-800 text-lg">${p.name}</h4><p class="text-xs text-slate-500">${p.customer_name || '-'} | ش. درخواست: ${p.request_id || '-'}</p></div><div class="flex flex-col items-end gap-2 flex-shrink-0"><span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-${statusInfo.color}-100 text-${statusInfo.color}-800 flex items-center gap-1.5"><i class="fas ${statusInfo.icon}"></i> ${statusInfo.text}</span>${p.panel_code ? `<span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">${p.panel_code}</span>` : ''}</div><div class="accordion-arrow text-slate-500"><i class="fas fa-chevron-down"></i></div></summary><div class="px-4 pb-2"><div class="flex justify-between mb-1 text-xs font-medium text-slate-600"><span>پیشرفت</span><span>${p.progress}%</span></div><div class="w-full bg-slate-200 rounded-full h-2 progress-bar"><div class="bg-blue-600 h-2 rounded-full" style="width: ${p.progress}%"></div></div></div><div class="border-t border-slate-200"><div class="p-4"><div class="flex border-b border-slate-200 mb-4 text-sm -mx-4 px-4"><button class="tab-button active" data-tab-target="assembly-${p.id}">جزئیات مونتاژ</button><button class="tab-button" data-tab-target="steps-${p.id}">مراحل</button><button class="tab-button" data-tab-target="comments-${p.id}">یادداشت‌ها</button></div><div id="assembly-${p.id}" class="tab-content active">${assemblyDetailsHtml}</div><div id="steps-${p.id}" class="tab-content">${stepsHtml}</div><div id="comments-${p.id}" class="tab-content">${commentsHtml}</div></div><div class="flex items-center justify-end gap-2 p-3 bg-slate-50 border-t border-slate-200">${actionButtonsHtml}</div></div></details></div>`; }
    function renderProjectCards(projects) { DOM.workshopProjectsList.innerHTML = projects.map(createProjectCardHtml).join(''); addCardEventListeners(DOM.workshopProjectsList); DOM.noResultsMessage.style.display = projects.length === 0 ? 'block' : 'none'; }
    function addCardEventListeners(scopeElement) { scopeElement.querySelectorAll('.tab-button').forEach(button => { button.addEventListener('click', (e) => { e.preventDefault(); const targetId = button.dataset.tabTarget; const card = button.closest('.project-card'); card.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active')); button.classList.add('active'); card.querySelectorAll('.tab-content').forEach(content => content.classList.toggle('active', content.id === targetId)); }); }); scopeElement.querySelectorAll('.save-assembly-btn').forEach(btn => btn.addEventListener('click', handleSaveAssemblyDetails)); scopeElement.querySelectorAll('input[type=checkbox]:not(:disabled)').forEach(chk => chk.addEventListener('change', handleStepAction)); scopeElement.querySelectorAll('.cancel-step-btn').forEach(btn => btn.addEventListener('click', handleStepAction)); scopeElement.querySelectorAll('.post-comment-btn').forEach(btn => btn.addEventListener('click', handlePostComment)); }
    async function handleSaveAssemblyDetails(event) { const btn = event.target; const pId = btn.dataset.projectId; const card = btn.closest('.project-card'); const panelTypeEl = card.querySelector('.panel-type-select'); const assembler1El = card.querySelector('.assembler1-input'); const assembler2El = card.querySelector('.assembler2-input'); const errSpan = card.querySelector('.assembly-error-message'); const payload = { panel_type_key: panelTypeEl.value, assembler_1: assembler1El.value.trim(), assembler_2: assembler2El.value.trim() || null }; if (!payload.panel_type_key || !payload.assembler_1) { if (errSpan) errSpan.textContent = "نوع تابلو و مونتاژکار ۱ الزامی هستند."; return; } if (errSpan) errSpan.textContent = ""; btn.disabled = true; try { const res = await fetch(`/projects/${pId}/assembly-details/`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); if (!res.ok) { const errData = await res.json(); throw new Error(errData.detail || "خطای ناشناخته"); } showToast('اطلاعات مونتاژ با موفقیت ذخیره شد.'); } catch (error) { if (errSpan) errSpan.textContent = error.message; showToast(`خطا: ${error.message}`, true); } finally { btn.disabled = false; updateSingleProject(pId); } }
    
    async function handleStepAction(event) {
        const el = event.target.closest('input[type=checkbox], .cancel-step-btn');
        if (!el) return;

        const pId = el.dataset.projectId;
        const stepKey = el.dataset.stepKey;
        if (!pId || !stepKey) return showToast("خطای داخلی: شناسه نامعتبر", true);

        const isCancel = el.classList.contains('cancel-step-btn');
        const stepNameForAPI = STEP_DEFINITIONS[stepKey];

        const errSpan = el.closest('li').nextElementSibling.querySelector('.step-error-message');
        if (errSpan) errSpan.textContent = '';
        if (isCancel && !confirm(`آیا از لغو مرحله "${stepNameForAPI}" مطمئن هستید؟`)) return;
        
        el.disabled = true;

        try {
            let response;
            if (isCancel) {
                response = await fetch(`/projects/${pId}/steps/${encodeURIComponent(stepNameForAPI)}`, { method: 'DELETE' });
            } else {
                response = await fetch(`/projects/${pId}/steps`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ step: stepKey })
                });
            }

            if (!response.ok && response.status !== 204) {
                const errData = await response.json().catch(() => ({ detail: `خطای سرور: ${response.status}` }));
                throw new Error(errData.detail || `خطای ناشناخته (${response.status})`);
            }
            showToast(`مرحله "${stepNameForAPI}" با موفقیت ${isCancel ? 'لغو شد' : 'ثبت شد'}.`);
            updateSingleProject(pId);

        } catch (error) {
            if (errSpan) errSpan.textContent = error.message;
            showToast(`خطا: ${error.message}`, true);
            if (!isCancel && 'checked' in el) el.checked = false;
        } finally {
            el.disabled = false;
        }
    }

    async function handlePostComment(event) { const btn = event.target; const pId = btn.dataset.projectId; const textarea = document.getElementById(`comment-input-${pId}`); const commentText = textarea.value.trim(); if (!commentText) return; btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'; try { await fetch(`/projects/${pId}/comments`, {method: 'POST', headers: { 'Content-Type': 'application/json' },body: JSON.stringify({ text: commentText })}); showToast("یادداشت با موفقیت ثبت شد."); textarea.value = ''; updateSingleProject(pId); } catch (error) { showToast(error.message, true); } finally { btn.disabled = false; btn.innerText = 'ثبت یادداشت'; } }
    function setupBarcodeScannerListener() { if (!DOM.barcodeInput) return; let barcodeBuffer = ''; let lastKeystrokeTime = 0; const SCAN_TIMEOUT = 100; DOM.barcodeInput.addEventListener('input', () => { const currentTime = Date.now(); if (currentTime - lastKeystrokeTime > SCAN_TIMEOUT) barcodeBuffer = ''; barcodeBuffer = DOM.barcodeInput.value; lastKeystrokeTime = currentTime; setTimeout(() => { if (Date.now() - lastKeystrokeTime >= SCAN_TIMEOUT && barcodeBuffer.length > 3) { handleBarcodeAction(barcodeBuffer); } }, SCAN_TIMEOUT); }); DOM.barcodeInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); if (DOM.barcodeInput.value.length > 3) handleBarcodeAction(DOM.barcodeInput.value); } }); }
    async function handleBarcodeAction(barcodeId) { const cleanBarcodeId = barcodeId.trim(); if (!cleanBarcodeId) return; DOM.barcodeInput.value = ''; DOM.barcodeStatusMessage.textContent = 'در حال پردازش...'; DOM.barcodeStatusMessage.className = 'mt-2 text-sm text-center font-medium text-blue-600'; const project = allProjectsCache.find(p => p.request_id === cleanBarcodeId); const isExited = project && project.status === 'completed'; try { if (isExited) { if (confirm(`پروژه '${cleanBarcodeId}' قبلا خارج شده. آیا می‌خواهید آن را به کارگاه برگردانید؟`)) { const stepName = STEP_DEFINITIONS.EXIT_PANEL; const res = await fetch(`/projects/${project.id}/steps/${encodeURIComponent(stepName)}`, { method: 'DELETE' }); if (!res.ok && res.status !== 204) throw new Error((await res.json()).detail || 'خطا در برگشت پروژه'); DOM.barcodeStatusMessage.textContent = `پروژه '${cleanBarcodeId}' با موفقیت برگشت خورد.`; DOM.barcodeStatusMessage.className = 'mt-2 text-sm text-center font-medium text-green-600'; } else { DOM.barcodeStatusMessage.textContent = 'عملیات لغو شد.'; DOM.barcodeStatusMessage.className = 'mt-2 text-sm text-center font-medium text-slate-600'; } } else { const res = await fetch('/projects/exit-by-barcode/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ barcode_data: cleanBarcodeId }) }); if (!res.ok) throw new Error((await res.json()).detail || 'خطا در ثبت خروج'); DOM.barcodeStatusMessage.textContent = `خروج برای '${cleanBarcodeId}' با موفقیت ثبت شد.`; DOM.barcodeStatusMessage.className = 'mt-2 text-sm text-center font-medium text-green-600'; } } catch (error) { DOM.barcodeStatusMessage.textContent = `خطا: ${error.message}`; DOM.barcodeStatusMessage.className = 'mt-2 text-sm text-center font-medium text-red-600'; showToast(error.message, true); } }
    function connectWebSocket() { const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"; const ws = new WebSocket(`${protocol}//${window.location.host}/ws`); ws.onmessage = (event) => { try { const msg = JSON.parse(event.data); if (msg.type === 'update') { if (msg.project_id) { updateSingleProject(msg.project_id); } else { fetchProjects(); } } else if (msg.type === 'error') { showToast(msg.message, true); } } catch (e) { console.error('Error parsing WebSocket message:', e); } }; ws.onclose = () => setTimeout(connectWebSocket, 5000); }
    
    // --- Event Listeners for Filters ---
    if (DOM.applyFilterBtn) { DOM.applyFilterBtn.addEventListener('click', applyFiltersAndRender); }
    if (DOM.clearFilterBtn) { DOM.clearFilterBtn.addEventListener('click', () => { DOM.searchInput.value = ''; DOM.statusFilter.selectedIndex = 0; DOM.sortSelect.selectedIndex = 0; applyFiltersAndRender(); }); }
    [DOM.searchInput, DOM.statusFilter, DOM.sortSelect].forEach(element => { if (element) { element.addEventListener('keydown', (event) => { if (event.key === 'Enter') { event.preventDefault(); DOM.applyFilterBtn.click(); } }); } });
    
    // --- Event Listeners for Exited Panels Report ---
    if (DOM['exited-date-picker'] && DOM.getExitedExcelBtn && DOM.printExitedBtn) {
        let datepickerInstance;
        function initializeDatePicker() {
            if (typeof $ === 'undefined' || !$.fn.pDatepicker) return;
            const datePickerElement = $(DOM['exited-date-picker']);
            datePickerElement.pDatepicker({
                initialValue: true, format: 'YYYY/MM/DD',
                onSelect: () => enableReportButtons(true),
            });
            datepickerInstance = datePickerElement.data('datepicker');
            enableReportButtons(true);
        }
        function enableReportButtons(isEnabled) {
            const hasDate = isEnabled && datepickerInstance && datepickerInstance.getState().selected.unixDate;
            DOM.getExitedExcelBtn.disabled = !hasDate;
            DOM.printExitedBtn.disabled = !hasDate; 
            DOM.getExitedExcelBtn.className = hasDate ? "w-full text-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm rounded-md" : "w-full text-center bg-gray-400 text-white px-4 py-2 text-sm rounded-md cursor-not-allowed";
            DOM.printExitedBtn.className = hasDate ? "w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm rounded-md" : "w-full bg-gray-400 text-white px-4 py-2 text-sm rounded-md cursor-not-allowed";
        }
        function handleExitedReport(isExcel) {
            if (!datepickerInstance) return showToast('DatePicker به درستی بارگذاری نشده است.', true);
            const selectedUnix = datepickerInstance.getState().selected.unixDate;
            if (!selectedUnix) return showToast('لطفاً یک تاریخ معتبر انتخاب کنید.', true);
            const reportDate = new Date(selectedUnix).toISOString().split('T')[0];
            const url = isExcel ? `/reports/exited-projects/excel?report_date=${reportDate}` : `/reports/exited-panels/simple-html?report_date=${reportDate}`;
            window.open(url, '_blank');
        }
        initializeDatePicker();
        DOM.getExitedExcelBtn.addEventListener('click', () => handleExitedReport(true));
        DOM.printExitedBtn.addEventListener('click', () => handleExitedReport(false));
    }    
    
    // Initial calls
    fetchProjects();
    connectWebSocket();
    setupBarcodeScannerListener();
});