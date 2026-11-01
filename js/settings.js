/**
 * settings.js - School Profile, System Configuration, Google Sheets Cloud Sync & Data Backup
 * ការកំណត់ព័ត៌មានសាលារៀន, ការបម្រុងទុកទិន្នន័យ (Backup/Restore), និងសមកាលកម្ម Google Sheets
 */

// Initialize Settings View
function initSettingsView() {
    loadSettingsIntoForm();
    setupSettingsListeners();
}

// Load current settings into settings form inputs
function loadSettingsIntoForm() {
    document.getElementById('settings-district-office').value = appSettings.districtOffice || '';
    document.getElementById('settings-school-name').value = appSettings.schoolName || '';
    document.getElementById('settings-academic-year').value = appSettings.academicYear || '';
    document.getElementById('settings-principal-name').value = appSettings.principalName || '';
    document.getElementById('settings-librarian-name').value = appSettings.librarianName || '';
    document.getElementById('settings-loan-duration').value = appSettings.loanDurationDays || 14;
    document.getElementById('settings-receipt-note').value = appSettings.receiptNote || '';

    // Google Sheets settings
    const webhookUrl = localStorage.getItem(STORAGE_KEYS.SHEET_URL) || '';
    const autoSync = localStorage.getItem(STORAGE_KEYS.AUTO_SYNC) === 'true';
    const lastSync = localStorage.getItem(STORAGE_KEYS.LAST_SYNC) || 'មិនទាន់សមកាលកម្ម';

    const webhookInput = document.getElementById('settings-sheet-url');
    const autoSyncInput = document.getElementById('settings-sheet-auto');
    const lastSyncLabel = document.getElementById('settings-sheet-last-sync');

    if (webhookInput) webhookInput.value = webhookUrl;
    if (autoSyncInput) autoSyncInput.checked = autoSync;
    if (lastSyncLabel) lastSyncLabel.textContent = lastSync;
}

// Setup Event Listeners for Settings
function setupSettingsListeners() {
    const schoolForm = document.getElementById('school-profile-form');
    if (schoolForm) {
        schoolForm.addEventListener('submit', handleSaveSchoolProfile);
    }

    const sheetsForm = document.getElementById('sheets-sync-form');
    if (sheetsForm) {
        sheetsForm.addEventListener('submit', handleSaveSheetsConfig);
    }

    const backupBtn = document.getElementById('backup-json-btn');
    if (backupBtn) {
        backupBtn.addEventListener('click', exportFullBackupJSON);
    }

    const restoreInput = document.getElementById('restore-json-input');
    if (restoreInput) {
        restoreInput.addEventListener('change', handleRestoreJSON);
    }

    // Clear all data button
    const clearBtn = document.getElementById('reset-demo-data-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', handleClearAllData);
    }

    // Pull Button (Fetch from Google Sheets)
    const pullSheetsBtn = document.getElementById('pull-sheets-now-btn');
    if (pullSheetsBtn) {
        pullSheetsBtn.addEventListener('click', () => {
            fetchDataFromGoogleSheets(false);
        });
    }

    // Push Button (Save to Google Sheets)
    const pushSheetsBtn = document.getElementById('sync-sheets-now-btn');
    if (pushSheetsBtn) {
        pushSheetsBtn.addEventListener('click', () => {
            pushDataToGoogleSheets(false);
        });
    }

    // Show Google Apps Script Code modal button
    const viewScriptBtn = document.getElementById('view-apps-script-btn');
    if (viewScriptBtn) {
        viewScriptBtn.addEventListener('click', openAppsScriptGuideModal);
    }

    const changePwForm = document.getElementById('change-password-form');
    if (changePwForm) {
        changePwForm.addEventListener('submit', handleChangePassword);
    }
}

// Save School Profile Settings
function handleSaveSchoolProfile(e) {
    e.preventDefault();

    appSettings.districtOffice = document.getElementById('settings-district-office').value.trim();
    appSettings.schoolName = document.getElementById('settings-school-name').value.trim();
    appSettings.academicYear = document.getElementById('settings-academic-year').value.trim();
    appSettings.principalName = document.getElementById('settings-principal-name').value.trim();
    appSettings.librarianName = document.getElementById('settings-librarian-name').value.trim();
    appSettings.loanDurationDays = parseInt(document.getElementById('settings-loan-duration').value, 10) || 14;
    appSettings.receiptNote = document.getElementById('settings-receipt-note').value.trim();

    persistAllData();

    // Update Top App Bar School Name
    const schoolTag = document.getElementById('topbar-school-name');
    if (schoolTag) schoolTag.textContent = appSettings.schoolName;

    const librarianLabel = document.getElementById('sidebar-user-name');
    if (librarianLabel) librarianLabel.textContent = appSettings.librarianName || 'បណ្ណារក្ស';

    logActivity('កែប្រែព័ត៌មានសាលា', `បានរក្សាទុកព័ត៌មានសាលារៀន "${appSettings.schoolName}"`, 'system', 'settings');
    renderReportPreview();
}

