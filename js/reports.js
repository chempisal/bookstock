/**
 * reports.js - Comprehensive Reporting Suite & Advanced Custom Report Organizer
 * មជ្ឈមណ្ឌលរៀបចំរបាយការណ៍កម្រិតខ្ពស់ (ជម្រើសកាលបរិច្ឆេទរហ័ស, បង្ហាញ/លាក់ជួរឈរ, បោះពុម្ភ PDF, នាំចេញ Excel, ចម្លងតារាង)
 */

let currentReportType = 'borrowing_list'; // 'borrowing_list' | 'stock_balance' | 'overdue_list' | 'statistical_summary'

// Column visibility preferences for customizable report
let reportColumnConfig = {
    no: true,
    name: true,
    id: true,
    grade: true,
    books: true,
    borrowDate: true,
    dueDate: true,
    status: true,
    phone: false
};

// Initialize Reports View
function initReportsView() {
    setupReportControls();
    setupReportOrganizerListeners();
    setupMobileReportPreviewToggles();
    renderReportPreview();
}

// Setup Mobile Viewport Fit / 100% Zoom Toggle for Report Simulation Sheet
function setupMobileReportPreviewToggles() {
    const btnFit = document.getElementById('btn-report-view-fit');
    const btnFull = document.getElementById('btn-report-view-full');

    if (btnFit) {
        btnFit.addEventListener('click', () => {
            btnFit.classList.add('active');
            if (btnFull) btnFull.classList.remove('active');
            applyReportMobileFit(true);
        });
    }

    if (btnFull) {
        btnFull.addEventListener('click', () => {
            btnFull.classList.add('active');
            if (btnFit) btnFit.classList.remove('active');
            applyReportMobileFit(false);
        });
    }

    // Auto-listen to window resize
    window.addEventListener('resize', () => {
        if (window.innerWidth <= 768) {
            const isFitActive = btnFit && btnFit.classList.contains('active');
            if (isFitActive) {
                applyReportMobileFit(true);
            }
        } else {
            applyReportMobileFit(false);
        }
    });
}

function applyReportMobileFit(enable) {
    const printFrame = document.querySelector('.print-paper-frame');
    const printSheet = document.getElementById('printable-report-sheet');
    if (!printFrame || !printSheet) return;

    if (enable && window.innerWidth <= 768) {
        printFrame.classList.add('fit-mobile');
        const containerWidth = printFrame.clientWidth - 16;
        const sheetBaseWidth = 794; // 210mm in standard dpi
        if (containerWidth > 0 && containerWidth < sheetBaseWidth) {
            const scale = Math.min(1, Math.max(0.32, containerWidth / sheetBaseWidth));
            printSheet.style.transform = `scale(${scale})`;
            printSheet.style.transformOrigin = 'top center';
            printSheet.style.margin = '0 auto';
            const sheetHeight = printSheet.scrollHeight || printSheet.offsetHeight;
            printFrame.style.height = `${Math.ceil(sheetHeight * scale + 30)}px`;
            printFrame.style.overflowX = 'hidden';
        }
    } else {
        printFrame.classList.remove('fit-mobile');
        printSheet.style.transform = 'none';
        printSheet.style.transformOrigin = '';
        printSheet.style.margin = '';
        printFrame.style.height = '';
        printFrame.style.overflowX = 'auto';
    }
}

// Setup Event Listeners for Report Controls
function setupReportControls() {
    // Report Tabs
    const tabButtons = document.querySelectorAll('.report-tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentReportType = btn.getAttribute('data-report-type');
            updateReportFilterVisibility();
            renderReportPreview();
        });
    });

    // Filter Change Listeners
    const gradeSelect = document.getElementById('report-grade-filter');
    const statusSelect = document.getElementById('report-status-filter');
    const startDateInput = document.getElementById('report-start-date');
    const endDateInput = document.getElementById('report-end-date');

    if (gradeSelect) gradeSelect.addEventListener('change', renderReportPreview);
    if (statusSelect) statusSelect.addEventListener('change', renderReportPreview);
    if (startDateInput) startDateInput.addEventListener('change', renderReportPreview);
    if (endDateInput) endDateInput.addEventListener('change', renderReportPreview);

    // Buttons
    const printBtn = document.getElementById('print-report-btn');
    if (printBtn) {
        printBtn.addEventListener('click', triggerPrintReport);
    }

    const exportBtn = document.getElementById('export-report-excel-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportCurrentReportToExcel);
    }

    const copyBtn = document.getElementById('copy-report-table-btn');
    if (copyBtn) {
        copyBtn.addEventListener('click', copyReportTableToClipboard);
    }
}

