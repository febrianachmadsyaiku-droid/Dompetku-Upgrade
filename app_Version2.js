// ============================================
// DOMPETKU v2.0 - Aplikasi Pencatatan Keuangan
// ============================================

// Data Management
class FinanceApp {
    constructor() {
        this.transactions = [];
        this.budgets = [];
        this.accounts = [];
        this.targets = [];
        this.customCategories = {
            pemasukan: [],
            pengeluaran: []
        };
        this.defaultCategories = {
            pemasukan: [
                { name: 'Gaji', icon: '💵' },
                { name: 'Freelance', icon: '💻' },
                { name: 'Investasi', icon: '📈' },
                { name: 'Bonus', icon: '🎁' },
                { name: 'Lainnya', icon: '📝' }
            ],
            pengeluaran: [
                { name: 'Makanan', icon: '🍽️' },
                { name: 'Transportasi', icon: '🚗' },
                { name: 'Rumah', icon: '🏠' },
                { name: 'Hiburan', icon: '🎭' },
                { name: 'Kesehatan', icon: '⚕️' },
                { name: 'Pendidikan', icon: '📚' },
                { name: 'Utilitas', icon: '⚡' },
                { name: 'Lainnya', icon: '📝' }
            ]
        };
        this.currentMonth = new Date();
        this.reportMonth = new Date();
        this.initializeApp();
    }

    // Initialize App
    initializeApp() {
        this.loadFromStorage();
        this.setupEventListeners();
        this.setDefaultDate();
        this.updateAllViews();
    }

    // Storage Functions
    loadFromStorage() {
        const stored = localStorage.getItem('dompetku_data');
        if (stored) {
            const data = JSON.parse(stored);
            this.transactions = data.transactions || [];
            this.budgets = data.budgets || [];
            this.accounts = data.accounts || [];
            this.targets = data.targets || [];
            this.customCategories = data.customCategories || { pemasukan: [], pengeluaran: [] };
        }
    }

    saveToStorage() {
        const data = {
            transactions: this.transactions,
            budgets: this.budgets,
            accounts: this.accounts,
            targets: this.targets,
            customCategories: this.customCategories
        };
        localStorage.setItem('dompetku_data', JSON.stringify(data));
    }

    // Account Functions
    addAccount(data) {
        const account = {
            id: Date.now(),
            name: data.name,
            type: data.type,
            balance: parseFloat(data.balance) || 0,
            color: data.color || '#4f46e5',
            createdAt: new Date().toISOString()
        };
        this.accounts.push(account);
        this.saveToStorage();
        return account;
    }

    deleteAccount(id) {
        this.accounts = this.accounts.filter(a => a.id != id);
        this.saveToStorage();
    }

    getAccountBalance(accountId) {
        const account = this.accounts.find(a => a.id == accountId);
        if (!account) return 0;

        const income = this.transactions
            .filter(t => t.accountId == accountId && t.type === 'pemasukan')
            .reduce((sum, t) => sum + t.amount, 0);

        const expense = this.transactions
            .filter(t => t.accountId == accountId && t.type === 'pengeluaran')
            .reduce((sum, t) => sum + t.amount, 0);

        return account.balance + income - expense;
    }

    // Target Functions
    addTarget(data) {
        const target = {
            id: Date.now(),
            name: data.name,
            targetAmount: parseFloat(data.targetAmount),
            saved: 0,
            deadline: data.deadline,
            description: data.description,
            accountId: data.accountId,
            createdAt: new Date().toISOString()
        };
        this.targets.push(target);
        this.saveToStorage();
        return target;
    }

    updateTarget(id, data) {
        const index = this.targets.findIndex(t => t.id == id);
        if (index !== -1) {
            this.targets[index] = { ...this.targets[index], ...data };
            this.saveToStorage();
            return true;
        }
        return false;
    }

    deleteTarget(id) {
        this.targets = this.targets.filter(t => t.id != id);
        this.saveToStorage();
    }

    getTotalTargets() {
        return this.targets.reduce((sum, t) => sum + t.saved, 0);
    }

    // Category Functions
    getCategories(type) {
        return [...this.defaultCategories[type], ...this.customCategories[type]];
    }

    addCustomCategory(type, name, icon) {
        if (name.trim()) {
            this.customCategories[type].push({ name: name.trim(), icon: icon || '📝' });
            this.saveToStorage();
            return true;
        }
        return false;
    }

    removeCustomCategory(type, index) {
        this.customCategories[type].splice(index, 1);
        this.saveToStorage();
    }

    // Transaction Functions
    addTransaction(data) {
        const transaction = {
            id: Date.now(),
            type: data.type,
            category: data.category,
            amount: parseFloat(data.amount),
            description: data.description,
            date: data.date,
            accountId: parseInt(data.accountId),
            recurring: data.recurring || 'none',
            createdAt: new Date().toISOString()
        };

        this.transactions.push(transaction);

        if (transaction.recurring !== 'none') {
            this.generateRecurringTransactions(transaction);
        }

        this.saveToStorage();
        return transaction;
    }

    generateRecurringTransactions(transaction) {
        const currentDate = new Date(transaction.date);
        const endDate = new Date();
        endDate.setFullYear(endDate.getFullYear() + 1);

        while (currentDate < endDate) {
            switch (transaction.recurring) {
                case 'daily':
                    currentDate.setDate(currentDate.getDate() + 1);
                    break;
                case 'weekly':
                    currentDate.setDate(currentDate.getDate() + 7);
                    break;
                case 'monthly':
                    currentDate.setMonth(currentDate.getMonth() + 1);
                    break;
                case 'yearly':
                    currentDate.setFullYear(currentDate.getFullYear() + 1);
                    break;
                default:
                    return;
            }

            if (currentDate < endDate) {
                const newTransaction = { ...transaction };
                newTransaction.id = Date.now() + Math.random();
                newTransaction.date = currentDate.toISOString().split('T')[0];
                newTransaction.recurring = 'none';
                this.transactions.push(newTransaction);
            }
        }
    }

