/**
 * students.js - Student Directory & Management Module with Activity Logging & Cloud Sync
 * គ្រប់គ្រងបញ្ជីសិស្ស (ស្វែងរក, បន្ថែម, កែប្រែ, លុប, មើលប្រវត្តិខ្ចី, នាំចេញ/នាំចូល Excel/CSV)
 */

// Initialize Students View
function initStudentsView() {
    setupStudentFilterListeners();
    renderStudentsTable();
}

// Setup Event Listeners for Student filtering & search
function setupStudentFilterListeners() {
    const searchInput = document.getElementById('student-search');
    const gradeFilter = document.getElementById('student-grade-filter');
    const classFilter = document.getElementById('student-class-filter');

    if (searchInput) {
        searchInput.addEventListener('input', () => renderStudentsTable());
    }
    if (gradeFilter) {
        gradeFilter.addEventListener('change', () => renderStudentsTable());
    }
    if (classFilter) {
        classFilter.addEventListener('change', () => renderStudentsTable());
    }
}

// Render Students Table
function renderStudentsTable() {
    const tbody = document.getElementById('students-table-body');
    if (!tbody) return;

    const search = (document.getElementById('student-search')?.value || '').toLowerCase().trim();
    const grade = document.getElementById('student-grade-filter')?.value || '';
    const classVal = document.getElementById('student-class-filter')?.value || '';

    // Filter students
    const filtered = appStudents.filter(s => {
        const matchesSearch = !search ||
            s.name.toLowerCase().includes(search) ||
            s.id.toLowerCase().includes(search) ||
            (s.phone && s.phone.includes(search));

        const matchesGrade = !grade || String(s.grade) === String(grade);
        const matchesClass = !classVal || s.class === classVal;

        return matchesSearch && matchesGrade && matchesClass;
    });

    // Update count in header
    const countBadge = document.getElementById('students-count-badge');
    if (countBadge) {
        countBadge.textContent = `${toKhmerNumber(filtered.length)} នាក់`;
    }

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8">
                    <div class="empty-state">
                        <i data-lucide="users-round"></i>
                        <h4>មិនទាន់មានទិន្នន័យសិស្សនៅឡើយទេ</h4>
                        <p>សូមចុចប៊ូតុង "បន្ថែមសិស្សថ្មី" ឬ "នាំចូល Excel/CSV"</p>
                    </div>
                </td>
            </tr>
        `;
        if (window.lucide) lucide.createIcons();
        return;
    }

    // Render Rows
    tbody.innerHTML = filtered.map((s, index) => {
        let activeBorrowCount = 0;
        let hasOverdue = false;

        appBorrowings.forEach(br => {
            if (br.studentId === s.id && Array.isArray(br.books)) {
                br.books.forEach(b => {
                    if (b.status !== 'returned') {
                        activeBorrowCount++;
                        if (b.status === 'overdue' || br.status === 'overdue') {
                            hasOverdue = true;
                        }
                    }
                });
            }
        });

        let borrowBadge = `<span class="badge" style="background-color: #f1f5f9; color: var(--text-muted);">គ្មានខ្ចី</span>`;
        if (hasOverdue) {
            borrowBadge = `<span class="badge badge-overdue">ខ្ចី ${toKhmerNumber(activeBorrowCount)} (ហួសកំណត់)</span>`;
        } else if (activeBorrowCount > 0) {
            borrowBadge = `<span class="badge badge-borrowing">កំពុងខ្ចី ${toKhmerNumber(activeBorrowCount)} ក្បាល</span>`;
        }

        return `
            <tr>
                <td style="text-align: center; font-weight: 600;">${toKhmerNumber(index + 1)}</td>
                <td>
                    <span style="font-family: monospace; font-weight: 600; color: var(--primary); background: var(--primary-light); padding: 3px 7px; border-radius: 4px; font-size: 12px;">
                        ${s.id}
                    </span>
                </td>
                <td>
                    <div style="font-weight: 600; font-size: 14px; color: var(--text-main);">${s.name}</div>
                    <div style="font-size: 11px; color: var(--text-muted);">${s.note || ''}</div>
                </td>
                <td style="text-align: center;">${s.gender || 'ប្រុស'}</td>
                <td style="text-align: center;">
                    <span class="badge" style="background-color: #f8fafc; border: 1px solid var(--border-color); color: var(--text-main);">
                        ថ្នាក់ទី ${toKhmerNumber(s.grade)} (${s.class})
                    </span>
                </td>
                <td>${s.phone || '-'}</td>
                <td style="text-align: center;">${borrowBadge}</td>
                <td style="text-align: right;">
                    <div class="table-actions" style="justify-content: flex-end;">
                        <button class="btn btn-secondary btn-icon btn-sm" onclick="viewStudentBorrowHistory('${s.id}')" title="មើលប្រវត្តិខ្ចី-សង">
                            <i data-lucide="history"></i>
                        </button>
                        <button class="btn btn-secondary btn-icon btn-sm" onclick="openStudentModal('${s.id}')" title="កែប្រែ">
                            <i data-lucide="pencil"></i>
                        </button>
                        <button class="btn btn-secondary btn-icon btn-sm" onclick="confirmDeleteStudent('${s.id}')" title="លុប" style="color: var(--danger);">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    if (window.lucide) lucide.createIcons();
}

