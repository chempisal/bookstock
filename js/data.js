/**
 * data.js - Data structures, Khmer translation helpers, Empty Initial State, Activity Logging & Cloud Sync Engine
 * ប្រព័ន្ធគ្រប់គ្រងសៀវភៅសិក្សាគោល (Textbook Stock & Borrowing Management System)
 */

// Storage Keys
const STORAGE_KEYS = {
    BOOKS: 'tb_books',
    BORROWINGS: 'tb_borrowings',
    STUDENTS: 'tb_students',
    SETTINGS: 'tb_settings',
    AUTH: 'tb_auth',
    LOGS: 'tb_activity_logs',
    SHEET_URL: 'sheet_webhook_url',
    AUTO_SYNC: 'sheet_auto_sync',
    LAST_SYNC: 'sheet_last_sync',
    SAMPLE_CLEARED: 'tb_sample_cleared_v2'
};

// Khmer Digits and Months
const KHMER_DIGITS = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
const KHMER_MONTHS = [
    "មករា", "កុម្ភៈ", "មីនា", "មេសា", "ឧសភា", "មិថុនា",
    "កក្កដា", "សីហា", "កញ្ញា", "តុលា", "វិច្ឆិកា", "ធ្នូ"
];
const KHMER_DAYS = ["អាទិត្យ", "ចន្ទ", "អង្គារ", "ពុធ", "ព្រហស្បតិ៍", "សុក្រ", "សៅរ៍"];

// Helper: Convert Arabic number to Khmer number
function toKhmerNumber(num) {
    if (num === null || num === undefined || (isNaN(num) && typeof num !== 'string')) return '';
    return String(num).replace(/[0-9]/g, digit => KHMER_DIGITS[+digit]);
}

// Helper: Convert Khmer number string to regular Arabic number
function fromKhmerNumber(khmerStr) {
    if (!khmerStr) return '';
    let result = String(khmerStr);
    KHMER_DIGITS.forEach((kh, i) => {
        result = result.split(kh).join(String(i));
    });
    return result;
}

// Helper: Format Date string (YYYY-MM-DD) to Khmer readable date
function formatKhmerDate(dateStr, includeDayName = false) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;

    const dayName = KHMER_DAYS[date.getDay()];
    const day = date.getDate();
    const month = KHMER_MONTHS[date.getMonth()];
    const year = date.getFullYear();

    if (includeDayName) {
        return `ថ្ងៃ${dayName} ទី${toKhmerNumber(day)} ខែ${month} ឆ្នាំ${toKhmerNumber(year)}`;
    }
    return `ថ្ងៃទី ${toKhmerNumber(day)} ខែ ${month} ឆ្នាំ ${toKhmerNumber(year)}`;
}

// Helper: Relative Time in Khmer (e.g. មុននេះបន្តិច, ៥ នាទីមុន, ម្សិលមិញ)
function formatRelativeKhmerTime(isoDateStr) {
    if (!isoDateStr) return '';
    const date = new Date(isoDateStr);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);

    if (diffSec < 30) return 'មុននេះបន្តិច';
    if (diffSec < 60) return `${toKhmerNumber(diffSec)} វិនាទីមុន`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${toKhmerNumber(diffMin)} នាទីមុន`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${toKhmerNumber(diffHour)} ម៉ោងមុន`;
    const diffDays = Math.floor(diffHour / 24);
    if (diffDays === 1) return 'ម្សិលមិញ';
    if (diffDays < 7) return `${toKhmerNumber(diffDays)} ថ្ងៃមុន`;

    return formatKhmerDate(isoDateStr.split('T')[0]);
}

// Helper: Get Today's Date string in YYYY-MM-DD
function getTodayDateString() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

