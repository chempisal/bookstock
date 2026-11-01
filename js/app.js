/**
 * app.js - Main Application Orchestrator & Controller
 * គ្រប់គ្រងផ្ទាំងទិដ្ឋភាពទូទៅ (Dashboard), ការរុករកទំព័រ (Navigation), ការផ្ទៀងផ្ទាត់ (Auth), និង Activity Notifications
 */

let currentView = 'dashboard';

// DOM Ready Event Listener
document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Data
    initDataStore();

    // 2. Setup Global Event Listeners & Notification Center
    setupAppEventListeners();
    setupNotificationCenter();

    // 3. Check Authentication
    checkAuthSession();

    // 4. Update UI labels with School info
    updateHeaderSchoolInfo();

    // 5. Initialize Sub-modules
    initBooksView();
    initStudentsView();
    initBorrowingsView();
    initReportsView();
    initSettingsView();

    // 6. Render Initial Dashboard
    renderDashboard();

    // 7. Initialize Lucide Icons
    if (window.lucide) {
        lucide.createIcons();
    }
});

// Update Top App Bar and Sidebar School/User metadata
function updateHeaderSchoolInfo() {
    const schoolTag = document.getElementById('topbar-school-name');
    if (schoolTag) schoolTag.textContent = appSettings.schoolName || 'វិទ្យាល័យ / អនុវិទ្យាល័យ';

    const userLabel = document.getElementById('sidebar-user-name');
    if (userLabel) userLabel.textContent = appSettings.librarianName || 'បណ្ណារក្ស';
}

// Setup Global Navigation & Event Listeners
function setupAppEventListeners() {
    // Navigation item click listeners (Sidebar)
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item[data-view]');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const viewName = item.getAttribute('data-view');
            switchView(viewName);
        });
    });

    // Mobile Navigation & Drawer Controls
    const mobileBtn = document.getElementById('mobile-menu-toggle');
    const sidebar = document.getElementById('app-sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    const sidebarCloseBtn = document.getElementById('sidebar-close-btn');
    const mobileMoreBtn = document.getElementById('mobile-more-btn');

    function openMobileSidebar() {
        if (sidebar) sidebar.classList.add('open');
        if (backdrop) backdrop.classList.add('active');
    }

    function closeMobileSidebar() {
        if (sidebar) sidebar.classList.remove('open');
        if (backdrop) backdrop.classList.remove('active');
    }

    if (mobileBtn) {
        mobileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (sidebar && sidebar.classList.contains('open')) {
                closeMobileSidebar();
            } else {
                openMobileSidebar();
            }
        });
    }

    if (mobileMoreBtn) {
        mobileMoreBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openMobileSidebar();
        });
    }

    if (sidebarCloseBtn) {
        sidebarCloseBtn.addEventListener('click', closeMobileSidebar);
    }

    if (backdrop) {
        backdrop.addEventListener('click', closeMobileSidebar);
    }

    // Mobile Bottom Navigation Buttons
    const mobileBottomNavBtns = document.querySelectorAll('.mobile-bottom-nav .mobile-nav-btn[data-view]');
    mobileBottomNavBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const viewName = btn.getAttribute('data-view');
            switchView(viewName);
            closeMobileSidebar();
        });
    });

    document.addEventListener('click', (e) => {
        if (sidebar && sidebar.classList.contains('open')) {
            if (!sidebar.contains(e.target) && !mobileBtn?.contains(e.target) && !mobileMoreBtn?.contains(e.target)) {
                closeMobileSidebar();
            }
        }
    });

    const syncPill = document.getElementById('cloud-sync-pill');
    if (syncPill) {
        syncPill.addEventListener('click', () => {
            fetchDataFromGoogleSheets(false);
        });
    }

    const closeButtons = document.querySelectorAll('.modal-close-btn, .modal-cancel-btn');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });

    const modalOverlays = document.querySelectorAll('.modal-overlay');
    modalOverlays.forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeAllModals();
            }
        });
    });

    const bookForm = document.getElementById('book-form');
    if (bookForm) bookForm.addEventListener('submit', handleBookFormSubmit);

    const stockAdjustForm = document.getElementById('stock-adjust-form');
    if (stockAdjustForm) stockAdjustForm.addEventListener('submit', handleStockAdjustSubmit);

    const studentForm = document.getElementById('student-form');
    if (studentForm) studentForm.addEventListener('submit', handleStudentFormSubmit);

    const borrowForm = document.getElementById('borrow-form');
    if (borrowForm) borrowForm.addEventListener('submit', handleBorrowFormSubmit);

    const returnForm = document.getElementById('return-form');
    if (returnForm) returnForm.addEventListener('submit', handleReturnFormSubmit);

    const borrowStudentSelect = document.getElementById('borrow-student-select');
    if (borrowStudentSelect) {
        borrowStudentSelect.addEventListener('change', handleBorrowStudentChange);
    }

    const showAllGradesCheckbox = document.getElementById('borrow-show-all-grades');
    if (showAllGradesCheckbox) {
        showAllGradesCheckbox.addEventListener('change', () => {
            const currentGrade = document.getElementById('borrow-student-grade')?.value || '';
            renderBorrowBookCheckboxes(currentGrade);
        });
    }

    const studentImportFile = document.getElementById('student-import-file');
    if (studentImportFile) {
        studentImportFile.addEventListener('change', handleStudentFileImport);
    }

    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLoginSubmit);
    }

    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
}

