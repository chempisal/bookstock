// Data Storage Keys
const BOOKS_KEY = 'tb_books';
const BORROWINGS_KEY = 'tb_borrowings';
const STUDENTS_KEY = 'tb_students';

// Khmer Translation Helpers
const khmerDigits = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
const khmerMonths = [
    "មករា", "កុម្ភៈ", "មីនា", "មេសា", "ឧសភា", "មិថុនា",
    "កក្កដា", "សីហា", "កញ្ញា", "តុលា", "វិច្ឆិកា", "ធ្នូ"
];

function toKhmerNumber(num) {
    if (num === null || num === undefined) return '';
    return String(num).replace(/[0-9]/g, w => khmerDigits[+w]);
}

function formatKhmerDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;

    const day = date.getDate();
    const month = khmerMonths[date.getMonth()];
    const year = date.getFullYear();

    return `${toKhmerNumber(day)} ${month} ${toKhmerNumber(year)}`;
}

// Sample Data
const DEFAULT_BOOKS = [
    { id: 'b1', title: 'គណិតវិទ្យា ថ្នាក់ទី ១២', subject: 'គណិតវិទ្យា', grade: '12', quantity: 80, borrowed: 15 },
    { id: 'b2', title: 'ភាសាខ្មែរ ថ្នាក់ទី ១២', subject: 'ភាសាខ្មែរ', grade: '12', quantity: 90, borrowed: 22 },
    { id: 'b3', title: 'រូបវិទ្យា ថ្នាក់ទី ១១', subject: 'រូបវិទ្យា', grade: '11', quantity: 65, borrowed: 8 },
    { id: 'b4', title: 'គីមីវិទ្យា ថ្នាក់ទី ១០', subject: 'គីមីវិទ្យា', grade: '10', quantity: 50, borrowed: 5 },
    { id: 'b5', title: 'ជីវវិទ្យា ថ្នាក់ទី ១២', subject: 'ជីវវិទ្យា', grade: '12', quantity: 70, borrowed: 30 },
    { id: 'b6', title: 'ប្រវត្តិវិទ្យា ថ្នាក់ទី ៩', subject: 'ប្រវត្តិវិទ្យា', grade: '9', quantity: 45, borrowed: 12 }
];

const DEFAULT_BORROWINGS = [
    {
        id: 'br1',
        studentName: 'សៅ ពិសិដ្ឋ',
        studentId: 'STD-1205',
        grade: '12',
        class: 'A',
        books: [
            { bookId: 'b1', returnDate: '', status: 'overdue' }
        ],
        borrowDate: '2026-07-01',
        dueDate: '2026-07-15',
        status: 'overdue'
    },
    {
        id: 'br2',
        studentName: 'គឹម ស៊ាង',
        studentId: 'STD-1209',
        grade: '12',
        class: 'B',
        books: [
            { bookId: 'b5', returnDate: '', status: 'borrowing' }
        ],
        borrowDate: '2026-07-10',
        dueDate: '2026-07-24',
        status: 'borrowing'
    },
    {
        id: 'br3',
        studentName: 'ចាន់ ស្រីនី',
        studentId: 'STD-1102',
        grade: '11',
        class: 'A',
        books: [
            { bookId: 'b3', returnDate: '2026-07-12', status: 'returned' }
        ],
        borrowDate: '2026-07-05',
        dueDate: '2026-07-19',
        status: 'returned'
    },
    {
        id: 'br4',
        studentName: 'ម៉ៅ សំណាង',
        studentId: 'STD-0914',
        grade: '9',
        class: 'C',
        books: [
            { bookId: 'b6', returnDate: '', status: 'borrowing' }
        ],
        borrowDate: '2026-07-12',
        dueDate: '2026-07-26',
        status: 'borrowing'
    }
];

const DEFAULT_STUDENTS = [
    { id: 'STD-1205', name: 'សៅ ពិសិដ្ឋ', gender: 'ប្រុស', grade: '12', class: 'A' },
    { id: 'STD-1209', name: 'គឹម ស៊ាង', gender: 'ប្រុស', grade: '12', class: 'B' },
    { id: 'STD-1102', name: 'ចាន់ ស្រីនី', gender: 'ស្រី', grade: '11', class: 'A' },
    { id: 'STD-0914', name: 'ម៉ៅ សំណាង', gender: 'ប្រុស', grade: '9', class: 'C' }
];

// App State
let books = [];
let borrowings = [];
let students = [];

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    // Check librarian authentication state
    checkAuthStatus();
    setupAuthListeners();

    loadData();
    checkOverdueBorrowings();
    setupNavigation();
    setupEventListeners();
    initGoogleSheetsSyncUi(); // Initialize Google Sheet inputs/labels

    // Initial Render if logged in
    if (isLibrarianLoggedIn()) {
        renderDashboard();
    }
    lucide.createIcons();
});

// Load data from LocalStorage and migrate if needed
function loadData() {
    const localBooks = localStorage.getItem(BOOKS_KEY);
    const localBorrowings = localStorage.getItem(BORROWINGS_KEY);
    const localStudents = localStorage.getItem(STUDENTS_KEY);

    if (localBooks) {
        books = JSON.parse(localBooks);
    } else {
        books = DEFAULT_BOOKS;
        localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
    }

    if (localStudents) {
        students = JSON.parse(localStudents);
    } else {
        students = DEFAULT_STUDENTS;
        localStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
    }

    if (localBorrowings) {
        borrowings = JSON.parse(localBorrowings);
        // Backwards compatibility migration (convert single bookId to books array)
        let migrated = false;
        borrowings.forEach(br => {
            if (!br.books) {
                br.books = [
                    {
                        bookId: br.bookId,
                        returnDate: br.returnDate || '',
                        status: br.status
                    }
                ];
                delete br.bookId;
                delete br.returnDate;
                migrated = true;
            }
        });
        if (migrated) {
            saveData();
        }
    } else {
        borrowings = DEFAULT_BORROWINGS;
        localStorage.setItem(BORROWINGS_KEY, JSON.stringify(borrowings));
    }

    // Refresh actual book borrow counts dynamically based on active borrowings
    recalculateBookBorrowedCounts();
}

// Calculate the actual count of borrowed copies from active borrowings
function recalculateBookBorrowedCounts() {
    // Reset borrow counts to 0
    books.forEach(b => b.borrowed = 0);

    // Sum active borrows
    borrowings.forEach(br => {
        br.books.forEach(item => {
            if (item.status !== 'returned') {
                const book = books.find(b => b.id === item.bookId);
                if (book) {
                    book.borrowed += 1;
                }
            }
        });
    });
    saveData();
}

// Save data to LocalStorage
function saveData() {
    localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
    localStorage.setItem(BORROWINGS_KEY, JSON.stringify(borrowings));
    localStorage.setItem(STUDENTS_KEY, JSON.stringify(students));

    // Auto-sync if enabled
    triggerAutoSync();
}

// Automatically check and update overdue status
function checkOverdueBorrowings() {
    const todayStr = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"
    let updated = false;

    borrowings.forEach(b => {
        let allReturned = true;
        let anyOverdue = false;

        b.books.forEach(item => {
            if (item.status !== 'returned') {
                allReturned = false;
                if (b.dueDate < todayStr) {
                    if (item.status !== 'overdue') {
                        item.status = 'overdue';
                        updated = true;
                    }
                    anyOverdue = true;
                } else {
                    if (item.status === 'overdue') {
                        item.status = 'borrowing';
                        updated = true;
                    }
                }
            }
        });

        // Determine overall transaction status
        let newStatus = 'borrowing';
        if (allReturned) {
            newStatus = 'returned';
        } else if (anyOverdue) {
            newStatus = 'overdue';
        }

        if (b.status !== newStatus) {
            b.status = newStatus;
            updated = true;
        }
    });

    if (updated) {
        saveData();
    }
}