    updateTransaction(id, data) {
        const index = this.transactions.findIndex(t => t.id == id);
        if (index !== -1) {
            this.transactions[index] = { ...this.transactions[index], ...data };
            this.saveToStorage();
            return true;
        }
        return false;
    }

    deleteTransaction(id) {
        this.transactions = this.transactions.filter(t => t.id != id);
        this.saveToStorage();
    }

    // Budget Functions
    addBudget(data) {
        const budget = {
            id: Date.now(),
            category: data.category,
            limit: parseFloat(data.limit),
            month: data.month,
            createdAt: new Date().toISOString()
        };
        this.budgets.push(budget);
        this.saveToStorage();
        return budget;
    }

    updateBudget(id, data) {
        const index = this.budgets.findIndex(b => b.id == id);
        if (index !== -1) {
            this.budgets[index] = { ...this.budgets[index], ...data };
            this.saveToStorage();
            return true;
        }
        return false;
    }

    deleteBudget(id) {
        this.budgets = this.budgets.filter(b => b.id != id);
        this.saveToStorage();
    }

    // Calculation Functions
    getMonthTransactions(date) {
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const monthStr = `${year}-${month}`;

        return this.transactions.filter(t => t.date.startsWith(monthStr));
    }

    getMonthIncome(date) {
        return this.getMonthTransactions(date)
            .filter(t => t.type === 'pemasukan')
            .reduce((sum, t) => sum + t.amount, 0);
    }

    getMonthExpense(date) {
        return this.getMonthTransactions(date)
            .filter(t => t.type === 'pengeluaran')
            .reduce((sum, t) => sum + t.amount, 0);
    }

    getTotalBalance() {
        return this.accounts.reduce((sum, acc) => sum + this.getAccountBalance(acc.id), 0);
    }

    getCategoryExpense(date, category) {
        return this.getMonthTransactions(date)
            .filter(t => t.type === 'pengeluaran' && t.category === category)
            .reduce((sum, t) => sum + t.amount, 0);
    }

    getExpenseByCategory(date) {
        const result = {};
        const categories = this.getCategories('pengeluaran');

        categories.forEach(cat => {
            const amount = this.getCategoryExpense(date, cat.name);
            if (amount > 0) {
                result[cat.name] = { amount, icon: cat.icon };
            }
        });

        return result;
    }

    getLast30DaysData() {
        const data = {
            dates: [],
            income: [],
            expense: []
        };

        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            data.dates.push(this.formatDate(date));

            const income = this.transactions
                .filter(t => t.date === dateStr && t.type === 'pemasukan')
                .reduce((sum, t) => sum + t.amount, 0);

            const expense = this.transactions
                .filter(t => t.date === dateStr && t.type === 'pengeluaran')
                .reduce((sum, t) => sum + t.amount, 0);

            data.income.push(income);
            data.expense.push(expense);
        }