// Setup System Activity Notifications Center
function setupNotificationCenter() {
    const notifBtn = document.getElementById('notification-bell-btn');
    const notifDropdown = document.getElementById('notification-dropdown-panel');
    const clearBtn = document.getElementById('clear-notifications-btn');
    const enablePushBtn = document.getElementById('enable-push-notifications-btn');

    if (notifBtn && notifDropdown) {
        notifBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = notifDropdown.classList.contains('active');
            if (isOpen) {
                notifDropdown.classList.remove('active');
            } else {
                notifDropdown.classList.add('active');
                renderNotificationList();
                markAllNotificationsAsRead();
            }
        });

        document.addEventListener('click', (e) => {
            if (!notifDropdown.contains(e.target) && !notifBtn.contains(e.target)) {
                notifDropdown.classList.remove('active');
            }
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            appActivityLogs = [];
            localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify([]));
            renderNotificationList();
            updateNotificationBadge();
            showToast('បានសម្អាតប្រវត្តិសកម្មភាពទាំងអស់!', 'primary');
        });
    }

    if (enablePushBtn) {
        enablePushBtn.addEventListener('click', async () => {
            if ("Notification" in window) {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    showToast('បានបើកដំណើរការ Desktop Push Notification!', 'success');
                    enablePushBtn.style.display = 'none';
                } else {
                    showToast('មិនបានអនុញ្ញាតឱ្យបើកការជូនដំណឹងទេ', 'warning');
                }
            } else {
                showToast('កម្មវិធីរុករកនេះមិនគាំទ្រ Push Notification ទេ', 'warning');
            }
        });

        if ("Notification" in window && Notification.permission === "granted") {
            enablePushBtn.style.display = 'none';
        }
    }

    updateNotificationBadge();
}

// Update Notification Badge Count
function updateNotificationBadge() {
    const badge = document.getElementById('notification-badge-count');
    if (!badge) return;

    const unreadCount = appActivityLogs.filter(l => l.unread).length;
    if (unreadCount > 0) {
        badge.style.display = 'flex';
        badge.textContent = toKhmerNumber(unreadCount > 99 ? '99+' : unreadCount);
    } else {
        badge.style.display = 'none';
    }
}

// Mark All Notifications as Read
function markAllNotificationsAsRead() {
    let changed = false;
    appActivityLogs.forEach(l => {
        if (l.unread) {
            l.unread = false;
            changed = true;
        }
    });
    if (changed) {
        localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(appActivityLogs));
        updateNotificationBadge();
    }
}