// Setup View Switching Navigation
function setupNavigation() {
    const menuItems = document.querySelectorAll('.menu-item');
    const sections = document.querySelectorAll('.view-section');
    const pageTitle = document.getElementById('page-title');
    const quickBorrowBtn = document.getElementById('quick-borrow-btn');

    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const view = item.getAttribute('data-view');

            // Toggle active menu item class
            menuItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            // Toggle view section
            sections.forEach(section => {
                section.classList.remove('active');
                if (section.id === `view-${view}`) {
                    section.classList.add('active');
                }
            });

            // Update Page title & Actions
            switch (view) {
                case 'dashboard':
                    pageTitle.textContent = 'ផ្ទាំងគ្រប់គ្រង';
                    quickBorrowBtn.style.display = 'inline-flex';
                    renderDashboard();
                    break;
                case 'books':
                    pageTitle.textContent = 'គ្រប់គ្រងសៀវភៅសិក្សាគោល';
                    quickBorrowBtn.style.display = 'none';
                    renderBooks();
                    break;
                case 'borrowings':
                    pageTitle.textContent = 'កត់ត្រាការខ្ចី និងសងសៀវភៅ';
                    quickBorrowBtn.style.display = 'none';
                    renderBorrowings();
                    break;
                case 'students':
                    pageTitle.textContent = 'បញ្ជីឈ្មោះសិស្សសិក្សា';
                    quickBorrowBtn.style.display = 'none';
                    renderStudents();
                    break;
                case 'reports':
                    pageTitle.textContent = 'បោះពុម្ភរបាយការណ៍សិស្សខ្ចី';
                    quickBorrowBtn.style.display = 'none';
                    initReportPage();
                    break;
            }
            lucide.createIcons();
        });
    });

    // Quick borrow button on header
    quickBorrowBtn.addEventListener('click', () => {
        openBorrowModal();
    });

    // View All link in Dashboard
    document.getElementById('view-all-borrowings').addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelector('[data-view="borrowings"]').click();
    });
}

// Setup Modal & Action Event Listeners
function setupEventListeners() {
    // Modals open
    document.getElementById('add-book-btn').addEventListener('click', () => openBookModal());
    document.getElementById('new-borrow-btn').addEventListener('click', () => openBorrowModal());
    document.getElementById('add-student-btn').addEventListener('click', () => openStudentModal());

    // Modals close
    document.getElementById('book-modal-close').addEventListener('click', () => closeModals());
    document.getElementById('borrow-modal-close').addEventListener('click', () => closeModals());
    document.getElementById('return-modal-close').addEventListener('click', () => closeModals());
    document.getElementById('student-modal-close').addEventListener('click', () => closeModals());

    document.querySelectorAll('.modal-cancel-btn').forEach(btn => {
        btn.addEventListener('click', () => closeModals());
    });

    // Click outside modal to close
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModals();
        }
    });

    // Forms Submissions
    document.getElementById('book-form').addEventListener('submit', handleBookSubmit);
    document.getElementById('borrow-form').addEventListener('submit', handleBorrowSubmit);
    document.getElementById('return-form').addEventListener('submit', handleReturnSubmit);
    document.getElementById('student-form').addEventListener('submit', handleStudentSubmit);

    // Filter Listeners
    document.getElementById('book-search').addEventListener('input', renderBooks);
    document.getElementById('book-grade-filter').addEventListener('change', renderBooks);

    document.getElementById('borrow-search').addEventListener('input', renderBorrowings);
    document.getElementById('borrow-status-filter').addEventListener('change', renderBorrowings);

    document.getElementById('student-search').addEventListener('input', renderStudents);
    document.getElementById('student-grade-filter').addEventListener('change', renderStudents);

    // Excel Export / Import operations for Students
    document.getElementById('export-students-btn').addEventListener('click', exportStudentsToExcel);
    document.getElementById('import-students-file').addEventListener('change', importStudentsFromExcel);

    // Auto-fill student fields in Borrow Modal
    document.getElementById('borrow-student-select').addEventListener('change', (e) => {
        const studentId = e.target.value;
        const nameInput = document.getElementById('borrow-student-name');
        const idInput = document.getElementById('borrow-student-id');
        const gradeSelect = document.getElementById('borrow-grade');
        const classInput = document.getElementById('borrow-class');

        if (!studentId) {
            // Clear inputs for manual entry
            nameInput.value = '';
            idInput.value = '';
            gradeSelect.value = '';
            classInput.value = '';
        } else {
            const student = students.find(s => s.id === studentId);
            if (student) {
                nameInput.value = student.name;
                idInput.value = student.id;
                gradeSelect.value = student.grade;
                classInput.value = student.class;
            }
        }
    });

    // Report actions
    document.getElementById('preview-report-btn').addEventListener('click', renderReportPreview);
    document.getElementById('print-report-btn').addEventListener('click', triggerPrintReport);

    // Google Sheets Sync Listeners
    const webhookUrlInput = document.getElementById('sheet-webhook-url');
    if (webhookUrlInput) {
        webhookUrlInput.addEventListener('input', (e) => {
            localStorage.setItem('sheet_webhook_url', e.target.value.trim());
        });
    }

    const autoSyncCheck = document.getElementById('auto-sync-enable');
    if (autoSyncCheck) {
        autoSyncCheck.addEventListener('change', (e) => {
            localStorage.setItem('sheet_auto_sync', e.target.checked ? 'true' : 'false');
        });
    }

    const syncNowBtn = document.getElementById('sync-now-btn');
    if (syncNowBtn) {
        syncNowBtn.addEventListener('click', () => {
            syncWithGoogleSheets(true);
        });
    }
}

// Close All Modals
function closeModals() {
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
}