// Open Student Modal for Add or Edit
function openStudentModal(studentId = null) {
    const modal = document.getElementById('student-modal');
    const form = document.getElementById('student-form');
    const titleEl = document.getElementById('student-modal-title');
    const oldIdInput = document.getElementById('student-old-id-input');

    if (!modal || !form) return;

    form.reset();

    if (studentId) {
        const student = appStudents.find(s => s.id === studentId);
        if (!student) return;

        titleEl.textContent = 'កែប្រែព័ត៌មានសិស្ស';
        oldIdInput.value = student.id;
        document.getElementById('student-id-input').value = student.id;
        document.getElementById('student-name-input').value = student.name;
        document.getElementById('student-gender-input').value = student.gender || 'ប្រុស';
        document.getElementById('student-grade-input').value = student.grade;
        document.getElementById('student-class-input').value = student.class;
        document.getElementById('student-phone-input').value = student.phone || '';
        document.getElementById('student-note-input').value = student.note || '';
    } else {
        titleEl.textContent = 'បន្ថែមសិស្សថ្មី';
        oldIdInput.value = '';
        const nextId = 'STD-' + String(appStudents.length + 1).padStart(4, '0');
        document.getElementById('student-id-input').value = nextId;
    }

    modal.classList.add('active');
}

// Handle Student Form Submit
function handleStudentFormSubmit(e) {
    e.preventDefault();
    const oldId = document.getElementById('student-old-id-input').value;
    const id = document.getElementById('student-id-input').value.trim();
    const name = document.getElementById('student-name-input').value.trim();
    const gender = document.getElementById('student-gender-input').value;
    const grade = document.getElementById('student-grade-input').value;
    const classVal = document.getElementById('student-class-input').value.trim().toUpperCase();
    const phone = document.getElementById('student-phone-input').value.trim();
    const note = document.getElementById('student-note-input').value.trim();

    if (!id || !name || !grade || !classVal) {
        showToast('សូមបំពេញព័ត៌មានចាំបាច់ឱ្យបានគ្រប់គ្រាន់!', 'danger');
        return;
    }

    if (oldId) {
        const student = appStudents.find(s => s.id === oldId);
        if (student) {
            if (oldId !== id && appStudents.some(s => s.id === id)) {
                showToast(`លេខសម្គាល់សិស្ស "${id}" មានរួចហើយ!`, 'danger');
                return;
            }

            if (oldId !== id || student.name !== name) {
                appBorrowings.forEach(br => {
                    if (br.studentId === oldId) {
                        br.studentId = id;
                        br.studentName = name;
                        br.grade = grade;
                        br.class = classVal;
                    }
                });
            }

            student.id = id;
            student.name = name;
            student.gender = gender;
            student.grade = grade;
            student.class = classVal;
            student.phone = phone;
            student.note = note;

            logActivity('កែប្រែព័ត៌មានសិស្ស', `បានកែប្រែព័ត៌មានសិស្ស "${name}" (${id})`, 'student', 'user-check');
        }
    } else {
        if (appStudents.some(s => s.id === id)) {
            showToast(`លេខសម្គាល់សិស្ស "${id}" មានរួចហើយ!`, 'danger');
            return;
        }

        appStudents.push({
            id,
            name,
            gender,
            grade,
            class: classVal,
            phone,
            note
        });

        logActivity('បន្ថែមសិស្សថ្មី', `បានបន្ថែម "${name}" (ថ្នាក់ទី ${toKhmerNumber(grade)} ${classVal})`, 'student', 'user-plus');
    }

    persistAllData();
    closeAllModals();
    renderStudentsTable();
    renderDashboard();
}

// Delete Student
function confirmDeleteStudent(studentId) {
    const student = appStudents.find(s => s.id === studentId);
    if (!student) return;

    const hasActiveBorrowings = appBorrowings.some(br =>
        br.studentId === studentId &&
        Array.isArray(br.books) &&
        br.books.some(b => b.status !== 'returned')
    );

    if (hasActiveBorrowings) {
        showToast(`មិនអាចលុបបានទេ! សិស្សឈ្មោះ "${student.name}" កំពុងជំពាក់សៀវភៅមិនទាន់បានសង។`, 'danger');
        return;
    }

    if (confirm(`តើលោកអ្នកពិតជាចង់លុបសិស្សឈ្មោះ "${student.name}" (${student.id}) នេះមែនទេ?`)) {
        const studentName = student.name;
        appStudents = appStudents.filter(s => s.id !== studentId);
        persistAllData();
        renderStudentsTable();
        renderDashboard();
        logActivity('លុបសិស្ស', `បានលុបសិស្ស "${studentName}" (${studentId})`, 'warning', 'user-minus');
    }
}