// Helper: Add days to date string
function addDaysToDate(dateStr, days) {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

// Default School Settings (Clean template)
const DEFAULT_SETTINGS = {
    districtOffice: "ការិយាល័យអប់រំ យុវជន និងកីឡា",
    schoolName: "វិទ្យាល័យ / អនុវិទ្យាល័យ",
    academicYear: "២០២៥ - ២០២៦",
    principalName: "",
    librarianName: "បណ្ណារក្ស",
    loanDurationDays: 14,
    receiptNote: "* សេចក្តីបញ្ជាក់៖ សូមរក្សាទុកសៀវភៅឱ្យបានល្អ កុំឱ្យហែក ប្រឡាក់ ឬបាត់បង់ និងត្រូវយកមកប្រគល់សងបណ្ណាល័យវិញឱ្យបានទាន់ពេលវេលាកំណត់។"
};

// CLEAN PRODUCTION INITIAL DATA: Empty arrays (No sample/mock data)
const DEFAULT_BOOKS = [];
const DEFAULT_STUDENTS = [];
const DEFAULT_BORROWINGS = [];

// App Global State
let appBooks = [];
let appStudents = [];
let appBorrowings = [];
let appSettings = {};
let appActivityLogs = [];
let appAuth = { isLoggedIn: false, username: 'admin' };
let isSyncingWithCloud = false;

// Initialize Data Store (with automatic purge of legacy sample/demo data)
function initDataStore() {
    // Check if legacy sample data needs to be purged from localStorage
    const hasClearedSample = localStorage.getItem(STORAGE_KEYS.SAMPLE_CLEARED);
    if (!hasClearedSample) {
        localStorage.removeItem(STORAGE_KEYS.BOOKS);
        localStorage.removeItem(STORAGE_KEYS.STUDENTS);
        localStorage.removeItem(STORAGE_KEYS.BORROWINGS);
        localStorage.removeItem(STORAGE_KEYS.LOGS);
        localStorage.setItem(STORAGE_KEYS.SAMPLE_CLEARED, 'true');
    }

    // Load Settings
    const localSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (localSettings) {
        try {
            appSettings = Object.assign({}, DEFAULT_SETTINGS, JSON.parse(localSettings));
        } catch (e) {
            appSettings = Object.assign({}, DEFAULT_SETTINGS);
        }
    } else {
        appSettings = Object.assign({}, DEFAULT_SETTINGS);
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(appSettings));
    }

    // Load Books (Starts empty if no user data)
    const localBooks = localStorage.getItem(STORAGE_KEYS.BOOKS);
    if (localBooks) {
        try {
            appBooks = JSON.parse(localBooks);
        } catch (e) {
            appBooks = [];
        }
    } else {
        appBooks = [];
        localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(appBooks));
    }

    // Load Students (Starts empty if no user data)
    const localStudents = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    if (localStudents) {
        try {
            appStudents = JSON.parse(localStudents);
        } catch (e) {
            appStudents = [];
        }
    } else {
        appStudents = [];
        localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(appStudents));
    }

    // Load Borrowings (Starts empty if no user data)
    const localBorrowings = localStorage.getItem(STORAGE_KEYS.BORROWINGS);
    if (localBorrowings) {
        try {
            appBorrowings = JSON.parse(localBorrowings);
        } catch (e) {
            appBorrowings = [];
        }
    } else {
        appBorrowings = [];
        localStorage.setItem(STORAGE_KEYS.BORROWINGS, JSON.stringify(appBorrowings));
    }

    // Load Logs
    const localLogs = localStorage.getItem(STORAGE_KEYS.LOGS);
    if (localLogs) {
        try {
            appActivityLogs = JSON.parse(localLogs);
        } catch (e) {
            appActivityLogs = [];
        }
    } else {
        appActivityLogs = [
            {
                timestamp: new Date().toISOString(),
                action: 'ចាប់ផ្តើមប្រព័ន្ធ',
                details: 'ប្រព័ន្ធគ្រប់គ្រងសៀវភៅសិក្សាគោលត្រូវបានបើកដំណើរការ',
                type: 'system',
                icon: 'power'
            }
        ];
        localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(appActivityLogs));
    }

    // Sync book borrowed counts from active borrowings
    recalculateBookStock();
    // Update overdue flags
    updateOverdueStatus();

    // AUTO-FETCH FROM GOOGLE SHEETS ON STARTUP
    setupCloudSyncOnStartup();
}

// Recalculate book borrowed counts dynamically based on active borrowings
function recalculateBookStock() {
    const counts = {};
    appBooks.forEach(b => counts[b.id] = 0);

    appBorrowings.forEach(br => {
        if (Array.isArray(br.books)) {
            br.books.forEach(item => {
                if (item.status !== 'returned') {
                    counts[item.bookId] = (counts[item.bookId] || 0) + 1;
                }
            });
        }
    });

    appBooks.forEach(b => {
        b.borrowed = counts[b.id] || 0;
    });

    localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(appBooks));
}

// Update overdue status according to today's date
function updateOverdueStatus() {
    const today = getTodayDateString();
    let hasChanges = false;

    appBorrowings.forEach(br => {
        let anyOverdue = false;
        let allReturned = true;

        if (Array.isArray(br.books)) {
            br.books.forEach(item => {
                if (item.status !== 'returned') {
                    allReturned = false;
                    if (br.dueDate < today) {
                        item.status = 'overdue';
                        anyOverdue = true;
                    } else {
                        item.status = 'borrowing';
                    }
                }
            });
        }

        const oldStatus = br.status;
        if (allReturned) {
            br.status = 'returned';
        } else if (anyOverdue) {
            br.status = 'overdue';
        } else {
            br.status = 'borrowing';
        }

        if (oldStatus !== br.status) {
            hasChanges = true;
        }
    });

    if (hasChanges) {
        localStorage.setItem(STORAGE_KEYS.BORROWINGS, JSON.stringify(appBorrowings));
    }
}