// Setup Listeners for Report Organizer Features (Date Presets & Column Selector)
function setupReportOrganizerListeners() {
    // Date Preset Buttons
    const presetButtons = document.querySelectorAll('.date-preset-btn');
    presetButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            presetButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            applyDatePreset(btn.getAttribute('data-preset'));
        });
    });

    // Toggle Organizer Panel Accordion
    const toggleOrganizerBtn = document.getElementById('toggle-report-organizer-btn');
    const organizerBody = document.getElementById('report-organizer-body');
    if (toggleOrganizerBtn && organizerBody) {
        toggleOrganizerBtn.addEventListener('click', () => {
            const isHidden = organizerBody.style.display === 'none';
            organizerBody.style.display = isHidden ? 'block' : 'none';
            toggleOrganizerBtn.querySelector('i').setAttribute('data-lucide', isHidden ? 'chevron-up' : 'chevron-down');
            if (window.lucide) lucide.createIcons();
        });
    }

    // Column Checkboxes
    const colCheckboxes = document.querySelectorAll('input[name="report_col_toggle"]');
    colCheckboxes.forEach(cb => {
        cb.addEventListener('change', () => {
            const col = cb.value;
            reportColumnConfig[col] = cb.checked;
            renderReportPreview();
        });
    });

    // Custom Document Title Input
    const customTitleInput = document.getElementById('report-custom-title-input');
    if (customTitleInput) {
        customTitleInput.addEventListener('input', () => {
            const val = customTitleInput.value.trim();
            const docTitle = document.getElementById('report-doc-title-text');
            if (docTitle) {
                docTitle.textContent = val || getDefaultReportTitle(currentReportType);
            }
        });
    }

    // Toggle Signatures checkbox
    const toggleSignaturesCb = document.getElementById('toggle-report-signatures');
    if (toggleSignaturesCb) {
        toggleSignaturesCb.addEventListener('change', (e) => {
            const signaturesRow = document.querySelector('.official-signatures-row');
            if (signaturesRow) {
                signaturesRow.style.display = e.target.checked ? 'flex' : 'none';
            }
        });
    }
}

// Apply Quick Date Presets
function applyDatePreset(preset) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    const startInput = document.getElementById('report-start-date');
    const endInput = document.getElementById('report-end-date');
    if (!startInput || !endInput) return;

    if (preset === 'today') {
        startInput.value = todayStr;
        endInput.value = todayStr;
    } else if (preset === 'this_week') {
        const firstDayOfWeek = new Date(today);
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Monday
        firstDayOfWeek.setDate(diff);
        startInput.value = firstDayOfWeek.toISOString().split('T')[0];
        endInput.value = todayStr;
    } else if (preset === 'this_month') {
        startInput.value = `${yyyy}-${mm}-01`;
        endInput.value = todayStr;
    } else if (preset === 'semester_1') {
        // Typically Oct - Feb
        startInput.value = `${yyyy}-10-01`;
        endInput.value = `${yyyy + 1}-02-28`;
    } else if (preset === 'semester_2') {
        // Typically March - July
        startInput.value = `${yyyy}-03-01`;
        endInput.value = `${yyyy}-07-31`;
    } else if (preset === 'all') {
        startInput.value = '';
        endInput.value = '';
    }

    renderReportPreview();
}

// Default Report Titles helper
function getDefaultReportTitle(type) {
    switch (type) {
        case 'borrowing_list': return 'បញ្ជីឈ្មោះសិស្សខ្ចីសៀវភៅសិក្សាគោល';
        case 'stock_balance': return 'របាយការណ៍ស្ថានភាពស្តុកសៀវភៅសិក្សាគោល';
        case 'overdue_list': return 'បញ្ជីសិស្សយឺតយ៉ាវមិនទាន់ប្រគល់សៀវភៅសង (Overdue)';
        case 'statistical_summary': return 'តារាងស្ថិតិសង្ខេបការគ្រប់គ្រង និងខ្ចី-សងសៀវភៅសិក្សាគោល';
        default: return 'របាយការណ៍សៀវភៅសិក្សាគោល';
    }
}

