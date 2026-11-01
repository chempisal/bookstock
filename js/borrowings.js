/**
 * borrowings.js - Textbook Borrow & Return Operations Module with Activity Logging & Cloud Sync
 * ប្រតិបត្តិការខ្ចី និងប្រគល់សៀវភៅសង (កត់ត្រាការខ្ចី, កត់ត្រាការសង, បោះពុម្ភបង្កាន់ដៃ)
 */

// Initialize Borrowings View
function initBorrowingsView() {
    setupBorrowingFilterListeners();
    renderBorrowingsTable();
}

// Setup Event Listeners
function setupBorrowingFilterListeners() {
    const searchInput = document.getElementById('borrow-search');
    const statusFilter = document.getElementById('borrow-status-filter');
    const gradeFilter = document.getElementById('borrow-grade-filter');

    if (searchInput) {
        searchInput.addEventListener('input', () => renderBorrowingsTable());
    }
    if (statusFilter) {
        statusFilter.addEventListener('change', () => renderBorrowingsTable());
    }
    if (gradeFilter) {
        gradeFilter.addEventListener('change', () => renderBorrowingsTable());
    }
}

// Render Borrowings Table
function renderBorrowingsTable() {
    const tbody = document.getElementById('borrowings-table-body');
    if (!tbody) return;

    const search = (document.getElementById('borrow-search')?.value || '').toLowerCase().trim();
    const status = document.getElementById('borrow-status-filter')?.value || '';
    const grade = document.getElementById('borrow-grade-filter')?.value || '';

    // Filter borrowings
    const filtered = appBorrowings.filter(br => {
        const matchesSearch = !search ||
            br.studentName.toLowerCase().includes(search) ||
            br.studentId.toLowerCase().includes(search) ||
            (br.id && br.id.toLowerCase().includes(search));

        const matchesGrade = !grade || String(br.grade) === String(grade);

        let matchesStatus = true;
        if (status) {
            matchesStatus = br.status === status;
        }

        return matchesSearch && matchesGrade && matchesStatus;
    });

    // Update count in header
    const countBadge = document.getElementById('borrowings-count-badge');
    if (countBadge) {
        countBadge.textContent = `${toKhmerNumber(filtered.length)} ប្រតិបត្តិការ`;
    }

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8">
                    <div class="empty-state">
                        <i data-lucide="clipboard-x"></i>
                        <h4>មិនទាន់មានប្រតិបត្តិការខ្ចី-សងសៀវភៅនៅឡើយទេ</h4>
                        <p>សូមចុចប៊ូតុង "កត់ត្រាការខ្ចីថ្មី" ដើម្បីចាប់ផ្តើម</p>
                    </div>
                </td>
            </tr>
        `;
        if (window.lucide) lucide.createIcons();
        return;
    }

    // Sort: newest first
    filtered.sort((a, b) => new Date(b.borrowDate) - new Date(a.borrowDate));

    // Render Rows
    tbody.innerHTML = filtered.map((br, index) => {
        const booksListHtml = (br.books || []).map(item => {
            const book = appBooks.find(b => b.id === item.bookId);
            const title = book ? book.title : item.title || 'សៀវភៅ';

            let tag = '<span style="color: var(--accent); font-weight: 500;">(កំពុងខ្ចី)</span>';
            if (item.status === 'returned') {
                tag = `<span style="color: var(--success); font-weight: 500;">(បានសង ${formatKhmerDate(item.returnDate)})</span>`;
            } else if (item.status === 'overdue' || br.status === 'overdue') {
                tag = '<span style="color: var(--danger); font-weight: 600;">(ហួសកំណត់)</span>';
            }

            return `<div style="font-size: 12.5px; line-height: 1.5;">• <strong>${title}</strong> ${tag}</div>`;
        }).join('');

        let overallBadge = '<span class="badge badge-borrowing"><span class="badge-dot"></span> កំពុងខ្ចី</span>';
        if (br.status === 'returned') {
            overallBadge = '<span class="badge badge-returned"><span class="badge-dot"></span> បានសងវិញ</span>';
        } else if (br.status === 'overdue') {
            overallBadge = '<span class="badge badge-overdue"><span class="badge-dot"></span> ហួសកំណត់</span>';
        }

        const hasUnreturned = (br.books || []).some(b => b.status !== 'returned');

        return `
            <tr>
                <td style="text-align: center; font-weight: 600;">${toKhmerNumber(index + 1)}</td>
                <td>
                    <div style="font-weight: 600; color: var(--primary); font-size: 14px;">${br.studentName}</div>
                    <div style="font-size: 11px; color: var(--text-muted); font-family: monospace;">${br.studentId}</div>
                </td>
                <td style="text-align: center;">
                    <span class="badge" style="background-color: #f8fafc; border: 1px solid var(--border-color); color: var(--text-main);">
                        ថ្នាក់ទី ${toKhmerNumber(br.grade)} (${br.class})
                    </span>
                </td>
                <td style="padding: 10px 14px;">
                    ${booksListHtml}
                </td>
                <td style="text-align: center;">${formatKhmerDate(br.borrowDate)}</td>
                <td style="text-align: center;">
                    <span style="font-weight: 600; color: ${br.status === 'overdue' ? 'var(--danger)' : 'inherit'};">
                        ${formatKhmerDate(br.dueDate)}
                    </span>
                </td>
                <td style="text-align: center;">${overallBadge}</td>
                <td style="text-align: right;">
                    <div class="table-actions" style="justify-content: flex-end;">
                        <button class="btn btn-secondary btn-icon btn-sm" onclick="printBorrowReceipt('${br.id}')" title="បោះពុម្ភបង្កាន់ដៃ">
                            <i data-lucide="printer"></i>
                        </button>
                        ${hasUnreturned ? `
                        <button class="btn btn-success btn-icon btn-sm" onclick="openReturnModal('${br.id}')" title="កត់ត្រាការសង">
                            <i data-lucide="check-check"></i>
                        </button>
                        ` : ''}
                        <button class="btn btn-secondary btn-icon btn-sm" onclick="openBorrowModal('${br.id}')" title="កែប្រែ">
                            <i data-lucide="pencil"></i>
                        </button>
                        <button class="btn btn-secondary btn-icon btn-sm" onclick="confirmDeleteBorrowing('${br.id}')" title="លុប" style="color: var(--danger);">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    if (window.lucide) lucide.createIcons();
}