// Log System Activity and dispatch notification
function logActivity(action, details, type = 'info', icon = 'bell', triggerPush = true) {
    const logItem = {
        id: 'log_' + Date.now() + Math.random().toString(36).substr(2, 4),
        timestamp: new Date().toISOString(),
        action,
        details,
        type,
        icon,
        unread: true
    };

    appActivityLogs.unshift(logItem);
    if (appActivityLogs.length > 150) {
        appActivityLogs = appActivityLogs.slice(0, 150);
    }

    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(appActivityLogs));

    if (typeof updateNotificationBadge === 'function') {
        updateNotificationBadge();
    }

    let toastType = 'primary';
    if (type === 'return' || type === 'sync') toastType = 'success';
    else if (type === 'warning' || type === 'overdue') toastType = 'warning';
    else if (type === 'danger') toastType = 'danger';

    if (typeof showToast === 'function') {
        showToast(`<strong>${action}</strong>: ${details}`, toastType);
    }

    if (triggerPush && "Notification" in window && Notification.permission === "granted") {
        try {
            new Notification(action, {
                body: details,
                icon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%231e3a8a'><path d='M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z'/></svg>"
            });
        } catch (e) {
            // Ignore push error
        }
    }

    if (localStorage.getItem(STORAGE_KEYS.AUTO_SYNC) === 'true') {
        debounceCloudSync();
    }
}

// Debounce helper to prevent spamming Google Sheets
let syncDebounceTimer = null;
function debounceCloudSync() {
    clearTimeout(syncDebounceTimer);
    syncDebounceTimer = setTimeout(() => {
        pushDataToGoogleSheets(true);
    }, 1500);
}

// Save all data to LocalStorage
function persistAllData() {
    localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(appBooks));
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(appStudents));
    localStorage.setItem(STORAGE_KEYS.BORROWINGS, JSON.stringify(appBorrowings));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(appSettings));

    if (localStorage.getItem(STORAGE_KEYS.AUTO_SYNC) === 'true') {
        debounceCloudSync();
    }
}

// =========================================================================================
// GOOGLE SHEETS CLOUD SYNCHRONIZATION ENGINE
// =========================================================================================

// Setup Cloud Sync on Startup & Visibility changes
function setupCloudSyncOnStartup() {
    const url = localStorage.getItem(STORAGE_KEYS.SHEET_URL);
    if (url) {
        fetchDataFromGoogleSheets(true);
    }

    setInterval(() => {
        const autoSync = localStorage.getItem(STORAGE_KEYS.AUTO_SYNC) === 'true';
        const url = localStorage.getItem(STORAGE_KEYS.SHEET_URL);
        if (autoSync && url && !document.hidden && !isSyncingWithCloud) {
            fetchDataFromGoogleSheets(true);
        }
    }, 60000);

    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            const url = localStorage.getItem(STORAGE_KEYS.SHEET_URL);
            if (url && !isSyncingWithCloud) {
                fetchDataFromGoogleSheets(true);
            }
        }
    });
}

// Update Top App Bar Cloud Sync Pill
function updateCloudSyncPill(statusText, state = 'synced') {
    const pill = document.getElementById('cloud-sync-pill');
    const dot = document.getElementById('cloud-sync-dot');
    const text = document.getElementById('cloud-sync-text');

    if (!pill || !dot || !text) return;

    text.textContent = statusText;

    dot.className = 'sync-status-dot';
    if (state === 'syncing') {
        dot.classList.add('syncing');
        pill.style.borderColor = 'var(--primary-border)';
    } else if (state === 'synced') {
        dot.classList.add('synced');
        pill.style.borderColor = 'var(--success-border)';
    } else if (state === 'error') {
        dot.classList.add('error');
        pill.style.borderColor = 'var(--danger-border)';
    } else {
        dot.classList.add('offline');
        pill.style.borderColor = 'var(--border-color)';
    }
}