// Toggle which filters are visible based on current report type
function updateReportFilterVisibility() {
    const statusWrap = document.getElementById('report-status-filter-wrap');
    const dateRangeWrap = document.getElementById('report-date-filter-wrap');
    const columnSelectorWrap = document.getElementById('report-column-selector-wrap');
    const customTitleInput = document.getElementById('report-custom-title-input');

    if (customTitleInput) {
        customTitleInput.value = '';
    }

    if (currentReportType === 'stock_balance' || currentReportType === 'statistical_summary') {
        if (statusWrap) statusWrap.style.display = 'none';
        if (dateRangeWrap) dateRangeWrap.style.display = 'none';
        if (columnSelectorWrap) columnSelectorWrap.style.display = 'none';
    } else if (currentReportType === 'overdue_list') {
        if (statusWrap) statusWrap.style.display = 'none';
        if (dateRangeWrap) dateRangeWrap.style.display = 'grid';
        if (columnSelectorWrap) columnSelectorWrap.style.display = 'none';
    } else {
        if (statusWrap) statusWrap.style.display = 'block';
        if (dateRangeWrap) dateRangeWrap.style.display = 'grid';
        if (columnSelectorWrap) columnSelectorWrap.style.display = 'block';
    }
}

// Master Render Function for Report Preview
function renderReportPreview() {
    const districtOfficeEl = document.getElementById('report-district-office');
    const schoolNameEl = document.getElementById('report-school-name');
    const docDateEl = document.getElementById('report-doc-date');
    const principalNameEl = document.getElementById('report-principal-name');
    const librarianNameEl = document.getElementById('report-librarian-name');

    if (districtOfficeEl) districtOfficeEl.textContent = appSettings.districtOffice || 'ការិយាល័យអប់រំ យុវជន និងកីឡា';
    if (schoolNameEl) schoolNameEl.textContent = appSettings.schoolName || 'វិទ្យាល័យ ព្រះនរោត្តម សីហមុនី';
    if (docDateEl) docDateEl.textContent = formatKhmerDate(getTodayDateString());
    if (principalNameEl) principalNameEl.textContent = appSettings.principalName ? `(${appSettings.principalName})` : '(ហត្ថលេខា និងត្រា)';
    if (librarianNameEl) librarianNameEl.textContent = appSettings.librarianName ? `(${appSettings.librarianName})` : '(ហត្ថលេខា និងឈ្មោះ)';

    switch (currentReportType) {
        case 'borrowing_list':
            renderBorrowingListReport();
            break;
        case 'stock_balance':
            renderStockBalanceReport();
            break;
        case 'overdue_list':
            renderOverdueListReport();
            break;
        case 'statistical_summary':
            renderStatisticalSummaryReport();
            break;
        default:
            renderBorrowingListReport();
    }

    if (window.innerWidth <= 768) {
        const btnFit = document.getElementById('btn-report-view-fit');
        if (btnFit && btnFit.classList.contains('active')) {
            setTimeout(() => applyReportMobileFit(true), 60);
        }
    }
}

/* ==========================================================================
   REPORT 1: បញ្ជីឈ្មោះសិស្សខ្ចីសៀវភៅសិក្សាគោល (Student Borrowing List Report)
   ========================================================================== */