// Open Borrow Modal (New or Edit)
function openBorrowModal(borrowId = null) {
    const modal = document.getElementById('borrow-modal');
    const form = document.getElementById('borrow-form');
    const titleEl = document.getElementById('borrow-modal-title');
    const editIdInput = document.getElementById('borrow-edit-id');
    const studentSelect = document.getElementById('borrow-student-select');

    if (!modal || !form) return;
    form.reset();

    populateBorrowStudentSelect();

    const todayStr = getTodayDateString();
    const duration = appSettings.loanDurationDays || 14;
    const dueStr = addDaysToDate(todayStr, duration);

    document.getElementById('borrow-date-input').value = todayStr;
    document.getElementById('borrow-due-date-input').value = dueStr;

    if (borrowId) {
        const br = appBorrowings.find(b => b.id === borrowId);
        if (!br) return;

        titleEl.textContent = 'កែប្រែកំណត់ត្រាខ្ចីសៀវភៅ';
        editIdInput.value = br.id;
        studentSelect.value = br.studentId;
        document.getElementById('borrow-student-name').value = br.studentName;
        document.getElementById('borrow-student-id').value = br.studentId;
        document.getElementById('borrow-student-grade').value = br.grade;
        document.getElementById('borrow-student-class').value = br.class;
        document.getElementById('borrow-date-input').value = br.borrowDate;
        document.getElementById('borrow-due-date-input').value = br.dueDate;
        document.getElementById('borrow-note-input').value = br.note || '';

        const selectedBookIds = (br.books || []).map(b => b.bookId);
        renderBorrowBookCheckboxes(br.grade, selectedBookIds);
    } else {
        titleEl.textContent = 'កត់ត្រាការខ្ចីសៀវភៅសិក្សាគោលថ្មី';
        editIdInput.value = '';
        renderBorrowBookCheckboxes('');
    }

    modal.classList.add('active');
}