// Save Google Sheets Sync Config
function handleSaveSheetsConfig(e) {
    e.preventDefault();
    const url = document.getElementById('settings-sheet-url').value.trim();
    const auto = document.getElementById('settings-sheet-auto').checked;

    localStorage.setItem(STORAGE_KEYS.SHEET_URL, url);
    localStorage.setItem(STORAGE_KEYS.AUTO_SYNC, auto ? 'true' : 'false');

    logActivity('ការកំណត់ Cloud Sync', `បានរក្សាទុក Google Sheets URL (${auto ? 'ស្វ័យប្រវត្តិ' : 'ដោយដៃ'})`, 'sync', 'cloud');

    if (url) {
        fetchDataFromGoogleSheets(false);
    }
}

// Open Google Apps Script Modal Guide
function openAppsScriptGuideModal() {
    const modal = document.getElementById('apps-script-guide-modal');
    if (modal) {
        modal.classList.add('active');
        if (window.lucide) lucide.createIcons();
    }
}

// Export Full Database as JSON Backup
function exportFullBackupJSON() {
    const backupData = {
        exportDate: new Date().toISOString(),
        version: '3.0.0',
        school: appSettings,
        books: appBooks,
        students: appStudents,
        borrowings: appBorrowings,
        logs: appActivityLogs
    };

    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `BookStock_Backup_${(appSettings.schoolName || 'school').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();

    logActivity('បម្រុងទុកទិន្នន័យ JSON', 'បានទាញយកឯកសារបម្រុងទុកមូលដ្ឋានទិន្នន័យពេញលេញ (JSON)', 'system', 'download');
}

// Restore Database from JSON
function handleRestoreJSON(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (!confirm('ការស្តារទិន្នន័យឡើងវិញ នឹងជំនួសទិន្នន័យបច្ចុប្បន្នទាំងអស់! តើលោកអ្នកពិតជាចង់បន្តមែនទេ?')) {
        e.target.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = function (event) {
        try {
            const data = JSON.parse(event.target.result);
            if (!Array.isArray(data.books) || !Array.isArray(data.students) || !Array.isArray(data.borrowings)) {
                throw new Error('ទម្រង់ឯកសារ JSON មិនត្រឹមត្រូវ!');
            }

            appBooks = data.books;
            appStudents = data.students;
            appBorrowings = data.borrowings;
            if (data.school) {
                appSettings = Object.assign({}, DEFAULT_SETTINGS, data.school);
            }
            if (data.logs && Array.isArray(data.logs)) {
                appActivityLogs = data.logs;
                localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(appActivityLogs));
            }

            persistAllData();
            recalculateBookStock();
            updateOverdueStatus();

            loadSettingsIntoForm();
            renderDashboard();
            renderBooksTable();
            renderStudentsTable();
            renderBorrowingsTable();
            renderReportPreview();

            logActivity('ស្តារទិន្នន័យឡើងវិញ', 'បានស្តារទិន្នន័យប្រព័ន្ធពីឯកសារ JSON ដោយជោគជ័យ', 'system', 'upload');
        } catch (err) {
            console.error(err);
            showToast('មិនអាចស្តារទិន្នន័យបានទេ! ឯកសារមិនត្រឹមត្រូវ', 'danger');
        }
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
}

// Clear all data from system (Clean slate)
function handleClearAllData() {
    if (confirm('តើលោកអ្នកពិតជាចង់សម្អាត និងលុបទិន្នន័យទាំងអស់ (សៀវភៅ, សិស្ស, និងការខ្ចី-សង) ចេញពីប្រព័ន្ធមែនទេ? ទិន្នន័យទាំងអស់នឹងចាប់ផ្តើមជាទទេស្អាត!')) {
        appBooks = [];
        appStudents = [];
        appBorrowings = [];
        appActivityLogs = [];

        persistAllData();
        recalculateBookStock();
        updateOverdueStatus();

        loadSettingsIntoForm();
        renderDashboard();
        renderBooksTable();
        renderStudentsTable();
        renderBorrowingsTable();
        renderReportPreview();

        logActivity('សម្អាតទិន្នន័យ', 'បានសម្អាត និងលុបទិន្នន័យទាំងអស់ចេញពីប្រព័ន្ធ', 'warning', 'trash-2');
        showToast('បានសម្អាតទិន្នន័យទាំងអស់រួចរាល់! ប្រព័ន្ធចាប់ផ្តើមជាទទេស្អាត', 'success');
    }
}

// Change Librarian Password
function handleChangePassword(e) {
    e.preventDefault();
    const oldPw = document.getElementById('old-password').value;
    const newPw = document.getElementById('new-password').value;
    const confirmPw = document.getElementById('confirm-password').value;

    const currentSavedPw = localStorage.getItem('tb_librarian_password') || '123456';

    if (oldPw !== currentSavedPw) {
        showToast('លេខសម្ងាត់ចាស់មិនត្រឹមត្រូវទេ!', 'danger');
        return;
    }

    if (newPw.length < 4) {
        showToast('លេខសម្ងាត់ថ្មីត្រូវមានយ៉ាងហោច ៤ តួ!', 'warning');
        return;
    }

    if (newPw !== confirmPw) {
        showToast('លេខសម្ងាត់ថ្មីទាំងពីរមិនដូចគ្នាទេ!', 'danger');
        return;
    }

    localStorage.setItem('tb_librarian_password', newPw);
    document.getElementById('change-password-form').reset();
    logActivity('ប្តូរលេខសម្ងាត់', 'បានផ្លាស់ប្តូរលេខសម្ងាត់គណនីបណ្ណារក្សដោយជោគជ័យ', 'system', 'key');
}