function renderBorrowingListReport() {
    const titleEl = document.getElementById('report-doc-title-text');
    const subtitleEl = document.getElementById('report-doc-subtitle-text');
    const tableHeaderEl = document.getElementById('report-table-header-row');
    const tableBodyEl = document.getElementById('report-table-body');
    const summaryBarEl = document.getElementById('report-summary-bar');

    const gradeFilter = document.getElementById('report-grade-filter')?.value || '';
    const statusFilter = document.getElementById('report-status-filter')?.value || '';
    const startDate = document.getElementById('report-start-date')?.value || '';
    const endDate = document.getElementById('report-end-date')?.value || '';

    const customTitle = document.getElementById('report-custom-title-input')?.value.trim();
    titleEl.textContent = customTitle || 'បញ្ជីឈ្មោះសិស្សខ្ចីសៀវភៅសិក្សាគោល';

    let gradeText = gradeFilter ? `ថ្នាក់ទី ${toKhmerNumber(gradeFilter)}` : 'គ្រប់កម្រិតថ្នាក់';
    let statusText = 'ស្ថានភាព៖ ទាំងអស់';
    if (statusFilter === 'borrowing') statusText = 'ស្ថានភាព៖ កំពុងខ្ចី';
    else if (statusFilter === 'returned') statusText = 'ស្ថានភាព៖ បានសងវិញ';
    else if (statusFilter === 'overdue') statusText = 'ស្ថានភាព៖ ហួសកំណត់';

    let dateRangeText = '';
    if (startDate && endDate) {
        dateRangeText = ` | ចាប់ពី ${formatKhmerDate(startDate)} ដល់ ${formatKhmerDate(endDate)}`;
    } else if (startDate) {
        dateRangeText = ` | ចាប់ពី ${formatKhmerDate(startDate)}`;
    }

    subtitleEl.textContent = `ឆ្នាំសិក្សា៖ ${appSettings.academicYear || '២០២៥-២០២៦'} | ${gradeText} | ${statusText}${dateRangeText}`;

    // Dynamic Columns according to reportColumnConfig
    let thHtml = '';
    if (reportColumnConfig.no) thHtml += '<th style="width: 5%; text-align: center;">ល.រ</th>';
    if (reportColumnConfig.name) thHtml += '<th style="width: 20%;">ឈ្មោះសិស្ស</th>';
    if (reportColumnConfig.grade) thHtml += '<th style="width: 10%; text-align: center;">ថ្នាក់/បន្ទប់</th>';
    if (reportColumnConfig.phone) thHtml += '<th style="width: 12%; text-align: center;">លេខទូរស័ព្ទ</th>';
    if (reportColumnConfig.books) thHtml += '<th style="width: 28%;">ឈ្មោះសៀវភៅសិក្សាគោលដែលខ្ចី</th>';
    if (reportColumnConfig.borrowDate) thHtml += '<th style="width: 12%; text-align: center;">ថ្ងៃខ្ចី</th>';
    if (reportColumnConfig.dueDate) thHtml += '<th style="width: 12%; text-align: center;">ថ្ងៃត្រូវសង</th>';
    if (reportColumnConfig.status) thHtml += '<th style="width: 11%; text-align: center;">ស្ថានភាព</th>';

    tableHeaderEl.innerHTML = thHtml;

    // Filter Borrowings
    const filtered = appBorrowings.filter(br => {
        const matchesGrade = !gradeFilter || String(br.grade) === String(gradeFilter);

        let matchesStatus = true;
        if (statusFilter) {
            matchesStatus = br.status === statusFilter || (br.books || []).some(b => b.status === statusFilter);
        }

        let matchesDate = true;
        if (startDate) matchesDate = matchesDate && br.borrowDate >= startDate;
        if (endDate) matchesDate = matchesDate && br.borrowDate <= endDate;

        return matchesGrade && matchesStatus && matchesDate;
    });

    const activeColCount = Object.values(reportColumnConfig).filter(Boolean).length || 7;

    if (filtered.length === 0) {
        tableBodyEl.innerHTML = `<tr><td colspan="${activeColCount}" style="text-align: center; padding: 24px;">គ្មានទិន្នន័យសិស្សខ្ចីសៀវភៅតាមលក្ខខណ្ឌកំណត់នេះឡើយ។</td></tr>`;
        summaryBarEl.innerHTML = `<div>ចំនួនសិស្សសរុប៖ ០ នាក់ | ចំនួនក្បាលសៀវភៅសរុប៖ ០ ក្បាល</div>`;
        return;
    }

    let totalBooksIssued = 0;
    filtered.sort((a, b) => new Date(a.borrowDate) - new Date(b.borrowDate));

    tableBodyEl.innerHTML = filtered.map((br, index) => {
        const matchedBooks = (br.books || []).filter(item => {
            if (!statusFilter) return true;
            return item.status === statusFilter || br.status === statusFilter;
        });

        totalBooksIssued += matchedBooks.length;

        const booksHtml = matchedBooks.map(item => {
            const book = appBooks.find(b => b.id === item.bookId);
            const title = book ? book.title : item.title || 'សៀវភៅ';

            let statusKhmer = 'កំពុងខ្ចី';
            if (item.status === 'returned') statusKhmer = `បានសង ${formatKhmerDate(item.returnDate)}`;
            else if (item.status === 'overdue' || br.status === 'overdue') statusKhmer = 'ហួសកំណត់';

            return `• <strong>${title}</strong> <span style="font-size: 8.5pt; color: #555;">(${statusKhmer})</span>`;
        }).join('<br>');

        let overallText = 'កំពុងខ្ចី';
        if (br.status === 'returned') overallText = 'បានសងទាំងអស់';
        else if (br.status === 'overdue') overallText = 'ហួសកំណត់';

        const student = appStudents.find(s => s.id === br.studentId);
        const phone = student ? student.phone || '-' : '-';

        let rowCells = '';
        if (reportColumnConfig.no) rowCells += `<td style="text-align: center;">${toKhmerNumber(index + 1)}</td>`;
        if (reportColumnConfig.name) {
            const idPart = reportColumnConfig.id ? `<br><span style="font-size: 8.5pt; color: #666;">(${br.studentId})</span>` : '';
            rowCells += `<td><strong>${br.studentName}</strong>${idPart}</td>`;
        }
        if (reportColumnConfig.grade) rowCells += `<td style="text-align: center;">ថ្នាក់ទី ${toKhmerNumber(br.grade)} (${br.class})</td>`;
        if (reportColumnConfig.phone) rowCells += `<td style="text-align: center;">${phone}</td>`;
        if (reportColumnConfig.books) rowCells += `<td style="line-height: 1.5;">${booksHtml}</td>`;
        if (reportColumnConfig.borrowDate) rowCells += `<td style="text-align: center;">${formatKhmerDate(br.borrowDate)}</td>`;
        if (reportColumnConfig.dueDate) rowCells += `<td style="text-align: center;">${formatKhmerDate(br.dueDate)}</td>`;
        if (reportColumnConfig.status) rowCells += `<td style="text-align: center; font-weight: 600;">${overallText}</td>`;

        return `<tr>${rowCells}</tr>`;
    }).join('');

    summaryBarEl.innerHTML = `
        <div>ចំនួនសិស្សសរុប៖ <strong>${toKhmerNumber(filtered.length)}</strong> នាក់</div>
        <div>ចំនួនសៀវភៅខ្ចីសរុប៖ <strong>${toKhmerNumber(totalBooksIssued)}</strong> ក្បាល</div>
    `;
}