// Populate Students Dropdown in Borrow Modal
function populateBorrowStudentSelect() {
    const studentSelect = document.getElementById('borrow-student-select');
    if (!studentSelect) return;

    if (appStudents.length === 0) {
        studentSelect.innerHTML = '<option value="">-- ពុំទាន់មានសិស្សក្នុងប្រព័ន្ធ (សូមបន្ថែមសិស្សជាមុន) --</option>';
        return;
    }

    let options = '<option value="">-- ជ្រើសរើសសិស្សដែលមកខ្ចី --</option>';
    appStudents.forEach(s => {
        options += `<option value="${s.id}" data-name="${s.name}" data-grade="${s.grade}" data-class="${s.class}">
            ${s.name} (${s.id}) - ថ្នាក់ទី ${toKhmerNumber(s.grade)} (${s.class})
        </option>`;
    });
    studentSelect.innerHTML = options;
}

// When student selection changes in Borrow Modal
function handleBorrowStudentChange() {
    const select = document.getElementById('borrow-student-select');
    const selectedOption = select.options[select.selectedIndex];

    if (!selectedOption || !selectedOption.value) {
        document.getElementById('borrow-student-name').value = '';
        document.getElementById('borrow-student-id').value = '';
        document.getElementById('borrow-student-grade').value = '';
        document.getElementById('borrow-student-class').value = '';
        renderBorrowBookCheckboxes('');
        return;
    }

    const id = selectedOption.value;
    const name = selectedOption.getAttribute('data-name');
    const grade = selectedOption.getAttribute('data-grade');
    const classVal = selectedOption.getAttribute('data-class');

    document.getElementById('borrow-student-name').value = name;
    document.getElementById('borrow-student-id').value = id;
    document.getElementById('borrow-student-grade').value = grade;
    document.getElementById('borrow-student-class').value = classVal;

    renderBorrowBookCheckboxes(grade);
}

// Render dynamic checkboxes for available books
function renderBorrowBookCheckboxes(grade = '', preselectedIds = []) {
    const container = document.getElementById('borrow-books-checkbox-list');
    if (!container) return;

    const showAll = document.getElementById('borrow-show-all-grades')?.checked;
    const booksToShow = appBooks.filter(b => {
        if (showAll || !grade) return true;
        return String(b.grade) === String(grade);
    });

    if (booksToShow.length === 0) {
        container.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 14px; font-size: 13px;">មិនទាន់មានសៀវភៅសម្រាប់កម្រិតថ្នាក់នេះទេ (សូមបន្ថែមសៀវភៅជាមុន)</div>`;
        return;
    }

    container.innerHTML = booksToShow.map(b => {
        const total = Number(b.quantity) || 0;
        const borrowed = Number(b.borrowed) || 0;
        const available = Math.max(0, total - borrowed);
        const isPreselected = preselectedIds.includes(b.id);
        const isDisabled = available <= 0 && !isPreselected;

        return `
            <div class="book-checkbox-item" style="${isDisabled ? 'opacity: 0.5; background: #f8fafc;' : ''}">
                <label>
                    <input type="checkbox" name="borrowed_book_ids" value="${b.id}" 
                        ${isPreselected ? 'checked' : ''} 
                        ${isDisabled ? 'disabled' : ''}>
                    <span>
                        <strong>${b.title}</strong> 
                        <span style="font-size: 11px; color: var(--text-muted);">(ថ្នាក់ទី ${toKhmerNumber(b.grade)})</span>
                    </span>
                </label>
                <div style="font-size: 12px; font-weight: 600; color: ${available > 0 ? 'var(--success)' : 'var(--danger)'};">
                    ${available > 0 ? `សល់ ${toKhmerNumber(available)} ក្បាល` : 'អស់ពីស្តុក'}
                </div>
            </div>
        `;
    }).join('');
}