// Render Notification Items inside Dropdown
function renderNotificationList() {
    const list = document.getElementById('notification-items-list');
    if (!list) return;

    if (appActivityLogs.length === 0) {
        list.innerHTML = `
            <div style="text-align: center; padding: 30px 16px; color: var(--text-muted);">
                <i data-lucide="bell-off" style="width: 32px; height: 32px; margin-bottom: 6px; display: inline-block;"></i>
                <p style="font-size: 13px;">គ្មានសកម្មភាពថ្មីៗទេ</p>
            </div>
        `;
        if (window.lucide) lucide.createIcons();
        return;
    }

    list.innerHTML = appActivityLogs.slice(0, 30).map(item => {
        let iconBg = 'var(--primary-light)';
        let iconColor = 'var(--primary)';
        let iconName = item.icon || 'bell';

        if (item.type === 'borrow') {
            iconBg = 'var(--accent-light)';
            iconColor = 'var(--accent)';
            iconName = 'book-open';
        } else if (item.type === 'return') {
            iconBg = 'var(--success-light)';
            iconColor = 'var(--success)';
            iconName = 'check-check';
        } else if (item.type === 'stock') {
            iconBg = 'var(--primary-light)';
            iconColor = 'var(--primary)';
            iconName = 'package';
        } else if (item.type === 'warning') {
            iconBg = 'var(--danger-light)';
            iconColor = 'var(--danger)';
            iconName = 'alert-triangle';
        } else if (item.type === 'sync') {
            iconBg = 'var(--success-light)';
            iconColor = 'var(--success)';
            iconName = 'cloud';
        }

        return `
            <div class="notification-item ${item.unread ? 'unread' : ''}">
                <div class="notification-item-icon" style="background-color: ${iconBg}; color: ${iconColor};">
                    <i data-lucide="${iconName}"></i>
                </div>
                <div class="notification-item-content">
                    <div class="notification-item-title">${item.action}</div>
                    <div class="notification-item-desc">${item.details}</div>
                    <div class="notification-item-time">${formatRelativeKhmerTime(item.timestamp)}</div>
                </div>
            </div>
        `;
    }).join('');

    if (window.lucide) lucide.createIcons();
}