        return data;
    }

    // Format Functions
    formatCurrency(amount) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    formatDate(date) {
        return new Intl.DateTimeFormat('id-ID', {
            weekday: 'short',
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        }).format(date);
    }

    formatFullDate(dateStr) {
        const date = new Date(dateStr + 'T00:00:00');
        return new Intl.DateTimeFormat('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }).format(date);
    }

    formatMonthYear(date) {
        return new Intl.DateTimeFormat('id-ID', {
            month: 'long',
            year: 'numeric'
        }).format(date);
    }

    formatMonth(date) {
        return date.toISOString().substring(0, 7);
    }

    // Setup Event Listeners
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => this.handleNavClick(e));
        });

        // Toggle Sidebar
        document.getElementById('toggleSidebar').addEventListener('click', () => {
            document.querySelector('.sidebar').classList.toggle('active');
        });

        document.querySelector('.main-content').addEventListener('click', () => {
            document.querySelector('.sidebar').classList.remove('active');
        });

        // Transaction Form
        document.getElementById('transactionForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddTransaction();
        });

        document.getElementById('tipeTransaksi').addEventListener('change', () => {
            this.updateCategoryDropdown('tipeTransaksi', 'kategoriTransaksi');
        });

        // Transaction Filters
        document.getElementById('searchTransaksi').addEventListener('input', () => {
            this.updateTransactionList();
        });
        document.getElementById('filterTipe').addEventListener('change', () => {
            this.updateTransactionList();
        });
        document.getElementById('filterKategori').addEventListener('change', () => {
            this.updateTransactionList();
        });
        document.getElementById('filterAkun').addEventListener('change', () => {
            this.updateTransactionList();
        });
        document.getElementById('filterBulan').addEventListener('change', () => {
            this.updateTransactionList();
        });
        document.getElementById('clearFilters').addEventListener('click', () => {
            this.clearTransactionFilters();
        });

        // Account Form
        document.getElementById('accountForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddAccount();
        });

        // Target Form
        document.getElementById('targetForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddTarget();
        });

        // Budget Form
        document.getElementById('budgetForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddBudget();
        });

        // Category Form
        document.getElementById('categoryForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddCustomCategory();
        });

        // Edit Modal
        const editModal = document.getElementById('editModal');
        document.querySelector('.close').addEventListener('click', () => {
            editModal.classList.remove('active');
        });
        window.addEventListener('click', (e) => {
            if (e.target === editModal) {
                editModal.classList.remove('active');
            }
        });
        document.getElementById('editForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleEditTransaction();
        });
        document.getElementById('cancelEdit').addEventListener('click', () => {
            editModal.classList.remove('active');
        });

        // Edit Target Modal
        const editTargetModal = document.getElementById('editTargetModal');
        document.querySelector('.close-target').addEventListener('click', () => {
            editTargetModal.classList.remove('active');
        });
        window.addEventListener('click', (e) => {
            if (e.target === editTargetModal) {
                editTargetModal.classList.remove('active');
            }
        });
        document.getElementById('editTargetForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleEditTarget();
        });
        document.getElementById('cancelEditTarget').addEventListener('click', () => {
            editTargetModal.classList.remove('active');
        });

        // Dashboard Navigation
        document.getElementById('prevMonth').addEventListener('click', () => {
            this.currentMonth.setMonth(this.currentMonth.getMonth() - 1);
            this.updateAllViews();
        });
        document.getElementById('nextMonth').addEventListener('click', () => {
            this.currentMonth.setMonth(this.currentMonth.getMonth() + 1);
            this.updateAllViews();
        });

        // Report Navigation
        document.getElementById('prevMonthReport').addEventListener('click', () => {
            this.reportMonth.setMonth(this.reportMonth.getMonth() - 1);
            this.updateReportView();
        });
        document.getElementById('nextMonthReport').addEventListener('click', () => {
            this.reportMonth.setMonth(this.reportMonth.getMonth() + 1);
            this.updateReportView();
        });

        // Backup & Restore
        document.getElementById('backupBtn').addEventListener('click', () => {
            this.backupDataPDF();
        });
        document.getElementById('restoreBtn').addEventListener('click', () => {
            this.restoreData();
        });
        document.getElementById('deleteAllBtn').addEventListener('click', () => {
            this.handleDeleteAllData();
        });

        // Export Report PDF
        document.getElementById('exportReportPDF').addEventListener('click', () => {
            this.exportReportPDF();
        });
    }

    // Event Handlers
    handleNavClick(e) {
        e.preventDefault();
        const navValue = e.target.getAttribute('data-nav');

        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(navValue).classList.add('active');

        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        e.target.classList.add('active');

        this.updateAllViews();
    }

    handleAddAccount() {
        const name = document.getElementById('namaAkun').value;
        const type = document.getElementById('tipeAkun').value;
        const balance = document.getElementById('saldoAwal').value;
        const color = document.getElementById('warnaBadge').value;

        if (!name || !type) {
            alert('Mohon isi nama dan tipe akun!');
            return;
        }

        this.addAccount({ name, type, balance, color });
        document.getElementById('accountForm').reset();
        this.updateAccountDropdowns();
        this.updateAccountList();
        this.updateAllViews();
        alert('Akun berhasil ditambahkan!');
    }

    handleAddTarget() {
        const name = document.getElementById('namaTarget').value;
        const targetAmount = document.getElementById('targetNominal').value;
        const deadline = document.getElementById('targetBulan').value;
        const description = document.getElementById('deskripsiTarget').value;
        const accountId = document.getElementById('targetAkun').value;

        if (!name || !targetAmount || !accountId) {
            alert('Mohon isi semua field yang diperlukan!');
            return;
        }

        this.addTarget({
            name,
            targetAmount,
            deadline,
            description,
            accountId: parseInt(accountId)
        });

        document.getElementById('targetForm').reset();
        this.updateTargetList();
        this.updateAllViews();
        alert('Target berhasil dibuat!');
    }

    handleAddTransaction() {
        const type = document.getElementById('tipeTransaksi').value;
        const category = document.getElementById('kategoriTransaksi').value;
        const amount = document.getElementById('nominalTransaksi').value;
        const description = document.getElementById('deskripsiTransaksi').value;
        const date = document.getElementById('tanggalTransaksi').value;
        const accountId = document.getElementById('akunTransaksi').value;
        const recurring = document.getElementById('recurring').value;

        if (!type || !category || !amount || !date || !accountId) {
            alert('Mohon isi semua field yang diperlukan!');
            return;
        }

        this.addTransaction({
            type, category, amount, description, date, accountId, recurring
        });

        document.getElementById('transactionForm').reset();
        this.updateTransactionList();
        this.updateAllViews();
        alert('Transaksi berhasil ditambahkan!');
    }

    handleEditTransaction() {
        const id = document.getElementById('editId').value;
        const category = document.getElementById('editKategori').value;
        const accountId = document.getElementById('editAkun').value;
        const amount = document.getElementById('editNominal').value;
        const description = document.getElementById('editDeskripsi').value;
        const date = document.getElementById('editTanggal').value;

        this.updateTransaction(id, {
            category, accountId: parseInt(accountId), amount: parseFloat(amount), description, date
        });

        document.getElementById('editModal').classList.remove('active');
        this.updateTransactionList();
        this.updateAllViews();
        alert('Transaksi berhasil diperbarui!');
    }

    handleEditTarget() {
        const id = document.getElementById('editTargetId').value;
        const name = document.getElementById('editTargetNama').value;
        const targetAmount = document.getElementById('editTargetNominal').value;
        const saved = document.getElementById('editTargetTersimpan').value;
        const deadline = document.getElementById('editTargetBulan').value;

        this.updateTarget(id, {
            name,
            targetAmount: parseFloat(targetAmount),
            saved: parseFloat(saved),
            deadline
        });

        document.getElementById('editTargetModal').classList.remove('active');
        this.updateTargetList();
        this.updateAllViews();
        alert('Target berhasil diperbarui!');
    }

    handleAddBudget() {
        const category = document.getElementById('budgetKategori').value;
        const limit = document.getElementById('budgetLimit').value;
        const month = document.getElementById('budgetBulan').value;

        if (!category || !limit || !month) {
            alert('Mohon isi semua field yang diperlukan!');
            return;
        }

        this.addBudget({ category, limit, month });
        document.getElementById('budgetForm').reset();
        this.updateBudgetList();
        alert('Anggaran berhasil ditambahkan!');
    }

    handleAddCustomCategory() {
        const type = document.getElementById('categoryType').value;
        const name = document.getElementById('categoryName').value;
        const icon = document.getElementById('categoryIcon').value;

        if (!type || !name) {
            alert('Mohon isi nama kategori!');
            return;
        }

        this.addCustomCategory(type, name, icon);
        document.getElementById('categoryForm').reset();
        this.updateCustomCategoriesList();
        this.updateCategoryDropdowns();
        alert('Kategori berhasil ditambahkan!');
    }

    handleDeleteAllData() {
        if (confirm('⚠️ Apakah Anda yakin? Semua data akan dihapus permanen dan TIDAK BISA DIPULIHKAN!')) {
            if (confirm('Konfirmasi sekali lagi untuk menghapus SEMUA data?')) {
                this.transactions = [];
                this.budgets = [];
                this.accounts = [];
                this.targets = [];
                this.saveToStorage();
                alert('Semua data telah dihapus!');
                this.updateAllViews();
            }
        }
    }

    // UI Update Functions
    updateAllViews() {
        this.updateMonthDisplay();
        this.updateDashboard();
        this.updateTransactionList();
        this.updateAccountList();
        this.updateTargetList();
        this.updateCategoryDropdowns();
        this.updateBudgetList();
        this.updateReportView();
        this.updateCustomCategoriesList();
    }

    setDefaultDate() {
        document.getElementById('tanggalTransaksi').valueAsDate = new Date();
        document.getElementById('budgetBulan').value = this.formatMonth(new Date());
        document.getElementById('targetBulan').value = this.formatMonth(new Date());
    }

    updateMonthDisplay() {
        document.getElementById('currentMonth').textContent = this.formatMonthYear(this.currentMonth);
        document.getElementById('currentMonthReport').textContent = this.formatMonthYear(this.reportMonth);
    }

    updateDashboard() {
        const income = this.getMonthIncome(this.currentMonth);
        const expense = this.getMonthExpense(this.currentMonth);
        const balance = this.getTotalBalance();
        const targetTotal = this.getTotalTargets();

        document.getElementById('dashboardIncome').textContent = this.formatCurrency(income);
        document.getElementById('dashboardExpense').textContent = this.formatCurrency(expense);
        document.getElementById('dashboardBalance').textContent = this.formatCurrency(balance);
        document.getElementById('dashboardTarget').textContent = this.formatCurrency(targetTotal);

        this.updateAccountSummary();
        this.updateTrendChart();
        this.updateCategoryChart();
        this.updateRecentTransactions();
    }

    updateAccountSummary() {
        const container = document.getElementById('accountSummaryCards');

        if (this.accounts.length === 0) {
            container.innerHTML = '<p class="empty-message">Belum ada akun</p>';
            return;
        }

        container.innerHTML = this.accounts.map(acc => {
            const balance = this.getAccountBalance(acc.id);
            const typeLabel = {
                'bank': '🏦 Bank',
                'ewallet': '📱 E-Wallet',
                'cash': '💵 Tunai',
                'investment': '📈 Investasi',
                'other': '📝 Lainnya'
            };

            return `
                <div class="account-card" style="border-left-color: ${acc.color}">
                    <div class="account-card-name">${acc.name}</div>
                    <div class="account-card-type">${typeLabel[acc.type]}</div>
                    <div class="account-card-balance">${this.formatCurrency(balance)}</div>
                </div>
            `;
        }).join('');
    }

    updateTrendChart() {
        const ctx = document.getElementById('trendChart');
        if (!ctx) return;

        if (this.trendChart) {
            this.trendChart.destroy();
        }

        const data = this.getLast30DaysData();
        this.trendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.dates,
                datasets: [
                    {
                        label: 'Pemasukan',
                        data: data.income,
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Pengeluaran',
                        data: data.expense,
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        tension: 0.4,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => this.formatCurrency(value)
                        }
                    }
                }
            }
        });
    }

    updateCategoryChart() {
        const ctx = document.getElementById('categoryChart');
        if (!ctx) return;

        if (this.categoryChart) {
            this.categoryChart.destroy();
        }

        const categoryData = this.getExpenseByCategory(this.currentMonth);
        const labels = Object.keys(categoryData);
        const data = labels.map(cat => categoryData[cat].amount);
        const colors = [
            '#4f46e5', '#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b',
            '#10b981', '#ef4444', '#6366f1', '#14b8a6', '#f97316'
        ];

        this.categoryChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors.slice(0, labels.length),
                    borderColor: '#fff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'right'
                    }
                }
            }
        });
    }

    updateRecentTransactions() {
        const list = document.getElementById('recentTransList');
        const transactions = this.getMonthTransactions(this.currentMonth)
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);

        if (transactions.length === 0) {
            list.innerHTML = '<p class="empty-message">Belum ada transaksi</p>';
            return;
        }

        list.innerHTML = transactions.map(t => this.createTransactionHTML(t)).join('');
    }

    updateAccountList() {
        const list = document.getElementById('accountList');

        if (this.accounts.length === 0) {
            list.innerHTML = '<p class="empty-message">Belum ada akun</p>';
            return;
        }

        const typeLabel = {
            'bank': '🏦',
            'ewallet': '📱',
            'cash': '💵',
            'investment': '📈',
            'other': '📝'
        };

        list.innerHTML = this.accounts.map(acc => {
            const balance = this.getAccountBalance(acc.id);
            return `
                <div class="account-item" style="border-left-color: ${acc.color}">
                    <div class="account-info">
                        <div class="account-name">${typeLabel[acc.type]} ${acc.name}</div>
                        <div class="account-type">Tipe: ${acc.type}</div>
                    </div>
                    <div class="account-balance">${this.formatCurrency(balance)}</div>
                    <div class="account-actions">
                        <button class="btn-delete" onclick="app.deleteAccountAndUpdate(${acc.id})">🗑️ Hapus</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    updateTargetList() {
        const list = document.getElementById('targetList');

        if (this.targets.length === 0) {
            list.innerHTML = '<p class="empty-message">Belum ada target</p>';
            return;
        }

        list.innerHTML = this.targets.map(target => {
            const percent = (target.saved / target.targetAmount) * 100;
            const progressClass = percent >= 100 ? 'success' : percent >= 75 ? 'warning' : '';
            const account = this.accounts.find(a => a.id == target.accountId);

            return `
                <div class="target-card">
                    <div class="target-header">
                        <div class="target-name">🎯 ${target.name}</div>
                        <div class="target-actions">
                            <button class="btn-edit" onclick="app.openEditTargetModal(${target.id})">✏️ Edit</button>
                            <button class="btn-delete" onclick="app.deleteTargetAndUpdate(${target.id})">🗑️ Hapus</button>
                        </div>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill ${progressClass}" style="width: ${Math.min(percent, 100)}%"></div>
                    </div>
                    <div class="target-stats">
                        <div class="target-stat-item">
                            <div class="target-stat-label">Terkumpul</div>
                            <div class="target-stat-value">${this.formatCurrency(target.saved)}</div>
                        </div>
                        <div class="target-stat-item">
                            <div class="target-stat-label">Target</div>
                            <div class="target-stat-value">${this.formatCurrency(target.targetAmount)}</div>
                        </div>
                        <div class="target-stat-item">
                            <div class="target-stat-label">Sisa</div>
                            <div class="target-stat-value">${this.formatCurrency(Math.max(0, target.targetAmount - target.saved))}</div>
                        </div>
                    </div>
                    <div class="target-deadline">
                        📅 Deadline: ${this.formatFullDate(target.deadline + '-01')} | 💼 Akun: ${account ? account.name : 'Unknown'}
                    </div>
                </div>
            `;
        }).join('');
    }

    updateTransactionList() {
        const list = document.getElementById('transactionList');
        const search = document.getElementById('searchTransaksi').value.toLowerCase();
        const filterTipe = document.getElementById('filterTipe').value;
        const filterKategori = document.getElementById('filterKategori').value;
        const filterAkun = document.getElementById('filterAkun').value;
        const filterBulan = document.getElementById('filterBulan').value;

        let filtered = this.transactions;

        if (filterBulan) {
            filtered = filtered.filter(t => t.date.startsWith(filterBulan));
        }

        if (filterTipe) {
            filtered = filtered.filter(t => t.type === filterTipe);
        }

        if (filterKategori) {
            filtered = filtered.filter(t => t.category === filterKategori);
        }

        if (filterAkun) {
            filtered = filtered.filter(t => t.accountId == filterAkun);
        }

        if (search) {
            filtered = filtered.filter(t =>
                t.description.toLowerCase().includes(search) ||
                t.category.toLowerCase().includes(search)
            );
        }

        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

        if (filtered.length === 0) {
            list.innerHTML = '<p class="empty-message">Tidak ada transaksi yang cocok</p>';
            return;
        }

        list.innerHTML = filtered.map(t => this.createTransactionHTML(t)).join('');
    }

    createTransactionHTML(transaction) {
        const category = this.getCategories(transaction.type)
            .find(c => c.name === transaction.category);
        const icon = category ? category.icon : '📝';
        const account = this.accounts.find(a => a.id == transaction.accountId);
        const accountBadge = account ? `<span class="transaction-account-badge" style="background-color: ${account.color}">${account.name}</span>` : '';

        return `
            <div class="transaction-item ${transaction.type}">
                <div class="transaction-info">
                    <div class="transaction-category">
                        ${icon} ${transaction.category}
                        ${accountBadge}
                    </div>
                    <div class="transaction-description">${transaction.description || 'Tanpa deskripsi'}</div>
                    <div class="transaction-date">${this.formatFullDate(transaction.date)}</div>
                </div>
                <div class="transaction-amount ${transaction.type}">
                    ${transaction.type === 'pemasukan' ? '+' : '-'} ${this.formatCurrency(transaction.amount)}
                </div>
                <div class="transaction-actions">
                    <button class="btn-edit" onclick="app.openEditModal(${transaction.id})">✏️ Edit</button>
                    <button class="btn-delete" onclick="app.deleteTransactionAndUpdate(${transaction.id})">🗑️ Hapus</button>
                </div>
            </div>
        `;
    }

    openEditModal(id) {
        const transaction = this.transactions.find(t => t.id == id);
        if (!transaction) return;

        const categories = this.getCategories(transaction.type);
        const categorySelect = document.getElementById('editKategori');
        categorySelect.innerHTML = categories.map(c =>
            `<option value="${c.name}" ${c.name === transaction.category ? 'selected' : ''}>${c.icon} ${c.name}</option>`
        ).join('');

        const accountSelect = document.getElementById('editAkun');
        accountSelect.innerHTML = this.accounts.map(acc =>
            `<option value="${acc.id}" ${acc.id == transaction.accountId ? 'selected' : ''}>${acc.name}</option>`
        ).join('');

        document.getElementById('editId').value = id;
        document.getElementById('editKategori').value = transaction.category;
        document.getElementById('editAkun').value = transaction.accountId;
        document.getElementById('editNominal').value = transaction.amount;
        document.getElementById('editDeskripsi').value = transaction.description;
        document.getElementById('editTanggal').value = transaction.date;

        document.getElementById('editModal').classList.add('active');
    }

    openEditTargetModal(id) {
        const target = this.targets.find(t => t.id == id);
        if (!target) return;

        document.getElementById('editTargetId').value = id;
        document.getElementById('editTargetNama').value = target.name;
        document.getElementById('editTargetNominal').value = target.targetAmount;
        document.getElementById('editTargetTersimpan').value = target.saved;
        document.getElementById('editTargetBulan').value = target.deadline;

        document.getElementById('editTargetModal').classList.add('active');
    }

    deleteTransactionAndUpdate(id) {
        if (confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
            this.deleteTransaction(id);
            this.updateTransactionList();
            this.updateAllViews();
        }
    }

    deleteAccountAndUpdate(id) {
        if (confirm('Apakah Anda yakin ingin menghapus akun ini?')) {
            this.deleteAccount(id);
            this.updateAccountList();
            this.updateAccountDropdowns();
            this.updateAllViews();
        }
    }

    deleteTargetAndUpdate(id) {
        if (confirm('Apakah Anda yakin ingin menghapus target ini?')) {
            this.deleteTarget(id);
            this.updateTargetList();
            this.updateAllViews();
        }
    }

    updateCategoryDropdown(typeSelectId, categorySelectId) {
        const type = document.getElementById(typeSelectId).value;
        const categorySelect = document.getElementById(categorySelectId);

        if (!type) {
            categorySelect.innerHTML = '<option value="">-- Pilih Kategori --</option>';
            return;
        }

        const categories = this.getCategories(type);
        categorySelect.innerHTML = `
            <option value="">-- Pilih Kategori --</option>
            ${categories.map(c => `<option value="${c.name}">${c.icon} ${c.name}</option>`).join('')}
        `;
    }

    updateAccountDropdowns() {
        const accountSelects = document.querySelectorAll('#akunTransaksi, #targetAkun');
        const filterAkun = document.getElementById('filterAkun');

        accountSelects.forEach(select => {
            const current = select.value;
            select.innerHTML = `
                <option value="">-- Pilih Akun --</option>
                ${this.accounts.map(acc => `<option value="${acc.id}">${acc.name}</option>`).join('')}
            `;
            if (current) select.value = current;
        });

        if (filterAkun) {
            const current = filterAkun.value;
            filterAkun.innerHTML = `
                <option value="">Semua Akun</option>
                ${this.accounts.map(acc => `<option value="${acc.id}">${acc.name}</option>`).join('')}
            `;
            if (current) filterAkun.value = current;
        }
    }

    updateCategoryDropdowns() {
        const types = ['pemasukan', 'pengeluaran'];
        types.forEach(type => {
            const categories = this.getCategories(type);
            const selects = document.querySelectorAll(`select[data-type="${type}"], #budgetKategori, #filterKategori`);

            selects.forEach(select => {
                if (select.id === 'budgetKategori' || select.id === 'filterKategori') {
                    const current = select.value;
                    select.innerHTML = `
                        <option value="">-- Semua Kategori --</option>
                        ${this.getCategories('pengeluaran').map(c => `<option value="${c.name}">${c.icon} ${c.name}</option>`).join('')}
                    `;
                    if (current) select.value = current;
                }
            });
        });

        const uniqueMonths = [...new Set(this.transactions.map(t => t.date.substring(0, 7)))].sort().reverse();
        const filterBulan = document.getElementById('filterBulan');
        filterBulan.innerHTML = `
            <option value="">Semua Bulan</option>
            ${uniqueMonths.map(month => {
                const date = new Date(month + '-01');
                return `<option value="${month}">${this.formatMonthYear(date)}</option>`;
            }).join('')}
        `;

        this.updateAccountDropdowns();
    }

    updateBudgetList() {
        const list = document.getElementById('budgetList');
        const currentMonth = this.formatMonth(new Date());

        const budgets = this.budgets.filter(b => b.month === currentMonth);

        if (budgets.length === 0) {
            list.innerHTML = '<p class="empty-message">Belum ada anggaran untuk bulan ini</p>';
            return;
        }

        list.innerHTML = budgets.map(budget => {
            const spent = this.getCategoryExpense(new Date(budget.month + '-01'), budget.category);
            const percent = (spent / budget.limit) * 100;
            const statusClass = percent >= 100 ? 'danger' : percent >= 75 ? 'warning' : '';

            return `
                <div class="budget-card">
                    <div class="budget-header">
                        <div class="budget-category">${budget.category}</div>
                        <div class="budget-actions">
                            <button class="btn-delete" onclick="app.deleteBudgetAndUpdate(${budget.id})">🗑️ Hapus</button>
                        </div>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill ${statusClass}" style="width: ${Math.min(percent, 100)}%"></div>
                    </div>
                    <div class="budget-stats">
                        <div class="budget-stat-item">
                            <div class="budget-stat-label">Digunakan</div>
                            <div class="budget-stat-value">${this.formatCurrency(spent)}</div>
                        </div>
                        <div class="budget-stat-item">
                            <div class="budget-stat-label">Batas</div>
                            <div class="budget-stat-value">${this.formatCurrency(budget.limit)}</div>
                        </div>
                        <div class="budget-stat-item">
                            <div class="budget-stat-label">Sisa</div>
                            <div class="budget-stat-value">${this.formatCurrency(Math.max(0, budget.limit - spent))}</div>
                        </div>
                    </div>
                    <div style="text-align: center; margin-top: 0.5rem; font-size: 0.9rem; color: #6b7280;">
                        ${percent.toFixed(1)}% Terpakai
                    </div>
                </div>
            `;
        }).join('');
    }

    deleteBudgetAndUpdate(id) {
        if (confirm('Apakah Anda yakin ingin menghapus anggaran ini?')) {
            this.deleteBudget(id);
            this.updateBudgetList();
        }
    }

    updateReportView() {
        const income = this.getMonthIncome(this.reportMonth);
        const expense = this.getMonthExpense(this.reportMonth);
        const balance = income - expense;

        document.getElementById('reportIncome').textContent = this.formatCurrency(income);
        document.getElementById('reportExpense').textContent = this.formatCurrency(expense);
        document.getElementById('reportBalance').textContent = this.formatCurrency(balance);

        this.updateCategoryBreakdown();
        this.updateAccountBreakdown();
        this.updateReportTransactions();
    }

    updateCategoryBreakdown() {
        const breakdown = document.getElementById('categoryBreakdown');
        const categoryData = this.getExpenseByCategory(this.reportMonth);
        const total = Object.values(categoryData).reduce((sum, item) => sum + item.amount, 0);

        if (Object.keys(categoryData).length === 0) {
            breakdown.innerHTML = '<p class="empty-message">Belum ada pengeluaran</p>';
            return;
        }

        breakdown.innerHTML = Object.entries(categoryData)
            .sort((a, b) => b[1].amount - a[1].amount)
            .map(([category, data]) => {
                const percent = ((data.amount / total) * 100).toFixed(1);
                return `
                    <div class="category-item">
                        <div class="category-icon">${data.icon}</div>
                        <div class="category-info">
                            <div class="category-name">${category}</div>
                            <div class="category-details">${percent}% dari total</div>
                        </div>
                        <div class="category-amount">${this.formatCurrency(data.amount)}</div>
                        <div class="category-percent">${percent}%</div>
                    </div>
                `;
            }).join('');
    }

    updateAccountBreakdown() {
        const breakdown = document.getElementById('accountBreakdown');
        const monthTransactions = this.getMonthTransactions(this.reportMonth);

        if (monthTransactions.length === 0) {
            breakdown.innerHTML = '<p class="empty-message">Belum ada transaksi</p>';
            return;
        }

        const accountData = {};
        this.accounts.forEach(acc => {
            const accTransactions = monthTransactions.filter(t => t.accountId == acc.id);
            const income = accTransactions.filter(t => t.type === 'pemasukan').reduce((sum, t) => sum + t.amount, 0);
            const expense = accTransactions.filter(t => t.type === 'pengeluaran').reduce((sum, t) => sum + t.amount, 0);

            if (income > 0 || expense > 0) {
                accountData[acc.id] = { name: acc.name, income, expense, color: acc.color };
            }
        });

        if (Object.keys(accountData).length === 0) {
            breakdown.innerHTML = '<p class="empty-message">Belum ada transaksi</p>';
            return;
        }

        breakdown.innerHTML = Object.entries(accountData)
            .map(([_, data]) => `
                <div class="account-breakdown-item" style="border-left-color: ${data.color}">
                    <div class="category-info">
                        <div class="account-breakdown-name">${data.name}</div>
                        <div class="account-breakdown-detail">
                            Masuk: ${this.formatCurrency(data.income)} | Keluar: ${this.formatCurrency(data.expense)}
                        </div>
                    </div>
                </div>
            `).join('');
    }

    updateReportTransactions() {
        const list = document.getElementById('reportTransactions');
        const transactions = this.getMonthTransactions(this.reportMonth)
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        if (transactions.length === 0) {
            list.innerHTML = '<p class="empty-message">Belum ada transaksi</p>';
            return;
        }

        list.innerHTML = transactions.map(t => {
            const category = this.getCategories(t.type).find(c => c.name === t.category);
            const icon = category ? category.icon : '📝';
            const account = this.accounts.find(a => a.id == t.accountId);

            return `
                <div class="transaction-item ${t.type}">
                    <div class="transaction-info">
                        <div class="transaction-category">${icon} ${t.category}</div>
                        <div class="transaction-description">${t.description || 'Tanpa deskripsi'}</div>
                        <div class="transaction-date">${this.formatFullDate(t.date)} | 💼 ${account ? account.name : 'Unknown'}</div>
                    </div>
                    <div class="transaction-amount ${t.type}">
                        ${t.type === 'pemasukan' ? '+' : '-'} ${this.formatCurrency(t.amount)}
                    </div>
                </div>
            `;
        }).join('');
    }

    updateCustomCategoriesList() {
        const list = document.getElementById('customCategoriesList');
        const pemasukan = this.customCategories.pemasukan;
        const pengeluaran = this.customCategories.pengeluaran;
        const all = [...pemasukan, ...pengeluaran];

        if (all.length === 0) {
            list.innerHTML = '<p class="empty-message">Belum ada kategori custom</p>';
            return;
        }

        list.innerHTML = `
            <div>
                <h4 style="margin-bottom: 0.75rem; color: #6b7280; font-size: 0.9rem;">Pemasukan</h4>
                ${pemasukan.length === 0 ? '<p style="color: #9ca3af; font-size: 0.85rem;">-</p>' :
                    pemasukan.map((cat, idx) => `
                    <div class="category-tag">
                        <div class="tag-content">
                            <span>${cat.icon} ${cat.name}</span>
                        </div>
                        <button class="tag-delete" onclick="app.removeCustomCategoryAndUpdate('pemasukan', ${idx})">Hapus</button>
                    </div>
                `).join('')}
            </div>
            <div style="margin-top: 1.5rem;">
                <h4 style="margin-bottom: 0.75rem; color: #6b7280; font-size: 0.9rem;">Pengeluaran</h4>
                ${pengeluaran.length === 0 ? '<p style="color: #9ca3af; font-size: 0.85rem;">-</p>' :
                    pengeluaran.map((cat, idx) => `
                    <div class="category-tag">
                        <div class="tag-content">
                            <span>${cat.icon} ${cat.name}</span>
                        </div>
                        <button class="tag-delete" onclick="app.removeCustomCategoryAndUpdate('pengeluaran', ${idx})">Hapus</button>
                    </div>
                `).join('')}
            </div>
        `;
    }

    removeCustomCategoryAndUpdate(type, index) {
        if (confirm('Apakah Anda yakin ingin menghapus kategori ini?')) {
            this.removeCustomCategory(type, index);
            this.updateCustomCategoriesList();
            this.updateCategoryDropdowns();
        }
    }

    clearTransactionFilters() {
        document.getElementById('searchTransaksi').value = '';
        document.getElementById('filterTipe').value = '';
        document.getElementById('filterKategori').value = '';
        document.getElementById('filterAkun').value = '';
        document.getElementById('filterBulan').value = '';
        this.updateTransactionList();
    }

    // Backup & Restore
    backupDataPDF() {
        const element = document.createElement('div');
        element.innerHTML = `
            <h1>🏦 BACKUP DATA DOMPETKU</h1>
            <p>Generated: ${new Date().toLocaleString('id-ID')}</p>
            
            <h2>📋 RINGKASAN DATA</h2>
            <p>Total Akun: ${this.accounts.length}</p>
            <p>Total Transaksi: ${this.transactions.length}</p>
            <p>Total Target: ${this.targets.length}</p>
            <p>Total Anggaran: ${this.budgets.length}</p>
            
            <h2>🏦 DAFTAR AKUN</h2>
            ${this.accounts.length === 0 ? '<p>Tidak ada akun</p>' : `
                <table border="1" cellpadding="5" cellspacing="0" style="width:100%">
                    <tr>
                        <th>Nama Akun</th>
                        <th>Tipe</th>
                        <th>Saldo</th>
                    </tr>
                    ${this.accounts.map(acc => `
                        <tr>
                            <td>${acc.name}</td>
                            <td>${acc.type}</td>
                            <td>${this.formatCurrency(this.getAccountBalance(acc.id))}</td>
                        </tr>
                    `).join('')}
                </table>
            `}
            
            <h2>💳 DAFTAR TRANSAKSI</h2>
            ${this.transactions.length === 0 ? '<p>Tidak ada transaksi</p>' : `
                <table border="1" cellpadding="5" cellspacing="0" style="width:100%">
                    <tr>
                        <th>Tanggal</th>
                        <th>Tipe</th>
                        <th>Kategori</th>
                        <th>Akun</th>
                        <th>Jumlah</th>
                        <th>Deskripsi</th>
                    </tr>
                    ${this.transactions.map(t => {
                        const account = this.accounts.find(a => a.id == t.accountId);
                        return `
                            <tr>
                                <td>${this.formatFullDate(t.date)}</td>
                                <td>${t.type}</td>
                                <td>${t.category}</td>
                                <td>${account ? account.name : 'N/A'}</td>
                                <td>${this.formatCurrency(t.amount)}</td>
                                <td>${t.description}</td>
                            </tr>
                        `;
                    }).join('')}
                </table>
            `}

            <h2>🎯 DAFTAR TARGET</h2>
            ${this.targets.length === 0 ? '<p>Tidak ada target</p>' : `
                <table border="1" cellpadding="5" cellspacing="0" style="width:100%">
                    <tr>
                        <th>Nama Target</th>
                        <th>Target Amount</th>
                        <th>Tersimpan</th>
                        <th>Deadline</th>
                    </tr>
                    ${this.targets.map(t => `
                        <tr>
                            <td>${t.name}</td>
                            <td>${this.formatCurrency(t.targetAmount)}</td>
                            <td>${this.formatCurrency(t.saved)}</td>
                            <td>${this.formatFullDate(t.deadline + '-01')}</td>
                        </tr>
                    `).join('')}
                </table>
            `}
        `;

        const opt = {
            margin: 10,
            filename: `dompetku_backup_${new Date().toISOString().split('T')[0]}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
        };

        html2pdf().set(opt).from(element).save();
        alert('Backup PDF berhasil dibuat!');
    }

    restoreData() {
        const file = document.getElementById('restoreFile').files[0];
        if (!file) {
            alert('Mohon pilih file backup!');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (confirm('Apakah Anda yakin ingin mengembalikan data dari backup ini? Data saat ini akan ditimpa!')) {
                    this.transactions = data.transactions || [];
                    this.budgets = data.budgets || [];
                    this.accounts = data.accounts || [];
                    this.targets = data.targets || [];
                    this.customCategories = data.customCategories || { pemasukan: [], pengeluaran: [] };
                    this.saveToStorage();
                    this.updateAllViews();
                    alert('Data berhasil dipulihkan!');
                    document.getElementById('restoreFile').value = '';
                }
            } catch (error) {
                alert('Gagal membaca file backup. Pastikan file valid!');
            }
        };
        reader.readAsText(file);
    }

    exportReportPDF() {
        const element = document.createElement('div');
        const month = this.formatMonthYear(this.reportMonth);
        const income = this.getMonthIncome(this.reportMonth);
        const expense = this.getMonthExpense(this.reportMonth);
        const balance = income - expense;
        const categoryData = this.getExpenseByCategory(this.reportMonth);

        element.innerHTML = `
            <h1>📋 LAPORAN KEUANGAN BULANAN</h1>
            <p>Bulan: ${month}</p>
            <p>Generated: ${new Date().toLocaleString('id-ID')}</p>
            
            <h2>📊 RINGKASAN</h2>
            <table border="1" cellpadding="10" cellspacing="0" style="width:100%">
                <tr>
                    <th>Total Pemasukan</th>
                    <th>Total Pengeluaran</th>
                    <th>Saldo Bersih</th>
                </tr>
                <tr>
                    <td>${this.formatCurrency(income)}</td>
                    <td>${this.formatCurrency(expense)}</td>
                    <td>${this.formatCurrency(balance)}</td>
                </tr>
            </table>

            <h2>📊 PENGELUARAN PER KATEGORI</h2>
            ${Object.keys(categoryData).length === 0 ? '<p>Tidak ada pengeluaran</p>' : `
                <table border="1" cellpadding="5" cellspacing="0" style="width:100%">
                    <tr>
                        <th>Kategori</th>
                        <th>Jumlah</th>
                        <th>Persentase</th>
                    </tr>
                    ${Object.entries(categoryData)
                        .sort((a, b) => b[1].amount - a[1].amount)
                        .map(([cat, data]) => {
                            const total = Object.values(categoryData).reduce((sum, item) => sum + item.amount, 0);
                            const percent = ((data.amount / total) * 100).toFixed(1);
                            return `
                                <tr>
                                    <td>${data.icon} ${cat}</td>
                                    <td>${this.formatCurrency(data.amount)}</td>
                                    <td>${percent}%</td>
                                </tr>
                            `;
                        }).join('')}
                </table>
            `}
            
            <h2>💳 TRANSAKSI DETAIL</h2>
            ${this.getMonthTransactions(this.reportMonth).length === 0 ? '<p>Tidak ada transaksi</p>' : `
                <table border="1" cellpadding="5" cellspacing="0" style="width:100%">
                    <tr>
                        <th>Tanggal</th>
                        <th>Kategori</th>
                        <th>Tipe</th>
                        <th>Jumlah</th>
                        <th>Deskripsi</th>
                    </tr>
                    ${this.getMonthTransactions(this.reportMonth)
                        .sort((a, b) => new Date(b.date) - new Date(a.date))
                        .map(t => `
                            <tr>
                                <td>${this.formatFullDate(t.date)}</td>
                                <td>${t.category}</td>
                                <td>${t.type}</td>
                                <td>${this.formatCurrency(t.amount)}</td>
                                <td>${t.description}</td>
                            </tr>
                        `).join('')}
                </table>
            `}
        `;

        const opt = {
            margin: 10,
            filename: `dompetku_laporan_${this.formatMonth(this.reportMonth)}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
        };

        html2pdf().set(opt).from(element).save();
        alert('Laporan PDF berhasil dibuat!');
    }
}

// Initialize App
const app = new FinanceApp();