// Handle Borrow Form Submit
function handleBorrowFormSubmit(e) {
    e.preventDefault();
    const editId = document.getElementById('borrow-edit-id').value;
    const studentId = document.getElementById('borrow-student-id').value.trim();
    const studentName = document.getElementById('borrow-student-name').value.trim();
    const grade = document.getElementById('borrow-student-grade').value;
    const classVal = document.getElementById('borrow-student-class').value;
    const borrowDate = document.getElementById('borrow-date-input').value;
    const dueDate = document.getElementById('borrow-due-date-input').value;
    const note = document.getElementById('borrow-note-input').value.trim();

    if (!studentId || !studentName || !grade || !classVal || !borrowDate || !dueDate) {
        showToast('សូមបំពេញព័ត៌មានឱ្យបានត្រឹមត្រូវ!', 'danger');
        return;
    }

    const checkedBoxes = Array.from(document.querySelectorAll('input[name="borrowed_book_ids"]:checked'));
    if (checkedBoxes.length === 0) {
        showToast('សូមជ្រើសរើសយ៉ាងហោចណាស់សៀវភៅ ១ ក្បាលដើម្បីខ្ចី!', 'warning');
        return;
    }

    const bookItems = checkedBoxes.map(cb => {
        const bookId = cb.value;
        const book = appBooks.find(b => b.id === bookId);
        return {
            bookId,
            title: book ? book.title : 'សៀវភៅ',
            returnDate: '',
            status: 'borrowing',
            condition: 'ល្អ'
        };
    });

    let currentBorrowId = editId;

    if (editId) {
        const br = appBorrowings.find(b => b.id === editId);
        if (br) {
            br.studentId = studentId;
            br.studentName = studentName;
            br.grade = grade;
            br.class = classVal;
            br.borrowDate = borrowDate;
            br.dueDate = dueDate;
            br.note = note;
            br.books = bookItems;
            logActivity('កែប្រែការខ្ចី', `បានកែប្រែកំណត់ត្រាខ្ចីរបស់សិស្ស "${studentName}" (${br.id})`, 'borrow', 'pencil');
        }
    } else {
        const newId = 'BR-' + String(appBorrowings.length + 1).padStart(4, '0');
        currentBorrowId = newId;

        appBorrowings.unshift({
            id: newId,
            studentId,
            studentName,
            grade,
            class: classVal,
            borrowDate,
            dueDate,
            status: 'borrowing',
            books: bookItems,
            note
        });

        logActivity('កត់ត្រាការខ្ចីសៀវភៅ', `សិស្ស "${studentName}" (${studentId} ថ្នាក់ ${grade}${classVal}) បានខ្ចី ${toKhmerNumber(bookItems.length)} ក្បាល`, 'borrow', 'book-open');
    }

    persistAllData();
    recalculateBookStock();
    updateOverdueStatus();
    closeAllModals();
    renderBorrowingsTable();
    renderBooksTable();
    renderDashboard();

    if (confirm('ការកត់ត្រាជោគជ័យ! តើលោកអ្នកចង់បោះពុម្ភបង្កាន់ដៃខ្ចីសៀវភៅជូនសិស្សឥឡូវនេះដែរឬទេ?')) {
        printBorrowReceipt(currentBorrowId);
    }
}

// Open Return Modal
function openReturnModal(borrowId) {
    const br = appBorrowings.find(b => b.id === borrowId);
    if (!br) return;

    const modal = document.getElementById('return-modal');
    if (!modal) return;

    document.getElementById('return-borrow-id').value = br.id;
    document.getElementById('return-student-label').textContent = `${br.studentName} (${br.studentId}) - ថ្នាក់ទី ${toKhmerNumber(br.grade)} (${br.class})`;
    document.getElementById('return-date-input').value = getTodayDateString();

    const booksContainer = document.getElementById('return-books-checklist');
    const activeBooks = (br.books || []).filter(b => b.status !== 'returned');

    if (activeBooks.length === 0) {
        booksContainer.innerHTML = '<p style="color: var(--success); text-align: center; padding: 12px;">សៀវភៅទាំងអស់ត្រូវបានសងរួចរាល់ហើយ!</p>';
    } else {
        booksContainer.innerHTML = activeBooks.map(item => {
            const book = appBooks.find(b => b.id === item.bookId);
            const title = book ? book.title : item.title || 'សៀវភៅ';

            return `
                <div class="book-checkbox-item">
                    <label>
                        <input type="checkbox" name="return_book_ids" value="${item.bookId}" checked>
                        <span><strong>${title}</strong></span>
                    </label>
                    <select class="form-control" name="condition_${item.bookId}" style="width: 110px; padding: 4px 8px; font-size: 11.5px;">
                        <option value="ល្អ">សភាពល្អ</option>
                        <option value="រហែកបន្តិចបន្តួច">រហែកបន្តិច</option>
                        <option value="ខូចខាត">ខូចខាត</option>
                        <option value="បាត់បង់">បាត់បង់</option>
                    </select>
                </div>
            `;
        }).join('');
    }

    modal.classList.add('active');
}