/* --------------------------------- DASHBOARD VIEW --------------------------------- */
function renderDashboard() {
    checkOverdueBorrowings();

    // Calculations
    const totalTypes = books.length;
    const totalCopies = books.reduce((sum, b) => sum + parseInt(b.quantity), 0);

    // Active borrow copies count = count of books currently checked out
    let activeBorrowCopies = 0;
    let overdueCopies = 0;

    borrowings.forEach(br => {
        br.books.forEach(item => {
            if (item.status !== 'returned') {
                activeBorrowCopies++;
                if (item.status === 'overdue') {
                    overdueCopies++;
                }
            }
        });
    });

    const availableCopies = totalCopies - activeBorrowCopies;

    // Update KPI UI
    document.getElementById('kpi-total-types').textContent = toKhmerNumber(totalTypes);
    document.getElementById('kpi-total-copies').textContent = toKhmerNumber(totalCopies);
    document.getElementById('kpi-borrowed-copies').textContent = toKhmerNumber(activeBorrowCopies);
    document.getElementById('kpi-available-copies').textContent = toKhmerNumber(availableCopies);
    document.getElementById('kpi-overdue').textContent = toKhmerNumber(overdueCopies);

    // Render Recent Activities (Max 5)
    const recentTable = document.getElementById('dashboard-recent-table');
    recentTable.innerHTML = '';

    // Sort borrowings by borrowDate descending
    const sorted = [...borrowings].sort((a, b) => new Date(b.borrowDate) - new Date(a.borrowDate)).slice(0, 5);

    if (sorted.length === 0) {
        recentTable.innerHTML = `<tr><td colspan="5" class="text-center" style="padding: 20px;">មិនទាន់មានសកម្មភាពខ្ចី-សងនៅឡើយទេ</td></tr>`;
    } else {
        sorted.forEach(br => {
            // Build text listing all books
            const booksTitles = br.books.map(item => {
                const book = books.find(b => b.id === item.bookId);
                return book ? book.title : 'មិនស្គាល់';
            }).join(', ');

            let statusBadge = '';
            if (br.status === 'borrowing') {
                statusBadge = `<span class="badge badge-warning">កំពុងខ្ចី</span>`;
            } else if (br.status === 'returned') {
                statusBadge = `<span class="badge badge-success">បានសងវិញ</span>`;
            } else {
                statusBadge = `<span class="badge badge-danger">ហួសកំណត់</span>`;
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${br.studentName}</strong></td>
                <td>ថ្នាក់ទី ${toKhmerNumber(br.grade)} (${br.class})</td>
                <td style="max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${booksTitles}</td>
                <td>${formatKhmerDate(br.borrowDate)}</td>
                <td>${statusBadge}</td>
            `;
            recentTable.appendChild(tr);
        });
    }

    // Render Grade Statistics list (Right panel)
    const statsContainer = document.getElementById('grade-stats-container');
    statsContainer.innerHTML = '';

    // Calculate book copies per grade levels
    const gradeCounts = {};
    // Seed grades 1-12
    for (let i = 1; i <= 12; i++) {
        gradeCounts[i] = 0;
    }

    books.forEach(b => {
        const gr = parseInt(b.grade);
        if (gr >= 1 && gr <= 12) {
            gradeCounts[gr] += parseInt(b.quantity);
        }
    });

    const maxCopies = Math.max(...Object.values(gradeCounts), 1);

    // Build html for grades that have books (or show some default grades)
    Object.keys(gradeCounts).forEach(grade => {
        const count = gradeCounts[grade];
        if (count > 0) {
            const percentage = (count / maxCopies) * 100;
            const item = document.createElement('div');
            item.className = 'grade-stat-item';
            item.innerHTML = `
                <div class="grade-label-row">
                    <span>ថ្នាក់ទី ${toKhmerNumber(grade)}</span>
                    <span>${toKhmerNumber(count)} ក្បាល</span>
                </div>
                <div class="grade-progress-bg">
                    <div class="grade-progress-bar" style="width: ${percentage}%"></div>
                </div>
            `;
            statsContainer.appendChild(item);
        }
    });

    if (statsContainer.children.length === 0) {
        statsContainer.innerHTML = '<p class="text-muted" style="text-align: center; padding: 20px 0;">គ្មានទិន្នន័យសៀវភៅសម្រាប់ស្ថិតិ</p>';
    }
}

/* --------------------------------- BOOKS VIEW --------------------------------- */
function renderBooks() {
    const searchVal = document.getElementById('book-search').value.toLowerCase();
    const gradeVal = document.getElementById('book-grade-filter').value;
    const tableBody = document.getElementById('books-table-body');
    tableBody.innerHTML = '';

    const filtered = books.filter(b => {
        const matchesSearch = b.title.toLowerCase().includes(searchVal) || b.subject.toLowerCase().includes(searchVal);
        const matchesGrade = gradeVal === '' || b.grade === gradeVal;
        return matchesSearch && matchesGrade;
    });

    if (filtered.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 30px; color: var(--text-muted);">គ្មានសៀវភៅដែលត្រូវគ្នានឹងការស្វែងរកឡើយ</td></tr>`;
        return;
    }

    filtered.forEach((b, index) => {
        const available = b.quantity - b.borrowed;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${toKhmerNumber(index + 1)}</td>
            <td><strong>${b.title}</strong></td>
            <td>${b.subject}</td>
            <td>ថ្នាក់ទី ${toKhmerNumber(b.grade)}</td>
            <td>${toKhmerNumber(b.quantity)}</td>
            <td><span style="${b.borrowed > 0 ? 'color: var(--accent); font-weight: bold;' : ''}">${toKhmerNumber(b.borrowed)}</span></td>
            <td><span style="${available > 0 ? 'color: var(--success); font-weight: bold;' : 'color: var(--danger); font-weight: bold;'}">${toKhmerNumber(available)}</span></td>
            <td class="actions-col">
                <div class="action-buttons">
                    <button class="btn btn-secondary btn-icon" onclick="editBook('${b.id}')" title="កែសម្រួល">
                        <i data-lucide="edit" style="width: 14px; height: 14px;"></i>
                    </button>
                    <button class="btn btn-danger btn-icon" onclick="deleteBook('${b.id}')" title="លុប">
                        <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
                    </button>
                </div>
            </td>
        `;
        tableBody.appendChild(tr);
    });
    lucide.createIcons();
}

// Open Add Book Modal
function openBookModal(bookId = null) {
    const modal = document.getElementById('book-modal');
    const titleEl = document.getElementById('book-modal-title');
    const form = document.getElementById('book-form');

    form.reset();
    document.getElementById('edit-book-id').value = '';

    if (bookId) {
        titleEl.textContent = 'កែសម្រួលព័ត៌មានសៀវភៅ';
        const book = books.find(b => b.id === bookId);
        if (book) {
            document.getElementById('edit-book-id').value = book.id;
            document.getElementById('book-title').value = book.title;
            document.getElementById('book-subject').value = book.subject;
            document.getElementById('book-grade').value = book.grade;
            document.getElementById('book-quantity').value = book.quantity;
        }
    } else {
        titleEl.textContent = 'បន្ថែមសៀវភៅថ្មី';
    }

    modal.classList.add('active');
}

// Handle Add/Edit Book Form Submit
function handleBookSubmit(e) {
    e.preventDefault();

    const id = document.getElementById('edit-book-id').value;
    const title = document.getElementById('book-title').value.trim();
    const subject = document.getElementById('book-subject').value.trim();
    const grade = document.getElementById('book-grade').value;
    const quantity = parseInt(document.getElementById('book-quantity').value);

    if (id) {
        // Edit Mode
        const book = books.find(b => b.id === id);
        if (book) {
            if (quantity < book.borrowed) {
                alert(`មិនអាចកំណត់ចំនួនសៀវភៅតិចជាងចំនួនដែលសិស្សកំពុងខ្ចី (${toKhmerNumber(book.borrowed)}) បានទេ!`);
                return;
            }
            book.title = title;
            book.subject = subject;
            book.grade = grade;
            book.quantity = quantity;
        }
    } else {
        // New Mode
        const newBook = {
            id: 'b' + (Date.now()),
            title,
            subject,
            grade,
            quantity,
            borrowed: 0
        };
        books.push(newBook);
    }

    saveData();
    closeModals();
    renderBooks();
}

// Delete Book
window.deleteBook = function (id) {
    const book = books.find(b => b.id === id);
    if (!book) return;

    if (book.borrowed > 0) {
        alert(`មិនអាចលុបសៀវភៅនេះបានទេ ព្រោះមានសិស្សកំពុងខ្ចីចំនួន ${toKhmerNumber(book.borrowed)} ក្បាល។`);
        return;
    }

    if (confirm(`តើអ្នកពិតជាចង់លុបសៀវភៅ "${book.title}" នេះមែនទេ?`)) {
        books = books.filter(b => b.id !== id);
        saveData();
        renderBooks();
    }
}

// Edit Book wrapper helper
window.editBook = function (id) {
    openBookModal(id);
}

/* --------------------------------- STUDENTS VIEW --------------------------------- */
function renderStudents() {
    const searchVal = document.getElementById('student-search').value.toLowerCase();
    const gradeVal = document.getElementById('student-grade-filter').value;
    const tableBody = document.getElementById('students-table-body');
    tableBody.innerHTML = '';

    const filtered = students.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(searchVal) || s.id.toLowerCase().includes(searchVal);
        const matchesGrade = gradeVal === '' || s.grade === gradeVal;
        return matchesSearch && matchesGrade;
    });

    if (filtered.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 30px; color: var(--text-muted);">គ្មានទិន្នន័យសិស្សដែលត្រូវគ្នានឹងការស្វែងរកឡើយ</td></tr>`;
        return;
    }

    filtered.forEach((s, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${toKhmerNumber(index + 1)}</td>
            <td><strong>${s.id}</strong></td>
            <td><strong>${s.name}</strong></td>
            <td>${s.gender}</td>
            <td>ថ្នាក់ទី ${toKhmerNumber(s.grade)}</td>
            <td>បន្ទប់ ${s.class}</td>
            <td class="actions-col">
                <div class="action-buttons">
                    <button class="btn btn-secondary btn-icon" onclick="editStudent('${s.id}')" title="កែសម្រួល">
                        <i data-lucide="edit" style="width: 14px; height: 14px;"></i>
                    </button>
                    <button class="btn btn-danger btn-icon" onclick="deleteStudent('${s.id}')" title="លុប">
                        <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
                    </button>
                </div>
            </td>
        `;
        tableBody.appendChild(tr);
    });
    lucide.createIcons();
}

// Open Student Add/Edit Modal
function openStudentModal(studentId = null) {
    const modal = document.getElementById('student-modal');
    const titleEl = document.getElementById('student-modal-title');
    const form = document.getElementById('student-form');

    form.reset();
    document.getElementById('edit-student-id-old').value = '';
    document.getElementById('student-id').disabled = false;

    if (studentId) {
        titleEl.textContent = 'កែសម្រួលព័ត៌មានសិស្ស';
        const student = students.find(s => s.id === studentId);
        if (student) {
            document.getElementById('edit-student-id-old').value = student.id;
            document.getElementById('student-id').value = student.id;
            document.getElementById('student-name').value = student.name;
            document.getElementById('student-gender').value = student.gender;
            document.getElementById('student-grade').value = student.grade;
            document.getElementById('student-class').value = student.class;
        }
    } else {
        titleEl.textContent = 'បន្ថែមសិស្សថ្មី';
    }

    modal.classList.add('active');
}

// Handle Student Submit
function handleStudentSubmit(e) {
    e.preventDefault();

    const idOld = document.getElementById('edit-student-id-old').value;
    const id = document.getElementById('student-id').value.trim();
    const name = document.getElementById('student-name').value.trim();
    const gender = document.getElementById('student-gender').value;
    const grade = document.getElementById('student-grade').value;
    const className = document.getElementById('student-class').value.trim();

    // Check duplication of ID for new students
    if (!idOld && students.some(s => s.id.toLowerCase() === id.toLowerCase())) {
        alert('អត្តសញ្ញាណសិស្ស (ID) នេះមានរួចរាល់ហើយ! សូមបញ្ចូលអត្តសញ្ញាណផ្សេង។');
        return;
    }

    if (idOld) {
        // Edit Mode
        const student = students.find(s => s.id === idOld);
        if (student) {
            student.id = id;
            student.name = name;
            student.gender = gender;
            student.grade = grade;
            student.class = className;
        }
    } else {
        // New Mode
        const newStudent = {
            id,
            name,
            gender,
            grade,
            class: className
        };
        students.push(newStudent);
    }

    saveData();
    closeModals();
    renderStudents();
}

// Delete Student
window.deleteStudent = function (id) {
    const student = students.find(s => s.id === id);
    if (!student) return;

    // Verify if student has active borrowings
    const hasActiveBorrowing = borrowings.some(br => br.studentId === id && br.status !== 'returned');
    if (hasActiveBorrowing) {
        alert(`មិនអាចលុបសិស្សនេះបានទេ ព្រោះសិស្សកំពុងខ្ចីសៀវភៅសិក្សានៅឡើយ!`);
        return;
    }

    if (confirm(`តើអ្នកពិតជាចង់លុបសិស្ស "${student.name}" នេះមែនទេ?`)) {
        students = students.filter(s => s.id !== id);
        saveData();
        renderStudents();
    }
}

window.editStudent = function (id) {
    openStudentModal(id);
}

/* ------------------ EXCEL EXPORT / IMPORT LOGIC ------------------ */

// Export Students to CSV (UTF-8 with BOM for Excel Khmer support)
function exportStudentsToExcel() {
    if (students.length === 0) {
        alert('គ្មានទិន្នន័យសិស្សសម្រាប់នាំចេញទេ!');
        return;
    }

    const headers = ['អត្តសញ្ញាណសិស្ស (Student ID)', 'ឈ្មោះសិស្ស (Student Name)', 'ភេទ (Gender)', 'ថ្នាក់ទី (Grade)', 'បន្ទប់/ថ្នាក់កូដ (Class)'];

    const csvRows = [];
    csvRows.push(headers.join(','));

    students.forEach(s => {
        const row = [
            `"${s.id.replace(/"/g, '""')}"`,
            `"${s.name.replace(/"/g, '""')}"`,
            `"${s.gender}"`,
            `"${s.grade}"`,
            `"${s.class.replace(/"/g, '""')}"`
        ];
        csvRows.push(row.join(','));
    });

    const BOM = '\uFEFF'; // UTF-8 Byte Order Mark for Excel
    const csvContent = BOM + csvRows.join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'បញ្ជីឈ្មោះសិស្ស_សៀវភៅសិក្សាគោល.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Import Students from CSV Excel format
function importStudentsFromExcel(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (evt) {
        const text = evt.target.result;
        const parsedRows = parseCSV(text);

        if (parsedRows.length <= 1) {
            alert('ឯកសារគ្មានទិន្នន័យ ឬខុសទម្រង់ដែលត្រូវនាំចូល!');
            return;
        }

        // Header check (skip index 0)
        let newCount = 0;
        let duplicateCount = 0;

        for (let i = 1; i < parsedRows.length; i++) {
            const row = parsedRows[i];
            if (row.length < 4) continue; // Skip incomplete lines

            const id = row[0].replace(/"/g, '').trim();
            const name = row[1].replace(/"/g, '').trim();
            const gender = row[2].replace(/"/g, '').trim();
            const grade = row[3].replace(/"/g, '').trim();
            const className = row[4] ? row[4].replace(/"/g, '').trim() : '';

            if (!id || !name || !gender || !grade) continue; // Skip if mandatory details are missing

            // Check if student already exists by ID (skip duplicate IDs)
            const exists = students.some(s => s.id.toLowerCase() === id.toLowerCase());
            if (exists) {
                duplicateCount++;
                continue;
            }

            students.push({
                id,
                name,
                gender,
                grade,
                class: className
            });
            newCount++;
        }

        saveData();
        renderStudents();
        alert(`នាំចូលទិន្នន័យជោគជ័យ!\n- បន្ថែមថ្មី៖ ${toKhmerNumber(newCount)} នាក់\n- ស្ទួនអត្តសញ្ញាណ (មិនបញ្ចូល)៖ ${toKhmerNumber(duplicateCount)} នាក់`);

        // Reset file input
        e.target.value = '';
    };

    reader.readAsText(file, 'UTF-8');
}

// Helper: Custom CSV Line Parser
function parseCSV(text) {
    const lines = text.split(/\r?\n/);
    return lines.map(line => {
        const result = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current.trim());
        return result;
    }).filter(row => row.length > 0 && row[0] !== '');
}

/* --------------------------------- BORROWINGS VIEW --------------------------------- */
function renderBorrowings() {
    const searchVal = document.getElementById('borrow-search').value.toLowerCase();
    const statusVal = document.getElementById('borrow-status-filter').value;
    const tableBody = document.getElementById('borrowings-table-body');
    tableBody.innerHTML = '';

    const filtered = borrowings.filter(br => {
        const studentName = br.studentName.toLowerCase();
        const studentId = br.studentId ? br.studentId.toLowerCase() : '';

        // Search matches student details or any of the books they borrowed
        let matchesBookTitle = false;
        br.books.forEach(item => {
            const book = books.find(b => b.id === item.bookId);
            if (book && book.title.toLowerCase().includes(searchVal)) {
                matchesBookTitle = true;
            }
        });

        const matchesSearch = studentName.includes(searchVal) || studentId.includes(searchVal) || matchesBookTitle;
        const matchesStatus = statusVal === '' || br.status === statusVal;

        return matchesSearch && matchesStatus;
    });

    if (filtered.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="9" style="text-align: center; padding: 30px; color: var(--text-muted);">គ្មានទិន្នន័យខ្ចី-សងដែលត្រូវគ្នានឹងការស្វែងរកឡើយ</td></tr>`;
        return;
    }

    // Sort by borrowDate descending
    filtered.sort((a, b) => new Date(b.borrowDate) - new Date(a.borrowDate));

    filtered.forEach((br, index) => {

        // Build books column HTML with status badges per book
        let booksHtml = br.books.map(item => {
            const bookObj = books.find(bk => bk.id === item.bookId);
            const title = bookObj ? bookObj.title : 'មិនស្គាល់';
            let badgeColor = '#d97706'; // warning orange
            let badgeText = 'កំពុងខ្ចី';
            if (item.status === 'returned') {
                badgeColor = '#059669'; // success green
                badgeText = 'បានសង';
            } else if (item.status === 'overdue') {
                badgeColor = '#dc2626'; // danger red
                badgeText = 'ហួសកំណត់';
            }
            return `<div style="margin-bottom: 6px; font-size: 13px;">
                <span style="font-weight: 500;">${title}</span> 
                <span style="font-size: 10px; padding: 2px 8px; border-radius: 9999px; background-color: ${badgeColor}15; color: ${badgeColor}; font-weight: bold; margin-left: 4px;">${badgeText}</span>
            </div>`;
        }).join('');

        let statusBadge = '';
        let actionButtons = '';

        if (br.status === 'borrowing') {
            statusBadge = `<span class="badge badge-warning">កំពុងខ្ចី</span>`;
            actionButtons = `
                <button class="btn btn-success btn-icon" onclick="openReturnModal('${br.id}')" title="ប្រគល់សៀវភៅសង">
                    <i data-lucide="check" style="width: 14px; height: 14px;"></i>
                    <span style="font-size: 11px; font-weight: normal; margin-left: 2px;">សងវិញ</span>
                </button>
            `;
        } else if (br.status === 'returned') {
            statusBadge = `<span class="badge badge-success">បានសងវិញ</span>`;

            // Get return dates
            const returnDates = br.books.map(b => b.returnDate).filter(d => d);
            const latestReturnDate = returnDates.length > 0 ? returnDates.sort().reverse()[0] : '';

            actionButtons = `<span style="font-size: 11px; color: var(--text-muted);">បានសង (${formatKhmerDate(latestReturnDate)})</span>`;
        } else {
            statusBadge = `<span class="badge badge-danger">ហួសកំណត់</span>`;
            actionButtons = `
                <button class="btn btn-success btn-icon" onclick="openReturnModal('${br.id}')" title="ប្រគល់សៀវភៅសង">
                    <i data-lucide="check" style="width: 14px; height: 14px;"></i>
                    <span style="font-size: 11px; font-weight: normal; margin-left: 2px;">សងវិញ</span>
                </button>
            `;
        }

        // Print receipt action icon always available
        const printBtn = `
            <button class="btn btn-secondary btn-icon" onclick="printBorrowReceipt('${br.id}')" title="បោះពុម្ភបង្កាន់ដៃ">
                <i data-lucide="printer" style="width: 14px; height: 14px;"></i>
            </button>
        `;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${toKhmerNumber(index + 1)}</td>
            <td><strong>${br.studentName}</strong></td>
            <td>${br.studentId ? toKhmerNumber(br.studentId) : '-'}</td>
            <td>ថ្នាក់ទី ${toKhmerNumber(br.grade)} (${br.class})</td>
            <td style="padding-top: 10px; padding-bottom: 10px;">${booksHtml}</td>
            <td>${formatKhmerDate(br.borrowDate)}</td>
            <td>${formatKhmerDate(br.dueDate)}</td>
            <td>${statusBadge}</td>
            <td class="actions-col">
                <div class="action-buttons">
                    ${actionButtons}
                    <button class="btn btn-secondary btn-icon" onclick="editBorrowing('${br.id}')" title="កែសម្រួលការខ្ចី">
                        <i data-lucide="edit" style="width: 14px; height: 14px;"></i>
                    </button>
                    ${printBtn}
                    <button class="btn btn-danger btn-icon" onclick="deleteBorrowing('${br.id}')" title="លុបចោល">
                        <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
                    </button>
                </div>
            </td>
        `;
        tableBody.appendChild(tr);
    });
    lucide.createIcons();
}

// Open Borrow Modal
function openBorrowModal(borrowingId = null) {
    const modal = document.getElementById('borrow-modal');
    const form = document.getElementById('borrow-form');
    const titleEl = document.getElementById('borrow-modal-title');
    form.reset();

    const br = borrowingId ? borrowings.find(b => b.id === borrowingId) : null;
    document.getElementById('edit-borrowing-id').value = borrowingId || '';

    if (br) {
        titleEl.textContent = 'កែតម្រូវការខ្ចីសៀវភៅ';
        document.getElementById('borrow-student-name').value = br.studentName;
        document.getElementById('borrow-student-id').value = br.studentId || '';
        document.getElementById('borrow-grade').value = br.grade;
        document.getElementById('borrow-class').value = br.class;
        document.getElementById('borrow-date').value = br.borrowDate;
        document.getElementById('borrow-due-date').value = br.dueDate;
    } else {
        titleEl.textContent = 'កត់ត្រាការខ្ចីសៀវភៅ';

        // Set default dates: borrowDate = today, dueDate = today + 14 days
        const today = new Date();
        const dueDate = new Date();
        dueDate.setDate(today.getDate() + 14); // Default 2 weeks
        document.getElementById('borrow-date').value = today.toISOString().split('T')[0];
        document.getElementById('borrow-due-date').value = dueDate.toISOString().split('T')[0];
    }

    // Populate registered student options in dropdown selection
    const studentSelect = document.getElementById('borrow-student-select');
    studentSelect.innerHTML = '<option value="">-- បញ្ចូលព័ត៌មានដោយដៃ ឬជ្រើសរើសសិស្ស --</option>';
    students.sort((a, b) => a.name.localeCompare(b.name)).forEach(s => {
        const selectedAttr = (br && br.studentId === s.id) ? 'selected' : '';
        studentSelect.innerHTML += `<option value="${s.id}" ${selectedAttr}>${s.name} (ថ្នាក់ទី ${toKhmerNumber(s.grade)}${s.class} - ID: ${s.id})</option>`;
    });

    // Populate book options as checkboxes list
    const booksContainer = document.getElementById('borrow-books-list');
    booksContainer.innerHTML = '';

    if (books.length === 0) {
        booksContainer.innerHTML = '<p style="color: var(--text-muted); font-size: 13px; text-align: center;">គ្មានសៀវភៅសិក្សាគោលក្នុងស្តុកទេ</p>';
    } else {
        books.forEach(b => {
            const isAlreadyBorrowed = br ? br.books.some(item => item.bookId === b.id) : false;
            const alreadyBorrowedObj = br ? br.books.find(item => item.bookId === b.id) : null;
            const countThisStudentHas = (isAlreadyBorrowed && alreadyBorrowedObj.status !== 'returned') ? 1 : 0;

            const available = b.quantity - b.borrowed + countThisStudentHas;
            const disabledAttr = (available <= 0 && !isAlreadyBorrowed) ? 'disabled' : '';
            const checkedAttr = isAlreadyBorrowed ? 'checked' : '';
            const textStyle = (available <= 0 && !isAlreadyBorrowed) ? 'color: var(--text-muted); text-decoration: line-through;' : '';
            const titleStr = `${b.title} (ថ្នាក់ទី ${toKhmerNumber(b.grade)} | សល់៖ ${toKhmerNumber(available)} ក្បាល)`;

            booksContainer.innerHTML += `
                <label style="display: flex; align-items: center; gap: 10px; font-size: 13px; cursor: pointer; user-select: none; padding: 4px 0;">
                    <input type="checkbox" name="borrow_books" value="${b.id}" ${disabledAttr} ${checkedAttr} style="width: 16px; height: 16px; cursor: pointer;">
                    <span style="${textStyle}">${titleStr}</span>
                </label>
            `;
        });
    }

    modal.classList.add('active');
}

// Handle Borrow Submit
function handleBorrowSubmit(e) {
    e.preventDefault();

    const id = document.getElementById('edit-borrowing-id').value;
    const studentName = document.getElementById('borrow-student-name').value.trim();
    const studentId = document.getElementById('borrow-student-id').value.trim();
    const grade = document.getElementById('borrow-grade').value;
    const className = document.getElementById('borrow-class').value.trim();
    const borrowDate = document.getElementById('borrow-date').value;
    const dueDate = document.getElementById('borrow-due-date').value;

    // Get all selected books checked in the list
    const checkedBoxes = document.querySelectorAll('input[name="borrow_books"]:checked');
    if (checkedBoxes.length === 0) {
        alert('សូមជ្រើសរើសសៀវភៅសិក្សាគោលយ៉ាងហោចណាស់ ១ ក្បាល!');
        return;
    }

    // Revert old book counts if in Edit mode
    let oldBooks = [];
    if (id) {
        const br = borrowings.find(b => b.id === id);
        if (br) {
            oldBooks = br.books;
            oldBooks.forEach(item => {
                if (item.status !== 'returned') {
                    const book = books.find(b => b.id === item.bookId);
                    if (book) {
                        book.borrowed = Math.max(0, book.borrowed - 1);
                    }
                }
            });
        }
    }

    const selectedBooks = [];
    let stockValid = true;
    let outOfStockBookTitle = '';

    checkedBoxes.forEach(cb => {
        const bookId = cb.value;
        const book = books.find(b => b.id === bookId);
        if (book) {
            const available = book.quantity - book.borrowed;
            if (available <= 0) {
                stockValid = false;
                outOfStockBookTitle = book.title;
            } else {
                const oldItem = oldBooks.find(item => item.bookId === bookId);
                if (oldItem) {
                    // Keep status and returnDate of previously borrowed books
                    selectedBooks.push({
                        bookId: book.id,
                        returnDate: oldItem.returnDate || '',
                        status: oldItem.status || 'borrowing'
                    });

                    if (oldItem.status !== 'returned') {
                        book.borrowed += 1;
                    }
                } else {
                    // Brand new book added to transaction
                    selectedBooks.push({
                        bookId: book.id,
                        returnDate: '',
                        status: 'borrowing'
                    });
                    book.borrowed += 1;
                }
            }
        }
    });

    if (!stockValid) {
        // Rollback the revert if stock check fails
        if (id) {
            oldBooks.forEach(item => {
                if (item.status !== 'returned') {
                    const book = books.find(b => b.id === item.bookId);
                    if (book) {
                        book.borrowed += 1;
                    }
                }
            });
        }
        alert(`សៀវភៅ "${outOfStockBookTitle}" ត្រូវបានខ្ចីអស់ពីស្តុកហើយ! សូមជ្រើសរើសសៀវភៅផ្សេងទៀត។`);
        return;
    }

    if (id) {
        // Edit Mode
        const br = borrowings.find(b => b.id === id);
        if (br) {
            br.studentName = studentName;
            br.studentId = studentId;
            br.grade = grade;
            br.class = className;
            br.books = selectedBooks;
            br.borrowDate = borrowDate;
            br.dueDate = dueDate;
        }
    } else {
        // New Mode
        const newBorrow = {
            id: 'br' + Date.now(),
            studentName,
            studentId,
            grade,
            class: className,
            books: selectedBooks,
            borrowDate,
            dueDate,
            status: 'borrowing'
        };
        borrowings.push(newBorrow);
    }

    saveData();
    checkOverdueBorrowings();
    closeModals();

    // Refresh active section rendering
    const activeSection = document.querySelector('.view-section.active');
    if (activeSection.id === 'view-dashboard') {
        renderDashboard();
    } else if (activeSection.id === 'view-borrowings') {
        renderBorrowings();
    }

    // Ask user if they want to print receipt immediately
    if (confirm('តើអ្នកចង់បោះពុម្ភបង្កាន់ដៃខ្ចីសៀវភៅនេះឥឡូវនេះដែរឬទេ?')) {
        const printId = id || ('br' + Date.now()); // Fallback or current id
        printBorrowReceipt(id || borrowings[borrowings.length - 1].id);
    }
}

// Open Return Books Modal
window.openReturnModal = function (id) {
    const br = borrowings.find(b => b.id === id);
    if (!br) return;

    document.getElementById('return-borrowing-id').value = br.id;
    document.getElementById('return-student-name-label').textContent = `${br.studentName} (ថ្នាក់ទី ${toKhmerNumber(br.grade)}${br.class})`;

    const returnContainer = document.getElementById('return-books-list');
    returnContainer.innerHTML = '';

    let activeBorrowsCount = 0;
    br.books.forEach(item => {
        if (item.status !== 'returned') {
            activeBorrowsCount++;
            const book = books.find(b => b.id === item.bookId);
            const title = book ? book.title : 'មិនស្គាល់សៀវភៅ';
            const statusLabel = item.status === 'overdue' ? 'ហួសកំណត់' : 'កំពុងខ្ចី';
            const colorStyle = item.status === 'overdue' ? 'color: var(--danger);' : '';

            returnContainer.innerHTML += `
                <label style="display: flex; align-items: center; gap: 10px; font-size: 13px; cursor: pointer; user-select: none; padding: 4px 0; ${colorStyle}">
                    <input type="checkbox" name="return_books" value="${item.bookId}" checked style="width: 16px; height: 16px; cursor: pointer;">
                    <span>${title} (${statusLabel})</span>
                </label>
            `;
        }
    });

    if (activeBorrowsCount === 0) {
        alert('សិស្សនេះបានសងសៀវភៅទាំងអស់រួចរាល់ហើយ!');
        return;
    }

    const modal = document.getElementById('return-modal');
    modal.classList.add('active');
}

// Handle Return Form submission
function handleReturnSubmit(e) {
    e.preventDefault();

    const borrowingId = document.getElementById('return-borrowing-id').value;
    const br = borrowings.find(b => b.id === borrowingId);
    if (!br) return;

    const checkedBoxes = document.querySelectorAll('input[name="return_books"]:checked');
    if (checkedBoxes.length === 0) {
        alert('សូមជ្រើសរើសសៀវភៅយ៉ាងហោចណាស់ ១ ក្បាលដើម្បីប្រគល់សង!');
        return;
    }

    const todayStr = new Date().toISOString().split('T')[0];

    checkedBoxes.forEach(cb => {
        const bookId = cb.value;
        const item = br.books.find(item => item.bookId === bookId && item.status !== 'returned');
        if (item) {
            item.status = 'returned';
            item.returnDate = todayStr;

            // Reduce book's borrowed inventory count
            const book = books.find(b => b.id === bookId);
            if (book) {
                book.borrowed = Math.max(0, book.borrowed - 1);
            }
        }
    });

    saveData();
    checkOverdueBorrowings();
    closeModals();
    renderBorrowings();
}

// Print Individual Student Borrowing Receipt
window.printBorrowReceipt = function (id) {
    const br = borrowings.find(b => b.id === id);
    if (!br) return;

    // Populate Print Receipt Template metadata elements
    const receiptIdEl = document.getElementById('pr-receipt-id');
    const studentNameEl = document.getElementById('pr-student-name');
    const studentIdEl = document.getElementById('pr-student-id');
    const studentGradeEl = document.getElementById('pr-student-grade');
    const studentClassEl = document.getElementById('pr-student-class');
    const prStatusEl = document.getElementById('pr-status');

    if (receiptIdEl) receiptIdEl.textContent = '#' + toKhmerNumber(br.id.replace('br', ''));
    if (studentNameEl) studentNameEl.textContent = br.studentName;
    if (studentIdEl) studentIdEl.textContent = br.studentId ? toKhmerNumber(br.studentId) : '-';
    if (studentGradeEl) studentGradeEl.textContent = toKhmerNumber(br.grade);
    if (studentClassEl) studentClassEl.textContent = br.class;

    let statusText = '';
    if (br.status === 'borrowing') statusText = 'កំពុងខ្ចី';
    else if (br.status === 'returned') statusText = 'បានសងវិញទាំងអស់';
    else statusText = 'មានហួសកំណត់សង';
    if (prStatusEl) prStatusEl.textContent = statusText;

    // Populated table body for print receipt
    const tbody = document.querySelector('#print-receipt-area tbody');
    if (tbody) {
        tbody.innerHTML = '';

        br.books.forEach(item => {
            const book = books.find(b => b.id === item.bookId);
            const title = book ? book.title : 'មិនស្គាល់សៀវភៅ';
            tbody.innerHTML += `
                <tr>
                    <td>${title}</td>
                    <td>${formatKhmerDate(br.borrowDate)}</td>
                    <td>${formatKhmerDate(br.dueDate)}</td>
                    <td>${item.returnDate ? formatKhmerDate(item.returnDate) : '-'}</td>
                </tr>
            `;
        });
    }

    // Print routine
    document.body.classList.add('printing-receipt');
    window.print();

    // Cleanup printing setup class
    window.addEventListener('afterprint', () => {
        document.body.classList.remove('printing-receipt');
    }, { once: true });

    // Fallback timer if afterprint doesn't fire nicely
    setTimeout(() => {
        document.body.classList.remove('printing-receipt');
    }, 1000);
}

/* --------------------------------- REPORTS VIEW --------------------------------- */
function initReportPage() {
    // Leave date inputs empty by default to show all borrowings (all time)
    document.getElementById('report-start-date').value = '';
    document.getElementById('report-end-date').value = '';

    // Generate immediate preview
    renderReportPreview();
}

function renderReportPreview() {
    const gradeFilter = document.getElementById('report-grade').value;
    const statusFilter = document.getElementById('report-status').value;
    const startDate = document.getElementById('report-start-date').value;
    const endDate = document.getElementById('report-end-date').value;

    const tableBody = document.getElementById('print-report-table-body');
    tableBody.innerHTML = '';

    // Filter borrowings
    const filtered = borrowings.filter(br => {
        const matchesGrade = gradeFilter === '' || br.grade === gradeFilter;

        // Match overall borrowing transaction status or if any book has this status
        let matchesStatus = false;
        if (statusFilter === '') {
            matchesStatus = true;
        } else {
            br.books.forEach(item => {
                if (item.status === statusFilter) {
                    matchesStatus = true;
                }
            });
        }

        let matchesDates = true;
        if (startDate) matchesDates = matchesDates && br.borrowDate >= startDate;
        if (endDate) matchesDates = matchesDates && br.borrowDate <= endDate;

        return matchesGrade && matchesStatus && matchesDates;
    });

    // Update document date to Khmer format
    const currentKhmerDateEl = document.querySelector('.current-date-khmer');
    if (currentKhmerDateEl) {
        currentKhmerDateEl.textContent = formatKhmerDate(new Date().toISOString().split('T')[0]);
    }

    // Update Subtitle in report
    const subtitleEl = document.getElementById('report-filter-subtitle');
    let gradeLabel = gradeFilter ? `ថ្នាក់ទី ${toKhmerNumber(gradeFilter)}` : 'ទាំងអស់';
    let statusLabel = 'ទាំងអស់';
    if (statusFilter === 'borrowing') statusLabel = 'កំពុងខ្ចី';
    else if (statusFilter === 'returned') statusLabel = 'បានសងវិញ';
    else if (statusFilter === 'overdue') statusLabel = 'ហួសកំណត់';

    subtitleEl.textContent = `កម្រិតថ្នាក់៖ ${gradeLabel} | ស្ថានភាព៖ ${statusLabel}`;

    // Loop through filtered listings and list each student as a single row containing all their borrowed textbooks
    let printIndex = 1;
    filtered.sort((a, b) => new Date(a.borrowDate) - new Date(b.borrowDate)); // chronological

    filtered.forEach((br) => {
        // Filter books of this borrowing that match the statusFilter
        const matchedBooks = br.books.filter(item => {
            if (statusFilter === '') return true;
            return item.status === statusFilter;
        });

        // If no books match the filter, skip rendering this student entirely
        if (matchedBooks.length === 0) return;

        // Build books column HTML with status labels
        const booksHtml = matchedBooks.map(item => {
            const bookObj = books.find(b => b.id === item.bookId);
            const bookTitle = bookObj ? bookObj.title : 'មិនស្គាល់សៀវភៅ';

            let statusKhmer = 'កំពុងខ្ចី';
            if (item.status === 'returned') statusKhmer = `បានសង (${formatKhmerDate(item.returnDate)})`;
            else if (item.status === 'overdue') statusKhmer = 'ហួសកំណត់';

            return `• ${bookTitle} <span style="font-size: 10px; color: var(--text-muted); font-weight: normal;">(${statusKhmer})</span>`;
        }).join('<br>');

        // Overall status label
        let overallStatus = 'កំពុងខ្ចី';
        if (br.status === 'returned') overallStatus = 'បានសងវិញទាំងអស់';
        else if (br.status === 'overdue') overallStatus = 'មានហួសកំណត់';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="text-align: center;">${toKhmerNumber(printIndex++)}</td>
            <td><strong>${br.studentName}</strong></td>
            <td style="text-align: center;">ថ្នាក់ទី ${toKhmerNumber(br.grade)} (${br.class})</td>
            <td style="line-height: 1.6; padding: 8px 12px;">${booksHtml}</td>
            <td style="text-align: center;">${formatKhmerDate(br.borrowDate)}</td>
            <td style="text-align: center;">${formatKhmerDate(br.dueDate)}</td>
            <td style="text-align: center;">${overallStatus}</td>
        `;
        tableBody.appendChild(tr);
    });

    if (printIndex === 1) {
        tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 20px;">គ្មានទិន្នន័យសិស្សខ្ចីតាមតម្រងកំណត់ឡើយ</td></tr>`;
    }
}

function triggerPrintReport() {
    renderReportPreview(); // Refresh preview details
    window.print(); // Trigger browsers print dialog
}

// Edit Borrowing Record
window.editBorrowing = function (id) {
    openBorrowModal(id);
}

// Delete Borrowing Record
window.deleteBorrowing = function (id) {
    const br = borrowings.find(b => b.id === id);
    if (!br) return;

    if (confirm(`តើអ្នកពិតជាចង់លុបចោលការខ្ចីរបស់សិស្ស "${br.studentName}" នេះមែនទេ?\n(សៀវភៅដែលសិស្សមិនទាន់សង នឹងត្រូវបង្វិលចូលស្តុកវិញដោយស្វ័យប្រវត្ត)`)) {
        // Revert book counts for any books that haven't been returned
        br.books.forEach(item => {
            if (item.status !== 'returned') {
                const book = books.find(b => b.id === item.bookId);
                if (book) {
                    book.borrowed = Math.max(0, book.borrowed - 1);
                }
            }
        });

        // Filter out this borrowing
        borrowings = borrowings.filter(b => b.id !== id);
        saveData();

        // Refresh active views
        const activeSection = document.querySelector('.view-section.active');
        if (activeSection.id === 'view-dashboard') {
            renderDashboard();
        } else if (activeSection.id === 'view-borrowings') {
            renderBorrowings();
        }
    }
}

/* ------------------ GOOGLE SHEETS SYNC LOGIC ------------------ */

// Initialize UI values from LocalStorage
function initGoogleSheetsSyncUi() {
    const webhookUrlInput = document.getElementById('sheet-webhook-url');
    const autoSyncCheck = document.getElementById('auto-sync-enable');
    const statusLabel = document.getElementById('sync-status-label');

    if (webhookUrlInput) {
        webhookUrlInput.value = localStorage.getItem('sheet_webhook_url') || '';
    }
    if (autoSyncCheck) {
        autoSyncCheck.checked = localStorage.getItem('sheet_auto_sync') === 'true';
    }
    if (statusLabel) {
        const lastSync = localStorage.getItem('sheet_last_sync');
        if (lastSync) {
            statusLabel.textContent = `សមកាលកម្មចុងក្រោយ៖ ${lastSync}`;
            statusLabel.style.color = 'var(--success)';
        } else {
            statusLabel.textContent = 'ស្ថានភាព៖ មិនទាន់ភ្ជាប់';
            statusLabel.style.color = 'var(--text-muted)';
        }
    }
}

// Perform POST request to sync data with Google Sheet Web App
function syncWithGoogleSheets(manual = false) {
    const url = localStorage.getItem('sheet_webhook_url') || '';
    const statusLabel = document.getElementById('sync-status-label');
    const syncBtn = document.getElementById('sync-now-btn');

    if (!url) {
        if (manual) {
            alert('សូមបញ្ចូលតំណភ្ជាប់ Google Sheet Web App URL ជាមុនសិន!');
        }
        return;
    }

    // Update status in UI to indicate syncing
    if (statusLabel) {
        statusLabel.textContent = 'ស្ថានភាព៖ កំពុងសមកាលកម្ម...';
        statusLabel.style.color = 'var(--accent)';
    }
    if (syncBtn) {
        syncBtn.disabled = true;
        const icon = syncBtn.querySelector('i');
        if (icon) icon.classList.add('spin');
    }

    // Build payload containing textbooks, students and borrowings
    const payload = {
        books: books,
        students: students,
        borrowings: borrowings
    };

    // Make POST request using text/plain content-type to avoid CORS preflight options check
    fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
            'Content-Type': 'text/plain'
        },
        body: JSON.stringify(payload)
    })
        .then(() => {
            const now = new Date();
            const dateString = now.toLocaleDateString('sv') + ' ' + now.toLocaleTimeString('km-KH', { hour12: false });

            localStorage.setItem('sheet_last_sync', dateString);

            if (statusLabel) {
                statusLabel.textContent = `សមកាលកម្មចុងក្រោយ៖ ${dateString}`;
                statusLabel.style.color = 'var(--success)';
            }
            if (manual) {
                alert('សមកាលកម្មទិន្នន័យជាមួយ Google Sheet ជោគជ័យ!');
            }
        })
        .catch(error => {
            console.error('Sync Error:', error);
            if (statusLabel) {
                statusLabel.textContent = 'ស្ថានភាព៖ សមកាលកម្មបរាជ័យ';
                statusLabel.style.color = 'var(--danger)';
            }
            if (manual) {
                alert('សមកាលកម្មទិន្នន័យបរាជ័យ! សូមពិនិត្យមើល URL របស់អ្នកឡើងវិញ។');
            }
        })
        .finally(() => {
            if (syncBtn) {
                syncBtn.disabled = false;
                const icon = syncBtn.querySelector('i');
                if (icon) icon.classList.remove('spin');
            }
        });
}

// Trigger auto sync with debounce to avoid spamming Google Sheet during batch updates
let autoSyncTimeout = null;
function triggerAutoSync() {
    const isAutoSyncEnabled = localStorage.getItem('sheet_auto_sync') === 'true';
    if (!isAutoSyncEnabled) return;

    if (autoSyncTimeout) clearTimeout(autoSyncTimeout);
    autoSyncTimeout = setTimeout(() => {
        syncWithGoogleSheets(false);
    }, 2000); // Wait 2 seconds of inactivity before sending request
}

/* ------------------ LIBRARIAN AUTHENTICATION LOGIC ------------------ */

function isLibrarianLoggedIn() {
    return sessionStorage.getItem('librarian_logged_in') === 'true';
}

function checkAuthStatus() {
    const loginScreen = document.getElementById('login-screen');
    const appContainer = document.querySelector('.app-container');

    if (isLibrarianLoggedIn()) {
        if (loginScreen) loginScreen.style.display = 'none';
        if (appContainer) appContainer.style.display = 'flex';
    } else {
        if (loginScreen) loginScreen.style.display = 'flex';
        if (appContainer) appContainer.style.display = 'none';
    }
}

function setupAuthListeners() {
    const loginForm = document.getElementById('login-form');
    const logoutBtn = document.getElementById('logout-btn');
    const loginError = document.getElementById('login-error-msg');

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('login-username').value.trim();
            const password = document.getElementById('login-password').value;

            // Default credentials: admin / 123456
            if (username === 'admin' && password === '2802') {
                if (loginError) loginError.style.display = 'none';
                sessionStorage.setItem('librarian_logged_in', 'true');

                // Show app UI
                checkAuthStatus();

                // Initial render
                renderDashboard();
                lucide.createIcons();
            } else {
                if (loginError) loginError.style.display = 'flex';
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('តើអ្នកពិតជាចង់ចាកចេញពីគណនីបណ្ណារក្សមែនទេ?')) {
                sessionStorage.removeItem('librarian_logged_in');
                checkAuthStatus();

                // Reset form inputs
                if (loginForm) loginForm.reset();
                if (loginError) loginError.style.display = 'none';
            }
        });
    }
}
