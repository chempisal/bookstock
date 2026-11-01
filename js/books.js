/**
 * books.js - Textbook Inventory Management Module with Activity Logging & Cloud Sync
 * គ្រប់គ្រងសៀវភៅសិក្សាគោល (បញ្ជីសៀវភៅ, បន្ថែម, កែប្រែ, បន្ថែម/បន្ថយស្តុក)
 */

// Initialize Books View
function initBooksView() {
    setupBookFilterListeners();
    renderBooksTable();
}

// Setup Event Listeners for Books filtering & search
function setupBookFilterListeners() {
    const searchInput = document.getElementById('book-search');
    const gradeFilter = document.getElementById('book-grade-filter');
    const subjectFilter = document.getElementById('book-subject-filter');

    if (searchInput) {
        searchInput.addEventListener('input', () => renderBooksTable());
    }
    if (gradeFilter) {
        gradeFilter.addEventListener('change', () => renderBooksTable());
    }
    if (subjectFilter) {
        subjectFilter.addEventListener('change', () => renderBooksTable());
    }

    populateBookSubjectFilter();
}

// Populate Subject Filter dropdown with unique subjects
function populateBookSubjectFilter() {
    const subjectFilter = document.getElementById('book-subject-filter');
    if (!subjectFilter) return;

    const subjects = Array.from(new Set(appBooks.map(b => b.subject))).filter(Boolean);
    const currentValue = subjectFilter.value;

    let html = '<option value="">មុខវិជ្ជាទាំងអស់</option>';
    subjects.forEach(sub => {
        html += `<option value="${sub}" ${sub === currentValue ? 'selected' : ''}>${sub}</option>`;
    });
    subjectFilter.innerHTML = html;
}

// Render Books Table with filters & search
function renderBooksTable() {
    const tbody = document.getElementById('books-table-body');
    if (!tbody) return;

    const search = (document.getElementById('book-search')?.value || '').toLowerCase().trim();
    const grade = document.getElementById('book-grade-filter')?.value || '';
    const subject = document.getElementById('book-subject-filter')?.value || '';

    // Filter books
    const filtered = appBooks.filter(book => {
        const matchesSearch = !search ||
            book.title.toLowerCase().includes(search) ||
            book.subject.toLowerCase().includes(search) ||
            (book.id && book.id.toLowerCase().includes(search));

        const matchesGrade = !grade || String(book.grade) === String(grade);
        const matchesSubject = !subject || book.subject === subject;

        return matchesSearch && matchesGrade && matchesSubject;
    });

    // Update count in header
    const countBadge = document.getElementById('books-count-badge');
    if (countBadge) {
        countBadge.textContent = `${toKhmerNumber(filtered.length)} ចំណងជើង`;
    }

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8">
                    <div class="empty-state">
                        <i data-lucide="book-x"></i>
                        <h4>មិនទាន់មានទិន្នន័យសៀវភៅនៅឡើយទេ</h4>
                        <p>សូមចុចប៊ូតុង "បន្ថែមសៀវភៅថ្មី" ឬទាញយកទិន្នន័យពី Google Sheets</p>
                    </div>
                </td>
            </tr>
        `;
        if (window.lucide) lucide.createIcons();
        return;
    }

    // Render Rows
    tbody.innerHTML = filtered.map((book, index) => {
        const total = Number(book.quantity) || 0;
        const borrowed = Number(book.borrowed) || 0;
        const available = Math.max(0, total - borrowed);
        const percentAvailable = total > 0 ? Math.round((available / total) * 100) : 0;

        let badgeClass = 'badge-stock-ok';
        let badgeLabel = 'ស្តុកគ្រប់គ្រាន់';
        let barColor = 'var(--success)';

        if (available === 0) {
            badgeClass = 'badge-stock-out';
            badgeLabel = 'អស់ពីស្តុក';
            barColor = 'var(--danger)';
        } else if (percentAvailable <= 25) {
            badgeClass = 'badge-stock-low';
            badgeLabel = 'ជិតអស់ពីស្តុក';
            barColor = 'var(--accent)';
        }

        return `
            <tr>
                <td style="text-align: center; font-weight: 600;">${toKhmerNumber(index + 1)}</td>
                <td>
                    <div style="font-weight: 600; color: var(--primary); font-size: 14px;">${book.title}</div>
                    <div style="font-size: 11px; color: var(--text-muted);">កូដសៀវភៅ៖ ${book.id}</div>
                </td>
                <td><span style="font-weight: 500;">${book.subject}</span></td>
                <td style="text-align: center;">
                    <span class="badge" style="background-color: var(--primary-light); color: var(--primary); border: 1px solid var(--primary-border);">
                        ថ្នាក់ទី ${toKhmerNumber(book.grade)}
                    </span>
                </td>
                <td style="text-align: center; font-weight: 700;">${toKhmerNumber(total)}</td>
                <td style="text-align: center; color: var(--accent); font-weight: 600;">${toKhmerNumber(borrowed)}</td>
                <td>
                    <div style="display: flex; align-items: center; justify-content: space-between;">
                        <span style="font-weight: 700; color: ${available > 0 ? 'var(--success)' : 'var(--danger)'};">
                            ${toKhmerNumber(available)}
                        </span>
                        <span class="badge ${badgeClass}" style="font-size: 10px;">${badgeLabel}</span>
                    </div>
                    <div class="stock-bar-wrap">
                        <div class="stock-bar-fill" style="width: ${percentAvailable}%; background-color: ${barColor};"></div>
                    </div>
                </td>
                <td style="text-align: right;">
                    <div class="table-actions" style="justify-content: flex-end;">
                        <button class="btn btn-secondary btn-icon btn-sm" onclick="openStockAdjustModal('${book.id}')" title="បន្ថែម/បន្ថយស្តុក">
                            <i data-lucide="package-plus"></i>
                        </button>
                        <button class="btn btn-secondary btn-icon btn-sm" onclick="openBookModal('${book.id}')" title="កែប្រែ">
                            <i data-lucide="pencil"></i>
                        </button>
                        <button class="btn btn-secondary btn-icon btn-sm" onclick="confirmDeleteBook('${book.id}')" title="លុប" style="color: var(--danger);">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    if (window.lucide) lucide.createIcons();
}