/* ==========================================================================
   REPORT 2: របាយការណ៍ស្តុកសៀវភៅសិក្សាគោល (Textbook Stock & Inventory Report)
   ========================================================================== */
function renderStockBalanceReport() {
    const titleEl = document.getElementById('report-doc-title-text');
    const subtitleEl = document.getElementById('report-doc-subtitle-text');
    const tableHeaderEl = document.getElementById('report-table-header-row');
    const tableBodyEl = document.getElementById('report-table-body');
    const summaryBarEl = document.getElementById('report-summary-bar');

    const gradeFilter = document.getElementById('report-grade-filter')?.value || '';
    const customTitle = document.getElementById('report-custom-title-input')?.value.trim();

    titleEl.textContent = customTitle || 'របាយការណ៍ស្ថានភាពស្តុកសៀវភៅសិក្សាគោល';
    let gradeText = gradeFilter ? `ថ្នាក់ទី ${toKhmerNumber(gradeFilter)}` : 'គ្រប់កម្រិតថ្នាក់ (៧ ដល់ ១២)';
    subtitleEl.textContent = `ឆ្នាំសិក្សា៖ ${appSettings.academicYear || '២០២៥-២០២៦'} | ${gradeText}`;

    tableHeaderEl.innerHTML = `
        <th style="width: 5%;">ល.រ</th>
        <th style="width: 18%;">មុខវិជ្ជា</th>
        <th style="width: 27%;">ឈ្មោះសៀវភៅសិក្សាគោល</th>
        <th style="width: 10%;">កម្រិតថ្នាក់</th>
        <th style="width: 10%;">ស្តុកសរុប</th>
        <th style="width: 10%;">កំពុងខ្ចី</th>
        <th style="width: 10%;">សល់ក្នុងស្តុក</th>
        <th style="width: 10%;">ស្ថានភាពស្តុក</th>
    `;

    const filtered = appBooks.filter(b => {
        if (!gradeFilter) return true;
        return String(b.grade) === String(gradeFilter);
    });

    if (filtered.length === 0) {
        tableBodyEl.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 24px;">គ្មានទិន្នន័យសៀវភៅសម្រាប់កម្រិតថ្នាក់នេះឡើយ។</td></tr>`;
        summaryBarEl.innerHTML = '';
        return;
    }

    let totalStockSum = 0;
    let totalBorrowedSum = 0;
    let totalAvailableSum = 0;

    tableBodyEl.innerHTML = filtered.map((book, idx) => {
        const total = Number(book.quantity) || 0;
        const borrowed = Number(book.borrowed) || 0;
        const available = Math.max(0, total - borrowed);

        totalStockSum += total;
        totalBorrowedSum += borrowed;
        totalAvailableSum += available;

        let statusText = 'គ្រប់គ្រាន់';
        if (available === 0) statusText = 'អស់ពីស្តុក';
        else if (available <= 10) statusText = 'ជិតអស់';

        return `
            <tr>
                <td style="text-align: center;">${toKhmerNumber(idx + 1)}</td>
                <td><strong>${book.subject}</strong></td>
                <td>${book.title}</td>
                <td style="text-align: center;">ថ្នាក់ទី ${toKhmerNumber(book.grade)}</td>
                <td style="text-align: center; font-weight: 700;">${toKhmerNumber(total)}</td>
                <td style="text-align: center; color: #b45309; font-weight: 600;">${toKhmerNumber(borrowed)}</td>
                <td style="text-align: center; color: #047857; font-weight: 700;">${toKhmerNumber(available)}</td>
                <td style="text-align: center;">${statusText}</td>
            </tr>
        `;
    }).join('');

    tableBodyEl.innerHTML += `
        <tr style="background-color: #f1f5f9; font-weight: 700;">
            <td colspan="4" style="text-align: right; padding-right: 14px;">សរុបរួម៖</td>
            <td style="text-align: center;">${toKhmerNumber(totalStockSum)}</td>
            <td style="text-align: center; color: #b45309;">${toKhmerNumber(totalBorrowedSum)}</td>
            <td style="text-align: center; color: #047857;">${toKhmerNumber(totalAvailableSum)}</td>
            <td style="text-align: center;">-</td>
        </tr>
    `;

    summaryBarEl.innerHTML = `
        <div>ចំណងជើងសៀវភៅសរុប៖ <strong>${toKhmerNumber(filtered.length)}</strong> ចំណងជើង</div>
        <div>សៀវភៅក្នុងស្តុកសរុប៖ <strong>${toKhmerNumber(totalStockSum)}</strong> ក្បាល</div>
        <div>កំពុងខ្ចី៖ <strong>${toKhmerNumber(totalBorrowedSum)}</strong> ក្បាល</div>
        <div>សល់ជាក់ស្តែង៖ <strong>${toKhmerNumber(totalAvailableSum)}</strong> ក្បាល</div>
    `;
}