// View Student Borrow History Modal
function viewStudentBorrowHistory(studentId) {
    const student = appStudents.find(s => s.id === studentId);
    if (!student) return;

    const modal = document.getElementById('student-history-modal');
    if (!modal) return;

    document.getElementById('history-student-name').textContent = student.name;
    document.getElementById('history-student-meta').textContent = `អត្តលេខ៖ ${student.id} | ថ្នាក់ទី ${toKhmerNumber(student.grade)} (${student.class})`;

    const historyTbody = document.getElementById('student-history-table-body');
    const studentRecords = appBorrowings.filter(br => br.studentId === studentId);

    if (studentRecords.length === 0) {
        historyTbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 24px;">សិស្សនេះមិនទាន់មានប្រវត្តិខ្ចីសៀវភៅនៅឡើយទេ។</td></tr>`;
    } else {
        let rows = '';
        studentRecords.forEach((br, i) => {
            br.books.forEach(item => {
                const book = appBooks.find(b => b.id === item.bookId);
                const title = book ? book.title : item.title || 'សៀវភៅ';

                let statusBadge = '<span class="badge badge-borrowing">កំពុងខ្ចី</span>';
                if (item.status === 'returned') {
                    statusBadge = `<span class="badge badge-returned">បានសង (${formatKhmerDate(item.returnDate)})</span>`;
                } else if (item.status === 'overdue') {
                    statusBadge = '<span class="badge badge-overdue">ហួសកាលកំណត់</span>';
                }

                rows += `
                    <tr>
                        <td style="text-align: center;">${toKhmerNumber(i + 1)}</td>
                        <td style="font-weight: 600;">${title}</td>
                        <td style="text-align: center;">${formatKhmerDate(br.borrowDate)}</td>
                        <td style="text-align: center;">${formatKhmerDate(br.dueDate)}</td>
                        <td style="text-align: center;">${statusBadge}</td>
                    </tr>
                `;
            });
        });
        historyTbody.innerHTML = rows;
    }

    modal.classList.add('active');
    if (window.lucide) lucide.createIcons();
}

// Export Students to CSV/Excel
function exportStudentsToCSV() {
    if (appStudents.length === 0) {
        showToast('មិនមានទិន្នន័យសិស្សសម្រាប់នាំចេញទេ!', 'warning');
        return;
    }

    const headers = ['លេខសម្គាល់សិស្ស (Student ID)', 'គោត្តនាម-នាម (Name)', 'ភេទ (Gender)', 'កម្រិតថ្នាក់ (Grade)', 'បន្ទប់/ថ្នាក់ (Class)', 'លេខទូរស័ព្ទ (Phone)', 'កំណត់សម្គាល់ (Note)'];
    const rows = appStudents.map(s => [
        `"${s.id}"`,
        `"${s.name}"`,
        `"${s.gender || 'ប្រុស'}"`,
        `"${s.grade}"`,
        `"${s.class}"`,
        `"${s.phone || ''}"`,
        `"${s.note || ''}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `បញ្ជីឈ្មោះសិស្ស_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    logActivity('នាំចេញទិន្នន័យសិស្ស', `បានទាញយកបញ្ជីសិស្ស ${toKhmerNumber(appStudents.length)} នាក់ជា Excel/CSV`, 'student', 'download', false);
}

// Trigger file input for importing students
function triggerStudentImport() {
    document.getElementById('student-import-file').click();
}

// Handle Student CSV File Import
function handleStudentFileImport(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
        const text = event.target.result;
        parseAndImportStudentCSV(text);
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
}

// Parse CSV text and merge/import students
function parseAndImportStudentCSV(text) {
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length <= 1) {
        showToast('ឯកសារគ្មានទិន្នន័យឡើយ!', 'danger');
        return;
    }

    let importedCount = 0;
    for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(',').map(cell => cell.replace(/^["']|["']$/g, '').trim());
        if (row.length >= 2 && row[0] && row[1]) {
            const id = row[0];
            const name = row[1];
            const gender = row[2] || 'ប្រុស';
            const grade = row[3] || '12';
            const classVal = row[4] || 'A';
            const phone = row[5] || '';
            const note = row[6] || '';

            const existingIdx = appStudents.findIndex(s => s.id === id);
            if (existingIdx >= 0) {
                appStudents[existingIdx] = { id, name, gender, grade, class: classVal, phone, note };
            } else {
                appStudents.push({ id, name, gender, grade, class: classVal, phone, note });
            }
            importedCount++;
        }
    }

    persistAllData();
    renderStudentsTable();
    renderDashboard();
    logActivity('នាំចូលទិន្នន័យសិស្ស', `បាននាំចូល និងធ្វើបច្ចុប្បន្នភាពសិស្សចំនួន ${toKhmerNumber(importedCount)} នាក់ពី Excel/CSV`, 'student', 'file-spreadsheet');
}