// Open Modal to Add or Edit Book
function openBookModal(bookId = null) {
    const modal = document.getElementById('book-modal');
    const form = document.getElementById('book-form');
    const titleEl = document.getElementById('book-modal-title');
    const editIdInput = document.getElementById('book-id-input');

    if (!modal || !form) return;

    form.reset();

    if (bookId) {
        const book = appBooks.find(b => b.id === bookId);
        if (!book) return;

        titleEl.textContent = 'កែប្រែព័ត៌មានសៀវភៅសិក្សាគោល';
        editIdInput.value = book.id;
        document.getElementById('book-title-input').value = book.title;
        document.getElementById('book-subject-input').value = book.subject;
        document.getElementById('book-grade-input').value = book.grade;
        document.getElementById('book-quantity-input').value = book.quantity;
    } else {
        titleEl.textContent = 'បន្ថែមសៀវភៅសិក្សាគោលថ្មី';
        editIdInput.value = '';
    }

    modal.classList.add('active');
}

// Handle Add/Edit Book Form Submit
function handleBookFormSubmit(e) {
    e.preventDefault();
    const editId = document.getElementById('book-id-input').value;
    const title = document.getElementById('book-title-input').value.trim();
    const subject = document.getElementById('book-subject-input').value.trim();
    const grade = document.getElementById('book-grade-input').value;
    const quantity = parseInt(document.getElementById('book-quantity-input').value, 10);

    if (!title || !subject || !grade || isNaN(quantity) || quantity < 0) {
        showToast('សូមបំពេញព័ត៌មានឱ្យបានគ្រប់ជ្រុងជ្រោយ!', 'danger');
        return;
    }

    if (editId) {
        const book = appBooks.find(b => b.id === editId);
        if (book) {
            book.title = title;
            book.subject = subject;
            book.grade = grade;
            book.quantity = quantity;
            logActivity('កែប្រែសៀវភៅ', `បានកែប្រែព័ត៌មានសៀវភៅ "${title}"`, 'stock', 'book');
        }
    } else {
        const newId = 'b' + (Date.now() % 100000);
        appBooks.push({
            id: newId,
            title,
            subject,
            grade,
            quantity,
            borrowed: 0
        });
        logActivity('បន្ថែមសៀវភៅថ្មី', `បានបញ្ចូល "${title}" ចំនួន ${toKhmerNumber(quantity)} ក្បាល`, 'stock', 'book-plus');
    }

    persistAllData();
    closeAllModals();
    populateBookSubjectFilter();
    renderBooksTable();
    renderDashboard();
    if (typeof renderReportPreview === 'function') renderReportPreview();
}