/* ==========================================================================
   REPORT 3: បញ្ជីសិស្សយឺតយ៉ាវមិនទាន់សងសៀវភៅ (Overdue & Late Borrowers Report)
   ========================================================================== */
function renderOverdueListReport() {
    const titleEl = document.getElementById('report-doc-title-text');
    const subtitleEl = document.getElementById('report-doc-subtitle-text');
    const tableHeaderEl = document.getElementById('report-table-header-row');
    const tableBodyEl = document.getElementById('report-table-body');
    const summaryBarEl = document.getElementById('report-summary-bar');

    const gradeFilter = document.getElementById('report-grade-filter')?.value || '';
    const customTitle = document.getElementById('report-custom-title-input')?.value.trim();
    const todayStr = getTodayDateString();

    titleEl.textContent = customTitle || 'បញ្ជីសិស្សយឺតយ៉ាវមិនទាន់ប្រគល់សៀវភៅសង (Overdue)';
    let gradeText = gradeFilter ? `ថ្នាក់ទី ${toKhmerNumber(gradeFilter)}` : 'គ្រប់កម្រិតថ្នាក់';
    subtitleEl.textContent = `គិតត្រឹម៖ ${formatKhmerDate(todayStr)} | ${gradeText}`;

    tableHeaderEl.innerHTML = `
        <th style="width: 5%;">ល.រ</th>
        <th style="width: 18%;">ឈ្មោះសិស្ស</th>
        <th style="width: 10%;">ថ្នាក់/បន្ទប់</th>
        <th style="width: 14%;">លេខទូរស័ព្ទ</th>
        <th style="width: 25%;">សៀវភៅដែលជំពាក់មិនទាន់សង</th>
        <th style="width: 14%;">ថ្ងៃត្រូវសង</th>
        <th style="width: 14%;">យឺតយ៉ាវ (ថ្ងៃ)</th>
    `;

    const overdueList = appBorrowings.filter(br => {
        const matchesGrade = !gradeFilter || String(br.grade) === String(gradeFilter);
        const isLate = br.dueDate < todayStr && (br.books || []).some(b => b.status !== 'returned');
        return matchesGrade && isLate;
    });

    if (overdueList.length === 0) {
        tableBodyEl.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 24px; color: #047857; font-weight: 600;">ពុំមានសិស្សយឺតយ៉ាវហួសកាលកំណត់សងសៀវភៅឡើយ!</td></tr>`;
        summaryBarEl.innerHTML = `<div>សិស្សយឺតយ៉ាវ៖ <strong>០</strong> នាក់</div>`;
        return;
    }

    let totalOverdueBooks = 0;

    tableBodyEl.innerHTML = overdueList.map((br, idx) => {
        const student = appStudents.find(s => s.id === br.studentId);
        const phone = student ? student.phone || '-' : '-';

        const diffTime = Math.abs(new Date(todayStr) - new Date(br.dueDate));
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const unreturnedBooks = (br.books || []).filter(b => b.status !== 'returned');
        totalOverdueBooks += unreturnedBooks.length;

        const booksHtml = unreturnedBooks.map(item => {
            const book = appBooks.find(b => b.id === item.bookId);
            return `• ${book ? book.title : item.title || 'សៀវភៅ'}`;
        }).join('<br>');

        return `
            <tr>
                <td style="text-align: center;">${toKhmerNumber(idx + 1)}</td>
                <td><strong>${br.studentName}</strong><br><span style="font-size: 8.5pt; color: #666;">(${br.studentId})</span></td>
                <td style="text-align: center;">ថ្នាក់ទី ${toKhmerNumber(br.grade)} (${br.class})</td>
                <td style="text-align: center;">${phone}</td>
                <td style="line-height: 1.5; color: #b91c1c;">${booksHtml}</td>
                <td style="text-align: center;">${formatKhmerDate(br.dueDate)}</td>
                <td style="text-align: center; font-weight: 700; color: #b91c1c;">ហួស ${toKhmerNumber(diffDays)} ថ្ងៃ</td>
            </tr>
        `;
    }).join('');

    summaryBarEl.innerHTML = `
        <div>សិស្សយឺតយ៉ាវសរុប៖ <strong style="color: #b91c1c;">${toKhmerNumber(overdueList.length)}</strong> នាក់</div>
        <div>សៀវភៅមិនទាន់បានសង៖ <strong style="color: #b91c1c;">${toKhmerNumber(totalOverdueBooks)}</strong> ក្បាល</div>
    `;
}