// Handle Return Form Submit
function handleReturnFormSubmit(e) {
    e.preventDefault();
    const borrowId = document.getElementById('return-borrow-id').value;
    const returnDate = document.getElementById('return-date-input').value || getTodayDateString();

    const br = appBorrowings.find(b => b.id === borrowId);
    if (!br) return;

    const checkedBoxes = Array.from(document.querySelectorAll('input[name="return_book_ids"]:checked'));
    if (checkedBoxes.length === 0) {
        showToast('សូមគូសធីកលើសៀវភៅដែលសិស្សបានយកមកសង!', 'warning');
        return;
    }

    const returnedBookIds = checkedBoxes.map(cb => cb.value);

    br.books.forEach(item => {
        if (returnedBookIds.includes(item.bookId)) {
            item.status = 'returned';
            item.returnDate = returnDate;
            const condSelect = document.querySelector(`select[name="condition_${item.bookId}"]`);
            if (condSelect) {
                item.condition = condSelect.value;
            }
        }
    });

    const allReturned = br.books.every(b => b.status === 'returned');
    if (allReturned) {
        br.status = 'returned';
    }

    persistAllData();
    recalculateBookStock();
    updateOverdueStatus();
    closeAllModals();
    renderBorrowingsTable();
    renderBooksTable();
    renderDashboard();

    logActivity('ប្រគល់សៀវភៅសង', `សិស្ស "${br.studentName}" បានសងសៀវភៅចំនួន ${toKhmerNumber(returnedBookIds.length)} ក្បាល`, 'return', 'check-check');
}

// Delete Borrowing Record
function confirmDeleteBorrowing(borrowId) {
    const br = appBorrowings.find(b => b.id === borrowId);
    if (!br) return;

    if (confirm(`តើលោកអ្នកពិតជាចង់លុបប្រតិបត្តិការខ្ចីរបស់សិស្ស "${br.studentName}" (${br.id}) នេះមែនទេ? (សៀវភៅដែលមិនទាន់សងនឹងត្រូវបញ្ចូលស្តុកវិញដោយស្វ័យប្រវត្តិ)`)) {
        const studentName = br.studentName;
        appBorrowings = appBorrowings.filter(b => b.id !== borrowId);
        persistAllData();
        recalculateBookStock();
        updateOverdueStatus();
        renderBorrowingsTable();
        renderBooksTable();
        renderDashboard();
        logActivity('លុបកំណត់ត្រាខ្ចី', `បានលុបកំណត់ត្រាខ្ចីរបស់សិស្ស "${studentName}" (${borrowId})`, 'warning', 'trash-2');
    }
}