// Open Quick Stock Adjust Modal
function openStockAdjustModal(bookId) {
    const book = appBooks.find(b => b.id === bookId);
    if (!book) return;

    const modal = document.getElementById('stock-adjust-modal');
    if (!modal) return;

    document.getElementById('stock-adjust-book-id').value = book.id;
    document.getElementById('stock-adjust-title').textContent = book.title;
    document.getElementById('stock-adjust-current').textContent = toKhmerNumber(book.quantity);
    document.getElementById('stock-adjust-amount').value = '';
    document.getElementById('stock-adjust-type').value = 'add';

    modal.classList.add('active');
}

// Handle Stock Adjustment Submit
function handleStockAdjustSubmit(e) {
    e.preventDefault();
    const bookId = document.getElementById('stock-adjust-book-id').value;
    const type = document.getElementById('stock-adjust-type').value;
    const amount = parseInt(document.getElementById('stock-adjust-amount').value, 10);

    if (isNaN(amount) || amount <= 0) {
        showToast('សូមបញ្ចូលចំនួនដែលត្រឹមត្រូវ!', 'danger');
        return;
    }

    const book = appBooks.find(b => b.id === bookId);
    if (!book) return;

    if (type === 'add') {
        book.quantity += amount;
        logActivity('បន្ថែមស្តុកសៀវភៅ', `បានបន្ថែម "${book.title}" ចំនួន +${toKhmerNumber(amount)} ក្បាលចូលស្តុក`, 'stock', 'package-plus');
    } else if (type === 'reduce') {
        if (book.quantity - amount < (book.borrowed || 0)) {
            showToast(`មិនអាចកាត់បន្ថយលើសចំនួនសៀវភៅដែលកំពុងខ្ចី (${toKhmerNumber(book.borrowed || 0)} ក្បាល) បានទេ!`, 'danger');
            return;
        }
        book.quantity = Math.max(0, book.quantity - amount);
        logActivity('កាត់ស្តុកសៀវភៅ', `បានកាត់ចេញ "${book.title}" ចំនួន -${toKhmerNumber(amount)} ក្បាល`, 'warning', 'package-minus');
    }

    persistAllData();
    closeAllModals();
    renderBooksTable();
    renderDashboard();
}

// Delete Book with check
function confirmDeleteBook(bookId) {
    const book = appBooks.find(b => b.id === bookId);
    if (!book) return;

    if (book.borrowed > 0) {
        showToast(`មិនអាចលុបបានទេ! សៀវភៅនេះកំពុងមានសិស្សខ្ចីចំនួន ${toKhmerNumber(book.borrowed)} ក្បាល។`, 'danger');
        return;
    }

    if (confirm(`តើលោកអ្នកពិតជាចង់លុបចំណងជើងសៀវភៅ "${book.title}" នេះចេញពីប្រព័ន្ធមែនទេ?`)) {
        const title = book.title;
        appBooks = appBooks.filter(b => b.id !== bookId);
        persistAllData();
        populateBookSubjectFilter();
        renderBooksTable();
        renderDashboard();
        logActivity('លុបសៀវភៅ', `បានលុបសៀវភៅ "${title}" ចេញពីប្រព័ន្ធ`, 'warning', 'trash-2');
    }
}