/* ==========================================================================
   REPORT 4: តារាងស្ថិតិសង្ខេបប្រចាំឆមាស/ឆ្នាំសិក្សា (Executive Statistical Summary)
   ========================================================================== */
function renderStatisticalSummaryReport() {
    const titleEl = document.getElementById('report-doc-title-text');
    const subtitleEl = document.getElementById('report-doc-subtitle-text');
    const tableHeaderEl = document.getElementById('report-table-header-row');
    const tableBodyEl = document.getElementById('report-table-body');
    const summaryBarEl = document.getElementById('report-summary-bar');

    const customTitle = document.getElementById('report-custom-title-input')?.value.trim();

    titleEl.textContent = customTitle || 'តារាងស្ថិតិសង្ខេបការគ្រប់គ្រង និងខ្ចី-សងសៀវភៅសិក្សាគោល';
    subtitleEl.textContent = `ឆ្នាំសិក្សា៖ ${appSettings.academicYear || '២០២៥-២០២៦'} | របាយការណ៍បូកសរុបជូនគណៈគ្រប់គ្រងសាលា`;

    tableHeaderEl.innerHTML = `
        <th style="width: 8%;">ល.រ</th>
        <th style="width: 18%;">កម្រិតថ្នាក់</th>
        <th style="width: 14%;">ចំនួនសិស្សសរុប</th>
        <th style="width: 14%;">សិស្សបានខ្ចី</th>
        <th style="width: 16%;">សៀវភៅក្នុងស្តុក</th>
        <th style="width: 15%;">សៀវភៅកំពុងខ្ចី</th>
        <th style="width: 15%;">សៀវភៅនៅសល់</th>
    `;

    const grades = ['7', '8', '9', '10', '11', '12'];
    let grandStudents = 0;
    let grandBorrowers = 0;
    let grandStock = 0;
    let grandBorrowed = 0;
    let grandAvailable = 0;

    let rowsHtml = '';

    grades.forEach((g, index) => {
        const studentsInGrade = appStudents.filter(s => String(s.grade) === String(g)).length;
        const borrowersInGrade = new Set(
            appBorrowings.filter(br => String(br.grade) === String(g) && (br.books || []).some(b => b.status !== 'returned'))
                .map(br => br.studentId)
        ).size;

        const booksInGrade = appBooks.filter(b => String(b.grade) === String(g));
        let stockInGrade = 0;
        let borrowedInGrade = 0;

        booksInGrade.forEach(b => {
            stockInGrade += Number(b.quantity) || 0;
            borrowedInGrade += Number(b.borrowed) || 0;
        });

        const availableInGrade = Math.max(0, stockInGrade - borrowedInGrade);

        grandStudents += studentsInGrade;
        grandBorrowers += borrowersInGrade;
        grandStock += stockInGrade;
        grandBorrowed += borrowedInGrade;
        grandAvailable += availableInGrade;

        rowsHtml += `
            <tr>
                <td style="text-align: center;">${toKhmerNumber(index + 1)}</td>
                <td style="font-weight: 700; text-align: center;">ថ្នាក់ទី ${toKhmerNumber(g)}</td>
                <td style="text-align: center;">${toKhmerNumber(studentsInGrade)} នាក់</td>
                <td style="text-align: center; color: #1e3a8a; font-weight: 600;">${toKhmerNumber(borrowersInGrade)} នាក់</td>
                <td style="text-align: center; font-weight: 700;">${toKhmerNumber(stockInGrade)}</td>
                <td style="text-align: center; color: #b45309; font-weight: 600;">${toKhmerNumber(borrowedInGrade)}</td>
                <td style="text-align: center; color: #047857; font-weight: 700;">${toKhmerNumber(availableInGrade)}</td>
            </tr>
        `;
    });

    rowsHtml += `
        <tr style="background-color: #f1f5f9; font-weight: 700;">
            <td colspan="2" style="text-align: center;">សរុបរួម</td>
            <td style="text-align: center;">${toKhmerNumber(grandStudents)} នាក់</td>
            <td style="text-align: center; color: #1e3a8a;">${toKhmerNumber(grandBorrowers)} នាក់</td>
            <td style="text-align: center;">${toKhmerNumber(grandStock)}</td>
            <td style="text-align: center; color: #b45309;">${toKhmerNumber(grandBorrowed)}</td>
            <td style="text-align: center; color: #047857;">${toKhmerNumber(grandAvailable)}</td>
        </tr>
    `;

    tableBodyEl.innerHTML = rowsHtml;

    summaryBarEl.innerHTML = `
        <div>សិស្សសរុប៖ <strong>${toKhmerNumber(grandStudents)}</strong> នាក់</div>
        <div>សិស្សកំពុងខ្ចី៖ <strong>${toKhmerNumber(grandBorrowers)}</strong> នាក់</div>
        <div>សៀវភៅក្នុងស្តុកសរុប៖ <strong>${toKhmerNumber(grandStock)}</strong> ក្បាល</div>
        <div>កំពុងខ្ចីសរុប៖ <strong>${toKhmerNumber(grandBorrowed)}</strong> ក្បាល</div>
    `;
}

