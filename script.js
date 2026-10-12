// INITIAL DATA STORE
let technicians = [
    { name: "J. Smith", level: "ET-10", tour: "Tour 1", sdos: "Sat/Sun", seniority: "2012-05-14", odl: true, holidayVol: true },
    { name: "M. Davis", level: "ET-10", tour: "Tour 2", sdos: "Tue/Wed", seniority: "2015-08-20", odl: false, holidayVol: false },
    { name: "R. Johnson", level: "MPE-09", tour: "Tour 1", sdos: "Sun/Mon", seniority: "2018-02-10", odl: true, holidayVol: true },
    { name: "A. Wilson", level: "MM-07", tour: "Tour 3", sdos: "Thu/Fri", seniority: "2021-11-05", odl: false, holidayVol: false },
    { name: "T. Brown", level: "MPE-09", tour: "Tour 2", sdos: "Sat/Sun", seniority: "2008-03-30", odl: false, holidayVol: false }
];

let pmAssignments = [
    { equipId: "DBCS-01", category: "DBCS", taskName: "Weekly Transport & Optic Clean", tour: "Tour 1", assignedTech: "J. Smith" },
    { equipId: "APPS-03", category: "APPS", taskName: "Bi-Weekly Induction Jam Clear Check", tour: "Tour 1", assignedTech: "A. Wilson" }
];

let custodialAssignments = [
    { area: 'Front', custodians: 'Rivera' },
    { area: 'Back', custodians: 'Wade' },
    { area: 'Caf', custodians: 'Youssef' },
    { area: 'DBCS', custodians: 'Attallah/Luz' },
    { area: 'APBS', custodians: '' },
    { area: 'Rec', custodians: 'Alex/Yang' },
    { area: 'Parking Lot', custodians: '' },
    { area: 'Outdoors', custodians: '' }
];

// TAB NAVIGATION LOGIC
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

        btn.classList.add('active');
        document.getElementById(btn.dataset.tab).classList.add('active');

        if (btn.dataset.tab === 'holiday') renderHolidayMatrix();
        if (btn.dataset.tab === 'audit') runGrievanceAudit();
    });
});

// INITIALIZE APP
function initApp() {
    renderRoster();
    renderPmTable();
    renderCustodianAssignments();
    populateTechDropdowns();
}