// Switch between views
function switchView(viewName) {
    currentView = viewName;

    const navItems = document.querySelectorAll('.sidebar-nav .nav-item[data-view]');
    navItems.forEach(item => {
        if (item.getAttribute('data-view') === viewName) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    const mobileNavBtns = document.querySelectorAll('.mobile-bottom-nav .mobile-nav-btn[data-view]');
    mobileNavBtns.forEach(btn => {
        if (btn.getAttribute('data-view') === viewName) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    const sidebar = document.getElementById('app-sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    if (sidebar) sidebar.classList.remove('open');
    if (backdrop) backdrop.classList.remove('active');

    const viewSections = document.querySelectorAll('.view-section');
    viewSections.forEach(section => {
        if (section.id === `view-${viewName}`) {
            section.classList.add('active');
        } else {
            section.classList.remove('active');
        }
    });

    if (viewName === 'dashboard') {
        renderDashboard();
    } else if (viewName === 'books') {
        renderBooksTable();
    } else if (viewName === 'students') {
        renderStudentsTable();
    } else if (viewName === 'borrowings') {
        renderBorrowingsTable();
    } else if (viewName === 'reports') {
        renderReportPreview();
        if (window.innerWidth <= 768 && typeof applyReportMobileFit === 'function') {
            setTimeout(() => applyReportMobileFit(true), 60);
        }
    } else if (viewName === 'settings') {
        loadSettingsIntoForm();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (window.lucide) {
        lucide.createIcons();
    }
}

// Close all modal dialogs
function closeAllModals() {
    const overlays = document.querySelectorAll('.modal-overlay');
    overlays.forEach(o => o.classList.remove('active'));
}

// Render Dashboard View Metrics & Visuals
function renderDashboard() {
    let totalTitles = appBooks.length;
    let totalStock = 0;
    let totalBorrowed = 0;

    appBooks.forEach(b => {
        totalStock += Number(b.quantity) || 0;
        totalBorrowed += Number(b.borrowed) || 0;
    });

    let totalAvailable = Math.max(0, totalStock - totalBorrowed);

    const activeBorrowersSet = new Set();
    let overdueCount = 0;

    appBorrowings.forEach(br => {
        const hasUnreturned = (br.books || []).some(b => b.status !== 'returned');
        if (hasUnreturned) {
            activeBorrowersSet.add(br.studentId);
            if (br.status === 'overdue' || (br.books || []).some(b => b.status === 'overdue')) {
                overdueCount++;
            }
        }
    });

    document.getElementById('metric-total-titles').textContent = toKhmerNumber(totalTitles);
    document.getElementById('metric-total-stock').textContent = toKhmerNumber(totalStock);
    document.getElementById('metric-total-borrowed').textContent = toKhmerNumber(totalBorrowed);
    document.getElementById('metric-total-available').textContent = toKhmerNumber(totalAvailable);
    document.getElementById('metric-overdue-count').textContent = toKhmerNumber(overdueCount);

    const overdueBadge = document.getElementById('nav-overdue-badge');
    const mobileOverdueBadge = document.getElementById('mobile-overdue-badge');
    if (overdueBadge) {
        if (overdueCount > 0) {
            overdueBadge.style.display = 'inline-block';
            overdueBadge.textContent = toKhmerNumber(overdueCount);
        } else {
            overdueBadge.style.display = 'none';
        }
    }
    if (mobileOverdueBadge) {
        if (overdueCount > 0) {
            mobileOverdueBadge.style.display = 'inline-block';
            mobileOverdueBadge.textContent = toKhmerNumber(overdueCount);
        } else {
            mobileOverdueBadge.style.display = 'none';
        }
    }

    renderDashboardGradeDistribution();
    renderDashboardRecentActivities();
    renderDashboardLowStock();

    if (window.lucide) lucide.createIcons();
}

// Render Dashboard Grade Distribution Breakdown
function renderDashboardGradeDistribution() {
    const container = document.getElementById('dashboard-grade-distribution');
    if (!container) return;

    if (appBooks.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; color: var(--text-muted); padding: 18px 10px; font-size: 13px;">
                <p>មិនទាន់មានទិន្នន័យសៀវភៅតាមកម្រិតថ្នាក់</p>
            </div>
        `;
        return;
    }

    const grades = ['7', '8', '9', '10', '11', '12'];
    let html = '';

    grades.forEach(g => {
        const books = appBooks.filter(b => String(b.grade) === String(g));
        let gradeStock = 0;
        let gradeBorrowed = 0;

        books.forEach(b => {
            gradeStock += Number(b.quantity) || 0;
            gradeBorrowed += Number(b.borrowed) || 0;
        });

        const percent = gradeStock > 0 ? Math.round((gradeBorrowed / gradeStock) * 100) : 0;

        html += `
            <div style="margin-bottom: 14px;">
                <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px;">
                    <span style="font-weight: 600;">ថ្នាក់ទី ${toKhmerNumber(g)}</span>
                    <span style="color: var(--text-muted); font-size: 12px;">
                        ខ្ចី ${toKhmerNumber(gradeBorrowed)} / ${toKhmerNumber(gradeStock)} ក្បាល (${toKhmerNumber(percent)}%)
                    </span>
                </div>
                <div style="width: 100%; height: 7px; background-color: #e2e8f0; border-radius: 9999px; overflow: hidden;">
                    <div style="height: 100%; width: ${percent}%; background: linear-gradient(90deg, #1e3a8a, #3b82f6); border-radius: 9999px;"></div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

// Render Dashboard Recent Activities Table
function renderDashboardRecentActivities() {
    const tbody = document.getElementById('dashboard-recent-activities');
    if (!tbody) return;

    if (appBorrowings.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 24px; color: var(--text-muted);">មិនទាន់មានសកម្មភាពខ្ចី-សងសៀវភៅនៅឡើយទេ</td></tr>`;
        return;
    }

    const recent = [...appBorrowings]
        .sort((a, b) => new Date(b.borrowDate) - new Date(a.borrowDate))
        .slice(0, 5);

    tbody.innerHTML = recent.map((br) => {
        const bookTitles = (br.books || []).map(b => {
            const bookObj = appBooks.find(bk => bk.id === b.bookId);
            return bookObj ? bookObj.title : b.title || 'សៀវភៅ';
        }).join(', ');

        let statusBadge = '<span class="badge badge-borrowing">កំពុងខ្ចី</span>';
        if (br.status === 'returned') {
            statusBadge = '<span class="badge badge-returned">បានសង</span>';
        } else if (br.status === 'overdue') {
            statusBadge = '<span class="badge badge-overdue">ហួសកំណត់</span>';
        }

        return `
            <tr>
                <td style="font-weight: 600;">${br.studentName}</td>
                <td style="text-align: center;">ថ្នាក់ទី ${toKhmerNumber(br.grade)} (${br.class})</td>
                <td style="max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${bookTitles}">
                    ${bookTitles}
                </td>
                <td style="text-align: center;">${formatKhmerDate(br.borrowDate)}</td>
                <td style="text-align: center;">${statusBadge}</td>
            </tr>
        `;
    }).join('');
}

// Render Low Stock Alert Widget in Dashboard
function renderDashboardLowStock() {
    const listContainer = document.getElementById('dashboard-low-stock-list');
    if (!listContainer) return;

    if (appBooks.length === 0) {
        listContainer.innerHTML = `
            <div style="text-align: center; color: var(--text-muted); padding: 18px 10px; font-size: 13px;">
                <p>មិនទាន់មានទិន្នន័យសៀវភៅនៅឡើយទេ</p>
            </div>
        `;
        return;
    }

    const lowStockBooks = appBooks
        .map(b => {
            const total = Number(b.quantity) || 0;
            const borrowed = Number(b.borrowed) || 0;
            const available = Math.max(0, total - borrowed);
            return { ...b, available };
        })
        .filter(b => b.available <= 10)
        .sort((a, b) => a.available - b.available)
        .slice(0, 5);

    if (lowStockBooks.length === 0) {
        listContainer.innerHTML = `
            <div style="text-align: center; color: var(--success); padding: 18px 10px; font-weight: 600;">
                <i data-lucide="check-circle" style="width: 32px; height: 32px; margin-bottom: 6px; display: inline-block;"></i>
                <p>សៀវភៅទាំងអស់មានស្តុកគ្រប់គ្រាន់!</p>
            </div>
        `;
        return;
    }

    listContainer.innerHTML = lowStockBooks.map(b => {
        const isOut = b.available === 0;
        return `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border-color);">
                <div>
                    <div style="font-weight: 600; font-size: 13px;">${b.title}</div>
                    <div style="font-size: 11px; color: var(--text-muted);">ថ្នាក់ទី ${toKhmerNumber(b.grade)} | មុខវិជ្ជា៖ ${b.subject}</div>
                </div>
                <div>
                    <span class="badge ${isOut ? 'badge-stock-out' : 'badge-stock-low'}">
                        ${isOut ? 'អស់ពីស្តុក' : `សល់ ${toKhmerNumber(b.available)} ក្បាល`}
                    </span>
                </div>
            </div>
        `;
    }).join('');
}

// Toast Notifications System
function showToast(message, type = 'primary') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconName = 'bell';
    if (type === 'success') iconName = 'check-circle-2';
    else if (type === 'danger') iconName = 'alert-triangle';
    else if (type === 'warning') iconName = 'alert-circle';

    toast.innerHTML = `
        <i data-lucide="${iconName}" style="width: 20px; height: 20px; flex-shrink: 0;"></i>
        <div style="flex: 1;">${message}</div>
    `;

    container.appendChild(toast);
    if (window.lucide) lucide.createIcons();

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 250);
    }, 3500);
}

// Check Authentication Session
function checkAuthSession() {
    const isLoggedIn = sessionStorage.getItem('tb_is_logged_in') === 'true' ||
                       localStorage.getItem('tb_remember_me') === 'true';

    const loginScreen = document.getElementById('login-screen-modal');
    if (!isLoggedIn && loginScreen) {
        loginScreen.classList.add('active');
    } else if (loginScreen) {
        loginScreen.classList.remove('active');
    }
}

// Handle Login Form Submit
function handleLoginSubmit(e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    const remember = document.getElementById('login-remember-me').checked;
    const errorMsg = document.getElementById('login-error-msg');

    const savedPassword = localStorage.getItem('tb_librarian_password') || '123456';

    if (username.toLowerCase() === 'admin' && password === savedPassword) {
        sessionStorage.setItem('tb_is_logged_in', 'true');
        if (remember) {
            localStorage.setItem('tb_remember_me', 'true');
        }

        const loginScreen = document.getElementById('login-screen-modal');
        if (loginScreen) loginScreen.classList.remove('active');

        if (errorMsg) errorMsg.style.display = 'none';
        logActivity('ចូលប្រើប្រព័ន្ធ', 'បណ្ណារក្សបានចូលប្រើប្រាស់ប្រព័ន្ធដោយជោគជ័យ', 'system', 'log-in');
        renderDashboard();
    } else {
        if (errorMsg) errorMsg.style.display = 'flex';
        showToast('ឈ្មោះគណនី ឬលេខសម្ងាត់មិនត្រឹមត្រូវទេ!', 'danger');
    }
}

// Handle Logout
function handleLogout() {
    if (confirm('តើលោកអ្នកពិតជាចង់ចាកចេញពីគណនីបណ្ណារក្សមែនទេ?')) {
        sessionStorage.removeItem('tb_is_logged_in');
        localStorage.removeItem('tb_remember_me');

        const loginScreen = document.getElementById('login-screen-modal');
        if (loginScreen) loginScreen.classList.add('active');

        document.getElementById('login-form').reset();
        logActivity('ចាកចេញពីប្រព័ន្ធ', 'បណ្ណារក្សបានចាកចេញពីប្រព័ន្ធ', 'system', 'log-out');
    }
}