// Trigger Print for Report
function triggerPrintReport() {
    renderReportPreview();
    applyReportMobileFit(false);
    logActivity('បោះពុម្ភរបាយការណ៍', `បានបើកការបោះពុម្ភរបាយការណ៍ "${getDefaultReportTitle(currentReportType)}"`, 'system', 'printer', false);
    setTimeout(() => {
        window.print();
        setTimeout(() => {
            if (window.innerWidth <= 768) {
                const btnFit = document.getElementById('btn-report-view-fit');
                if (btnFit && btnFit.classList.contains('active')) {
                    applyReportMobileFit(true);
                }
            }
        }, 500);
    }, 120);
}

// Export Current Active Report Table to CSV/Excel
function exportCurrentReportToExcel() {
    const table = document.getElementById('report-printable-table');
    if (!table) return;

    const rows = Array.from(table.querySelectorAll('tr'));
    if (rows.length === 0) {
        showToast('គ្មានទិន្នន័យសម្រាប់ទាញយកទេ!', 'warning');
        return;
    }

    const csvRows = [];
    rows.forEach(tr => {
        const cells = Array.from(tr.querySelectorAll('th, td'));
        const rowData = cells.map(cell => {
            let txt = cell.innerText.replace(/(\r\n|\n|\r)/gm, ' ; ').replace(/"/g, '""').trim();
            return `"${txt}"`;
        });
        csvRows.push(rowData.join(','));
    });

    const csvContent = '\uFEFF' + csvRows.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `របាយការណ៍_${currentReportType}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    logActivity('ទាញយករបាយការណ៍ Excel', `បានទាញយកឯកសារ Excel នៃ "${getDefaultReportTitle(currentReportType)}"`, 'system', 'download', false);
}

// Copy Report Table to Clipboard (For instant pasting into Word or Excel)
async function copyReportTableToClipboard() {
    const table = document.getElementById('report-printable-table');
    if (!table) return;

    try {
        const rows = Array.from(table.querySelectorAll('tr'));
        const tsvText = rows.map(tr => {
            const cells = Array.from(tr.querySelectorAll('th, td'));
            return cells.map(c => c.innerText.replace(/(\r\n|\n|\r)/gm, ' ').trim()).join('\t');
        }).join('\n');

        await navigator.clipboard.writeText(tsvText);
        showToast('បានចម្លងតារាងរបាយការណ៍ទៅ Clipboard រួចរាល់! លោកអ្នកអាចបិទភ្ជាប់ (Paste) ចូល Word ឬ Excel បានភ្លាមៗ', 'success');
        logActivity('ចម្លងតារាងរបាយការណ៍', 'បានចម្លងទិន្នន័យតារាងរបាយការណ៍ទៅ Clipboard', 'system', 'copy', false);
    } catch (err) {
        console.error('Clipboard copy error:', err);
        showToast('មិនអាចចម្លងតារាងបានទេ! សូមជ្រើសរើសទាញយកជា Excel ជំនួសវិញ', 'warning');
    }
}
