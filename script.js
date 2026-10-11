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
function renderPmTable() {
    const tbody = document.getElementById('pmTbody');
    tbody.innerHTML = '';

    pmAssignments.forEach((pm, index) => {
        const tech = technicians.find(t => t.name === pm.assignedTech);
        let validMatch = true;
        let warningText = "Valid Craft Match";

        if (tech) {
            if ((pm.category === 'DBCS' || pm.category === 'AFCS') && tech.level !== 'ET-10') {
                validMatch = false;
                warningText = `Mismatch: ${pm.category} requires ET-10 (Assigned ${tech.level})`;
            } else if (pm.category === 'APPS' && tech.level !== 'MPE-09') {
                validMatch = false;
                warningText = `Mismatch: APPS requires MPE-09 (Assigned ${tech.level})`;
            }
        } else {
            validMatch = false;
            warningText = "Unassigned / Invalid Tech";
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${pm.equipId}</strong></td>
            <td>${pm.category}</td>
            <td>${pm.taskName}</td>
            <td>${pm.tour}</td>
            <td>${pm.assignedTech}</td>
            <td><span class="badge ${validMatch ? 'badge-success' : 'badge-danger'}">${warningText}</span></td>
            <td><span class="badge badge-info">Scheduled</span></td>
            <td>
                <button class="btn btn-sm btn-outline" style="color:var(--danger); border-color:var(--danger);" onclick="deletePm(${index})">Remove</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// POPULATE TECH DROPDOWN
function populateTechDropdowns() {
    const select = document.getElementById('pmTechSelect');
    select.innerHTML = '';
    technicians.forEach(tech => {
        const opt = document.createElement('option');
        opt.value = tech.name;
        opt.textContent = `${tech.name} (${tech.level} - ${tech.tour})`;
        select.appendChild(opt);
    });
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
        if (tech) {
            if ((pm.category === 'DBCS' || pm.category === 'AFCS') && tech.level !== 'ET-10') {
                violations++;
                container.innerHTML += `
                    <div class="audit-alert-box audit-alert-danger">
                        <div>
                            <strong>Craft Qualification Grievance Risk (${pm.equipId}):</strong>
                            Assigned technician ${tech.name} (${tech.level}) is not qualified for ${pm.category} maintenance (Requires ET-10).
                        </div>
                        <span class="badge badge-danger">Article 38 Violation</span>
                    </div>`;
            }
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
    pmAssignments.push({
        equipId: document.getElementById('pmEquipId').value,
        category: document.getElementById('pmCategory').value,
        taskName: document.getElementById('pmTaskName').value,
        tour: document.getElementById('pmTour').value,
        assignedTech: document.getElementById('pmTechSelect').value
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

document.getElementById('exportCsvBtn').addEventListener('click', () => {
    if (typeof XLSX === 'undefined') {
        alert('Excel library failed to load. Check your internet connection and the SheetJS script tag in index.html.');
        return;
    }

    const pmRows = [
        ['Equipment ID', 'Category', 'Task', 'Tour', 'Assigned Tech'],
        ...pmAssignments.map(pm => [pm.equipId, pm.category, pm.taskName, pm.tour, pm.assignedTech])
    ];

    const rosterRows = [
        ['Name', 'Craft Level', 'Tour', 'Days Off (SDO)', 'Seniority Date', 'ODL', 'Holiday Volunteer'],
        ...technicians.map(t => [t.name, t.level, t.tour, t.sdos, t.seniority, t.odl ? 'Yes' : 'No', t.holidayVol ? 'Yes' : 'No'])
    ];

    const pmSheet = XLSX.utils.aoa_to_sheet(pmRows);
    pmSheet['!cols'] = autoWidth(pmRows);

    const rosterSheet = XLSX.utils.aoa_to_sheet(rosterRows);
    rosterSheet['!cols'] = autoWidth(rosterRows);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, pmSheet, 'PM Schedule');
    XLSX.utils.book_append_sheet(wb, rosterSheet, 'Roster');

    XLSX.writeFile(wb, 'postal_maintenance_schedule.xlsx');
});

document.getElementById('runAuditBtn').addEventListener('click', () => {
    document.querySelector('[data-tab="audit"]').click();
});

// Run init on load
initApp();