// Fetch all data from Google Sheets (Pull / GET)
async function fetchDataFromGoogleSheets(silent = false) {
    const url = localStorage.getItem(STORAGE_KEYS.SHEET_URL);
    if (!url) {
        updateCloudSyncPill('ទិន្នន័យក្នុងម៉ាស៊ីន (Offline)', 'offline');
        return;
    }

    isSyncingWithCloud = true;
    updateCloudSyncPill('កំពុងទាញទិន្នន័យពី Cloud...', 'syncing');

    try {
        const fetchUrl = url + (url.includes('?') ? '&' : '?') + 't=' + Date.now();
        const response = await fetch(fetchUrl, {
            method: 'GET',
            redirect: 'follow',
            headers: { 'Accept': 'application/json' }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data && data.status === 'success') {
            // Set Books
            if (Array.isArray(data.books)) {
                appBooks = data.books;
                localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(appBooks));
            }

            // Set Students
            if (Array.isArray(data.students)) {
                appStudents = data.students;
                localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(appStudents));
            }

            // Set Borrowings
            if (Array.isArray(data.borrowings)) {
                appBorrowings = data.borrowings;
                localStorage.setItem(STORAGE_KEYS.BORROWINGS, JSON.stringify(appBorrowings));
            }

            // Set Settings
            if (data.settings && Object.keys(data.settings).length > 0) {
                appSettings = Object.assign({}, DEFAULT_SETTINGS, data.settings);
                localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(appSettings));
            }

            recalculateBookStock();
            updateOverdueStatus();

            const nowStr = new Date().toLocaleTimeString('km-KH', { hour12: false });
            localStorage.setItem(STORAGE_KEYS.LAST_SYNC, `ជោគជ័យ ម៉ោង ${nowStr}`);

            updateCloudSyncPill('បានភ្ជាប់ Cloud (Google Sheets)', 'synced');

            if (!silent) {
                showToast('បានទាញយកទិន្នន័យចុងក្រោយពី Google Sheets ដោយជោគជ័យ!', 'success');
            }

            // Refresh UI Views
            if (typeof renderDashboard === 'function') renderDashboard();
            if (typeof renderBooksTable === 'function') renderBooksTable();
            if (typeof renderStudentsTable === 'function') renderStudentsTable();
            if (typeof renderBorrowingsTable === 'function') renderBorrowingsTable();
            if (typeof renderReportPreview === 'function') renderReportPreview();
            if (typeof updateHeaderSchoolInfo === 'function') updateHeaderSchoolInfo();
        } else {
            throw new Error('ទិន្នន័យឆ្លើយតបពី Google Sheets មិនត្រឹមត្រូវ');
        }
    } catch (err) {
        console.warn('Google Sheets Fetch Error:', err);
        updateCloudSyncPill('ទិន្នន័យក្នុងម៉ាស៊ីន (Offline)', 'error');
        if (!silent) {
            showToast('មិនអាចទាញយកទិន្នន័យពី Google Sheets បានទេ! ប្រព័ន្ធកំពុងដំណើរការ Offline', 'warning');
        }
    } finally {
        isSyncingWithCloud = false;
    }
}

// Push all data to Google Sheets (Save / POST)
async function pushDataToGoogleSheets(silent = false) {
    const url = localStorage.getItem(STORAGE_KEYS.SHEET_URL);
    if (!url) {
        if (!silent) {
            showToast('សូមបញ្ចូល Google Apps Script Webhook URL ជាមុនសិន!', 'warning');
        }
        return;
    }

    isSyncingWithCloud = true;
    updateCloudSyncPill('កំពុងរក្សាទុកទៅ Cloud...', 'syncing');

    const payload = {
        timestamp: new Date().toISOString(),
        books: appBooks,
        students: appStudents,
        borrowings: appBorrowings,
        settings: appSettings,
        logs: appActivityLogs.slice(0, 50)
    };

    try {
        await fetch(url, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(payload)
        });

        const nowStr = new Date().toLocaleTimeString('km-KH', { hour12: false });
        localStorage.setItem(STORAGE_KEYS.LAST_SYNC, `ជោគជ័យ ម៉ោង ${nowStr}`);

        updateCloudSyncPill('បានភ្ជាប់ Cloud (Google Sheets)', 'synced');

        if (!silent) {
            showToast('បានរក្សាទុកទិន្នន័យទៅកាន់ Google Sheets រួចរាល់!', 'success');
        }
    } catch (err) {
        console.error('Google Sheets Push Error:', err);
        updateCloudSyncPill('បរាជ័យក្នុងការសមកាលកម្ម', 'error');
        if (!silent) {
            showToast('បរាជ័យក្នុងការរក្សាទុកទៅកាន់ Google Sheets! សូមពិនិត្យ Webhook URL', 'danger');
        }
    } finally {
        isSyncingWithCloud = false;
    }
}