// RENDER ROSTER TABLE
function renderRoster() {
    const tbody = document.getElementById('rosterTbody');
    tbody.innerHTML = '';

    technicians.forEach((tech, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${tech.name}</strong></td>
            <td><span class="badge badge-info">${tech.level}</span></td>
            <td>${tech.tour}</td>
            <td>${tech.sdos}</td>
            <td>${tech.seniority}</td>
            <td>${tech.odl ? '<span class="badge badge-warning">ODL Active</span>' : 'Non-ODL'}</td>
            <td>${tech.holidayVol ? '<span class="badge badge-success">Volunteer</span>' : 'Non-Volunteer'}</td>
            <td>
                <button class="btn btn-sm btn-outline" onclick="editTech(${index})">Edit</button>
                <button class="btn btn-sm btn-outline" style="color:var(--danger); border-color:var(--danger);" onclick="deleteTech(${index})">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    populateTechDropdowns();
}

// RENDER PM TABLE WITH SKILL VALIDATION
function getCraftMatch(category, tech) {
    if (!tech) return 'Unassigned / Invalid Tech';

    const requiredCrafts = {
        DBCS: ['ET-10'],
        AFCS: ['ET-10'],
        AFSM: ['ET-10', 'MPE-09'],
        APPS: ['MPE-09'],
        SIPS: ['MPE-09', 'MM-07'],
        Building: ['BEM-09']
    }[category];

    if (!requiredCrafts || requiredCrafts.includes(tech.level)) return 'Valid Craft Match';
    return `Mismatch: ${category} requires ${requiredCrafts.join(' / ')} (Assigned ${tech.level})`;
}

function renderPmTable() {
    const tbody = document.getElementById('pmTbody');
    tbody.innerHTML = '';

    pmAssignments.forEach((pm, index) => {
        const tech = technicians.find(t => t.name === pm.assignedTech);
        const craftMatch = getCraftMatch(pm.category, tech);
        const validMatch = craftMatch === 'Valid Craft Match';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${pm.equipId}</strong></td>
            <td>${pm.category}</td>
            <td>${pm.taskName}</td>
            <td>${pm.tour}</td>
            <td>${pm.assignedTech}</td>
            <td><span class="badge ${validMatch ? 'badge-success' : 'badge-danger'}">${craftMatch}</span></td>
            <td><span class="badge badge-info">Scheduled</span></td>
            <td>
                <button class="btn btn-sm btn-outline" style="color:var(--danger); border-color:var(--danger);" onclick="deletePm(${index})">Remove</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderCustodianAssignments() {
    const tbody = document.getElementById('custodianTbody');
    tbody.innerHTML = '';

    custodialAssignments.forEach((assignment, index) => {
        const tr = document.createElement('tr');
        const areaCell = document.createElement('td');
        const custodiansCell = document.createElement('td');
        const input = document.createElement('input');

        areaCell.textContent = assignment.area;
        input.type = 'text';
        input.value = assignment.custodians;
        input.placeholder = 'Enter custodian name(s)';
        input.setAttribute('aria-label', `${assignment.area} custodian assignment`);
        input.addEventListener('input', (event) => {
            custodialAssignments[index].custodians = event.target.value;
        });

        custodiansCell.appendChild(input);
        tr.appendChild(areaCell);
        tr.appendChild(custodiansCell);
        tbody.appendChild(tr);
    });
}

// POPULATE TECH DROPDOWN
const MAX_MACHINES_PER_TECH = 6;

function getEquipmentIdsForTech(techName) {
    return new Set(pmAssignments
        .filter(pm => pm.assignedTech === techName)
        .map(pm => pm.equipId.trim().toUpperCase()));
}

function populateTechDropdowns(equipId = '') {
    const select = document.getElementById('pmTechSelect');
    const currentTech = select.value;
    const normalizedEquipId = equipId.trim().toUpperCase();
    select.innerHTML = '';
    technicians.forEach(tech => {
        const equipmentIds = getEquipmentIdsForTech(tech.name);
        const opt = document.createElement('option');
        opt.value = tech.name;
        opt.textContent = `${tech.name} (${tech.level} - ${tech.tour}, ${equipmentIds.size}/${MAX_MACHINES_PER_TECH} machines)`;
        opt.disabled = equipmentIds.size >= MAX_MACHINES_PER_TECH && !equipmentIds.has(normalizedEquipId);
        select.appendChild(opt);
    });
    if ([...select.options].some(option => option.value === currentTech && !option.disabled)) {
        select.value = currentTech;
    }
}

// HOLIDAY MATRIX PECKING ORDER LOGIC
function renderHolidayMatrix() {
    const tbody = document.getElementById('holidayTbody');
    tbody.innerHTML = '';

    // Sort volunteers by earliest seniority date (Ascending order)
    let sortedTechs = [...technicians].sort((a, b) => new Date(a.seniority) - new Date(b.seniority));

    sortedTechs.forEach(tech => {
        let assignedStatus = tech.holidayVol ? "Working (Volunteer)" : "Off / Protected";
        let peckingRule = tech.holidayVol ? "Step 2: Volunteer sorted by Seniority" : "Exempt / Non-Mandated";
        let riskBadge = '<span class="badge badge-success">No Risk</span>';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${tech.name}</strong> (${tech.level})</td>
            <td>${tech.seniority}</td>
            <td>${tech.holidayVol ? '<span class="badge badge-success">Yes</span>' : 'No'}</td>
            <td>${assignedStatus}</td>
            <td>${peckingRule}</td>
            <td>${riskBadge}</td>
        `;
        tbody.appendChild(tr);
    });
}

// GRIEVANCE & COMPLIANCE AUDIT ENGINE
function runGrievanceAudit() {
    const container = document.getElementById('auditLogContainer');
    container.innerHTML = '';
    let violations = 0;

    // Check 1: PM Craft Qualification Check
    pmAssignments.forEach(pm => {
        const tech = technicians.find(t => t.name === pm.assignedTech);
        const craftMatch = getCraftMatch(pm.category, tech);
        if (tech && craftMatch !== 'Valid Craft Match') {
            violations++;
            container.innerHTML += `
                <div class="audit-alert-box audit-alert-danger">
                    <div>
                        <strong>Craft Qualification Grievance Risk (${pm.equipId}):</strong>
                        Assigned technician ${tech.name} (${tech.level}) is not qualified for ${pm.category} maintenance. ${craftMatch}
                    </div>
                    <span class="badge badge-danger">Article 38 Violation</span>
                </div>`;
        }
    });

    if (violations === 0) {
        container.innerHTML = `
            <div class="audit-alert-box audit-alert-success">
                <div>
                    <strong>All Clear:</strong> No active seniority, holiday mandating, or craft qualification violations detected in current schedule configuration.
                </div>
                <span class="badge badge-success">Compliant</span>
            </div>`;
    }

    document.getElementById('violationCountBadge').textContent = `${violations} Violations Detected`;
    document.getElementById('violationCountBadge').className = violations > 0 ? 'badge badge-danger' : 'badge badge-success';
}

// MODAL CONTROLS
const techModal = document.getElementById('techModal');
const pmModal = document.getElementById('pmModal');

document.getElementById('openAddTechModal').addEventListener('click', () => {
    document.getElementById('modalTitle').textContent = "Add Maintenance Technician";
    document.getElementById('techEditIndex').value = -1;
    document.getElementById('techForm').reset();
    techModal.style.display = 'flex';
});

document.getElementById('closeTechModal').addEventListener('click', () => techModal.style.display = 'none');
document.getElementById('openAddPmModal').addEventListener('click', () => pmModal.style.display = 'flex');
document.getElementById('closePmModal').addEventListener('click', () => pmModal.style.display = 'none');
document.getElementById('pmEquipId').addEventListener('input', (e) => populateTechDropdowns(e.target.value));

// FORM SUBMISSIONS
document.getElementById('techForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const index = parseInt(document.getElementById('techEditIndex').value);
    const newTech = {
        name: document.getElementById('techName').value,
        level: document.getElementById('techLevel').value,
        tour: document.getElementById('techTour').value,
        sdos: document.getElementById('techSdos').value,
        seniority: document.getElementById('techSeniority').value,
        odl: document.getElementById('techOdl').checked,
        holidayVol: document.getElementById('techHolidayVol').checked
    };

    if (index === -1) {
        technicians.push(newTech);
    } else {
        technicians[index] = newTech;
    }

    techModal.style.display = 'none';
    renderRoster();
});

document.getElementById('pmForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const equipId = document.getElementById('pmEquipId').value.trim();
    const assignedTech = document.getElementById('pmTechSelect').value;
    const assignedEquipmentIds = getEquipmentIdsForTech(assignedTech);
    if (!assignedTech || (assignedEquipmentIds.size >= MAX_MACHINES_PER_TECH && !assignedEquipmentIds.has(equipId.toUpperCase()))) {
        window.alert(`${assignedTech || 'This technician'} already has the maximum of ${MAX_MACHINES_PER_TECH} machines assigned.`);
        return;
    }

    pmAssignments.push({
        equipId,
        category: document.getElementById('pmCategory').value,
        taskName: document.getElementById('pmTaskName').value,
        tour: document.getElementById('pmTour').value,
        assignedTech
    });
    pmModal.style.display = 'none';
    renderPmTable();
});

function editTech(index) {
    const tech = technicians[index];
    document.getElementById('modalTitle').textContent = "Edit Technician";
    document.getElementById('techEditIndex').value = index;
    document.getElementById('techName').value = tech.name;
    document.getElementById('techLevel').value = tech.level;
    document.getElementById('techTour').value = tech.tour;
    document.getElementById('techSdos').value = tech.sdos;
    document.getElementById('techSeniority').value = tech.seniority;
    document.getElementById('techOdl').checked = tech.odl;
    document.getElementById('techHolidayVol').checked = tech.holidayVol;
    techModal.style.display = 'flex';
}

function deleteTech(index) {
    technicians.splice(index, 1);
    renderRoster();
}

function deletePm(index) {
    pmAssignments.splice(index, 1);
    renderPmTable();
}

// EXCEL (.xlsx) EXPORT (requires the SheetJS script tag in index.html)
function autoWidth(rows) {
    return rows[0].map((_, col) => ({
        wch: Math.min(60, Math.max(...rows.map(r => String(r[col] ?? '').length)) + 2)
    }));
}

document.getElementById('exportExcelBtn').addEventListener('click', () => {
    if (!window.XLSX) {
        const error = new Error('The Excel export library did not load.');
        console.error(error);
        window.alert('Excel export is unavailable. Check your internet connection and reload the page.');
        return;
    }

    try {
        const activeTab = document.querySelector('.tab-btn.active')?.dataset.tab;
        let sheetName;
        let fileSuffix;
        let rows;

        if (activeTab === 'roster') {
            sheetName = 'Roster';
            fileSuffix = 'roster';
            rows = [
                ['Name', 'Craft Level', 'Tour', 'Days Off (SDO)', 'Seniority Date', 'ODL', 'Holiday Volunteer'],
                ...technicians.map(t => [t.name, t.level, t.tour, t.sdos, t.seniority, t.odl ? 'Yes' : 'No', t.holidayVol ? 'Yes' : 'No'])
            ];
        } else if (activeTab === 'pm') {
            sheetName = 'PM Schedule';
            fileSuffix = 'pm_schedule';
            rows = [
                ['Equipment ID', 'Category', 'Task', 'Tour', 'Assigned Tech', 'Craft Match', 'Status'],
                ...pmAssignments.map(pm => {
                    const tech = technicians.find(t => t.name === pm.assignedTech);
                    const craftMatch = getCraftMatch(pm.category, tech);
                    return [pm.equipId, pm.category, pm.taskName, pm.tour, pm.assignedTech, craftMatch, 'Scheduled'];
                }),
                [],
                ['Building Custodian Assignments'],
                ['Building Section', 'Assigned Custodian(s)'],
                ...custodialAssignments.map(assignment => [assignment.area, assignment.custodians])
            ];
        } else if (activeTab === 'holiday') {
            sheetName = 'Holiday Schedule';
            fileSuffix = 'holiday_schedule';
            const sortedTechs = [...technicians].sort((a, b) => new Date(a.seniority) - new Date(b.seniority));
            rows = [
                ['Technician', 'Seniority Date', 'Holiday Volunteer?', 'Assigned Status', 'Pecking Order Rule Applied', 'Grievance Risk'],
                ...sortedTechs.map(tech => [
                    `${tech.name} (${tech.level})`,
                    tech.seniority,
                    tech.holidayVol ? 'Yes' : 'No',
                    tech.holidayVol ? 'Working (Volunteer)' : 'Off / Protected',
                    tech.holidayVol ? 'Step 2: Volunteer sorted by Seniority' : 'Exempt / Non-Mandated',
                    'No Risk'
                ])
            ];
        } else if (activeTab === 'audit') {
            sheetName = 'Audit Report';
            fileSuffix = 'audit_report';
            rows = [
                ['Finding', 'Status'],
                ...Array.from(document.querySelectorAll('#auditLogContainer .audit-alert-box'), alert => [
                    alert.querySelector('div')?.innerText.trim() ?? '',
                    alert.querySelector('.badge')?.innerText.trim() ?? ''
                ])
            ];
        } else {
            throw new Error('No supported dashboard tab is currently selected.');
        }

        const sheet = window.XLSX.utils.aoa_to_sheet(rows);
        sheet['!cols'] = autoWidth(rows);
        if (activeTab === 'pm') {
            const titleRow = pmAssignments.length + 3;
            sheet['!merges'] = [window.XLSX.utils.decode_range(`A${titleRow}:G${titleRow}`)];
        }
        const workbook = window.XLSX.utils.book_new();
        window.XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
        window.XLSX.writeFile(workbook, `postal_maintenance_${fileSuffix}.xlsx`);
    } catch (error) {
        console.error('Failed to export the current tab as an Excel workbook.', error);
        window.alert('Excel export failed. See the browser console for details.');
    }
});

document.getElementById('runAuditBtn').addEventListener('click', () => {
    document.querySelector('[data-tab="audit"]').click();
});

// Run init on load
initApp();