// Print Individual Borrowing Receipt
function printBorrowReceipt(borrowId) {
    const br = appBorrowings.find(b => b.id === borrowId);
    if (!br) return;

    const receiptBox = document.getElementById('print-receipt-container');
    if (!receiptBox) return;

    const booksRows = (br.books || []).map((item, idx) => {
        const book = appBooks.find(b => b.id === item.bookId);
        const title = book ? book.title : item.title || 'សៀវភៅ';

        let statusText = 'កំពុងខ្ចី';
        if (item.status === 'returned') {
            statusText = `បានសង (${formatKhmerDate(item.returnDate)})`;
        } else if (item.status === 'overdue' || br.status === 'overdue') {
            statusText = 'ហួសកំណត់';
        }

        return `
            <tr>
                <td style="text-align: center;">${toKhmerNumber(idx + 1)}</td>
                <td><strong>${title}</strong></td>
                <td style="text-align: center;">${formatKhmerDate(br.borrowDate)}</td>
                <td style="text-align: center;">${formatKhmerDate(br.dueDate)}</td>
                <td style="text-align: center;">${statusText}</td>
            </tr>
        `;
    }).join('');

    receiptBox.innerHTML = `
        <div class="receipt-card">
            <div class="receipt-header">
                <div class="cambodia-title-top" style="font-size: 13pt;">ព្រះរាជាណាចក្រកម្ពុជា</div>
                <div class="cambodia-title-sub" style="font-size: 10.5pt;">ជាតិ សាសនា ព្រះមហាក្សត្រ</div>
                <div class="kbach-divider" style="margin-bottom: 8px;"></div>
                <div style="font-size: 11px; color: #475569;">${appSettings.districtOffice || ''}</div>
                <div style="font-size: 13px; font-weight: 700; color: #1e3a8a;">${appSettings.schoolName || ''}</div>
                <h3 style="margin-top: 10px; font-size: 14pt; color: #000;">បង្កាន់ដៃខ្ចី-សងសៀវភៅសិក្សាគោល</h3>
            </div>

            <div class="receipt-meta-grid">
                <div><strong>ឈ្មោះសិស្ស៖</strong> ${br.studentName}</div>
                <div><strong>លេខសម្គាល់៖</strong> ${br.studentId}</div>
                <div><strong>កម្រិតថ្នាក់៖</strong> ថ្នាក់ទី ${toKhmerNumber(br.grade)} (${br.class})</div>
                <div><strong>លេខបង្កាន់ដៃ៖</strong> #${br.id}</div>
                <div><strong>កាលបរិច្ឆេទខ្ចី៖</strong> ${formatKhmerDate(br.borrowDate)}</div>
                <div><strong>កាលបរិច្ឆេទសង៖</strong> ${formatKhmerDate(br.dueDate)}</div>
            </div>

            <table class="receipt-table">
                <thead>
                    <tr>
                        <th style="width: 8%; text-align: center;">ល.រ</th>
                        <th>ឈ្មោះសៀវភៅសិក្សាគោល</th>
                        <th style="width: 22%; text-align: center;">ថ្ងៃខ្ចី</th>
                        <th style="width: 22%; text-align: center;">ថ្ងៃត្រូវសង</th>
                        <th style="width: 18%; text-align: center;">ស្ថានភាព</th>
                    </tr>
                </thead>
                <tbody>
                    ${booksRows}
                </tbody>
            </table>

            <div class="receipt-note">
                ${appSettings.receiptNote || '* សេចក្តីបញ្ជាក់៖ សូមរក្សាទុកសៀវភៅឱ្យបានល្អ កុំឱ្យហែក ឬបាត់បង់ និងសងឱ្យបានទាន់ពេលវេលា។'}
            </div>

            <div class="receipt-signatures">
                <div style="width: 200px;">
                    <p>ស្នាមមេដៃ / ហត្ថលេខាសិស្ស</p>
                    <div style="height: 50px;"></div>
                    <p style="font-weight: 600;">(${br.studentName})</p>
                </div>
                <div style="width: 220px; text-align: right;">
                    <p>ថ្ងៃទី ......... ខែ ......... ឆ្នាំ .........</p>
                    <p style="font-weight: 700; margin-top: 2px;">បណ្ណារក្សសាលា</p>
                    <div style="height: 50px;"></div>
                    <p style="font-weight: 600;">(${appSettings.librarianName || 'បណ្ណារក្ស'})</p>
                </div>
            </div>
        </div>
    `;

    document.body.classList.add('print-receipt-mode');
    window.print();
    setTimeout(() => {
        document.body.classList.remove('print-receipt-mode');
    }, 1000);
}
