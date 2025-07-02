document.addEventListener('DOMContentLoaded', function() {
    // تهيئة البيانات إذا لم تكن موجودة
    if (!localStorage.getItem('transactions')) {
        const sampleTransactions = [
            {
                id: 1,
                type: 'income',
                amount: 5000,
                category: 'salary',
                note: 'راتب الشهر',
                date: new Date().toISOString()
            },
            {
                id: 2,
                type: 'expense',
                amount: 1500,
                category: 'bills',
                note: 'فاتورة الكهرباء',
                date: new Date().toISOString()
            },
            {
                id: 3,
                type: 'expense',
                amount: 800,
                category: 'food',
                note: 'بقالة الأسبوع',
                date: new Date().toISOString()
            }
        ];
        localStorage.setItem('transactions', JSON.stringify(sampleTransactions));
    }

    if (!localStorage.getItem('debts')) {
        localStorage.setItem('debts', JSON.stringify([]));
    }

    // تحميل البيانات
    const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    const debts = JSON.parse(localStorage.getItem('debts')) || [];

    // تحديث الإحصائيات
    updateStats();
    renderRecentTransactions();
    renderMonthlyChart();
    renderExpenseChart();

    function updateStats() {
        const totalIncome = transactions.reduce((total, trx) => {
            return trx.type === 'income' ? total + parseFloat(trx.amount) : total;
        }, 0);

        const totalExpense = transactions.reduce((total, trx) => {
            return trx.type === 'expense' ? total + parseFloat(trx.amount) : total;
        }, 0);

        const currentBalance = totalIncome - totalExpense;
        const totalOwed = debts.reduce((total, debt) => {
            return debt.type === 'owed' ? total + parseFloat(debt.amount) : total;
        }, 0);

        // تحديث العناصر
        document.getElementById('total-income').textContent = totalIncome.toLocaleString('ar-EG') + ' جنيه';
        document.getElementById('total-expense').textContent = totalExpense.toLocaleString('ar-EG') + ' جنيه';
        document.getElementById('current-balance').textContent = currentBalance.toLocaleString('ar-EG') + ' جنيه';
        document.getElementById('total-debts').textContent = totalOwed.toLocaleString('ar-EG') + ' جنيه';
    }

    function renderRecentTransactions() {
        const container = document.getElementById('recent-transactions');
        if (!container) return;

        // أخذ آخر 5 معاملات
        const recent = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

        if (recent.length === 0) {
            container.innerHTML = '<div class="no-transactions">لا توجد معاملات حديثة</div>';
            return;
        }

        container.innerHTML = '';
        recent.forEach(trx => {
            const item = document.createElement('div');
            item.className = `transaction-item ${trx.type}`;
            item.innerHTML = `
                <div class="transaction-icon">
                    <i class="fas ${trx.type === 'income' ? 'fa-arrow-down' : 'fa-arrow-up'}"></i>
                </div>
                <div class="transaction-details">
                    <div class="transaction-title">${trx.note || 'بدون وصف'}</div>
                    <span class="transaction-category">${getCategoryName(trx.category)}</span>
                    <div class="transaction-date">${formatDate(trx.date)}</div>
                </div>
                <div class="transaction-amount">
                    ${trx.amount.toLocaleString('ar-EG')} جنيه
                </div>
            `;
            container.appendChild(item);
        });
    }

    function renderMonthlyChart() {
        const ctx = document.getElementById('monthlyChart').getContext('2d');
        const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        
        // تجميع البيانات الشهرية
        const monthlyData = Array(12).fill().map(() => ({ income: 0, expense: 0 }));
        
        transactions.forEach(trx => {
            const date = new Date(trx.date);
            const month = date.getMonth();
            
            if (trx.type === 'income') {
                monthlyData[month].income += parseFloat(trx.amount);
            } else {
                monthlyData[month].expense += parseFloat(trx.amount);
            }
        });

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: months,
                datasets: [
                    {
                        label: 'مدخول',
                        data: monthlyData.map(m => m.income),
                        backgroundColor: 'rgba(16, 185, 129, 0.7)',
                        borderColor: 'rgba(16, 185, 129, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'مصروف',
                        data: monthlyData.map(m => m.expense),
                        backgroundColor: 'rgba(239, 68, 68, 0.7)',
                        borderColor: 'rgba(239, 68, 68, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        rtl: true,
                        labels: {
                            usePointStyle: true,
                            padding: 20
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + context.raw.toLocaleString('ar-EG') + ' جنيه';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return value.toLocaleString('ar-EG') + ' ج';
                            }
                        },
                        grid: {
                            drawBorder: false
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    function renderExpenseChart() {
        const expenseCategories = {
            'food': 'طعام',
            'transport': 'مواصلات',
            'bills': 'فواتير',
            'shopping': 'تسوق',
            'other-expense': 'أخرى'
        };
        
        // تجميع المصروفات حسب الفئة
        const categoryData = {};
        Object.keys(expenseCategories).forEach(cat => {
            categoryData[cat] = 0;
        });
        
        transactions.forEach(trx => {
            if (trx.type === 'expense') {
                const category = trx.category in expenseCategories ? trx.category : 'other-expense';
                categoryData[category] += parseFloat(trx.amount);
            }
        });
        
        // تحويل البيانات إلى مصفوفات
        const categories = [];
        const amounts = [];
        const colors = [
            '#EF4444', '#F97316', '#F59E0B', 
            '#10B981', '#3B82F6', '#6366F1',
            '#8B5CF6', '#EC4899'
        ];
        
        Object.entries(categoryData).forEach(([cat, amount], index) => {
            if (amount > 0) {
                categories.push(expenseCategories[cat]);
                amounts.push(amount);
            }
        });
        
        // إنشاء المخطط الدائري
        const options = {
            series: amounts,
            chart: {
                type: 'donut',
                height: 350,
                fontFamily: 'Tajawal, sans-serif'
            },
            labels: categories,
            colors: colors,
            legend: {
                position: 'right',
                horizontalAlign: 'center',
                fontFamily: 'Tajawal',
                markers: {
                    width: 8,
                    height: 8,
                    radius: 8
                },
                itemMargin: {
                    horizontal: 10,
                    vertical: 5
                }
            },
            dataLabels: {
                enabled: false
            },
            plotOptions: {
                pie: {
                    donut: {
                        size: '65%',
                        labels: {
                            show: true,
                            total: {
                                show: true,
                                label: 'إجمالي المصروفات',
                                color: '#6B7280',
                                formatter: function(w) {
                                    return w.globals.seriesTotals.reduce((a, b) => a + b, 0).toLocaleString('ar-EG') + ' ج';
                                }
                            }
                        }
                    }
                }
            },
            tooltip: {
                y: {
                    formatter: function(value) {
                        return value.toLocaleString('ar-EG') + ' جنيه';
                    }
                }
            },
            responsive: [{
                breakpoint: 480,
                options: {
                    chart: {
                        height: 300
                    },
                    legend: {
                        position: 'bottom'
                    }
                }
            }]
        };
        
        const chart = new ApexCharts(document.querySelector("#expenseChart"), options);
        chart.render();
    }

    // وظائف مساعدة
    function getCategoryName(category) {
        const categories = {
            'salary': 'راتب',
            'investment': 'استثمار',
            'gift': 'هدية',
            'food': 'طعام',
            'transport': 'مواصلات',
            'bills': 'فواتير',
            'shopping': 'تسوق',
            'other-income': 'أخرى (مدخول)',
            'other-expense': 'أخرى (مصروف)'
        };
        return categories[category] || category;
    }

    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('ar-EG', options);
    }

    // جعل الدوال متاحة للصفحات الأخرى
    window.updateStats = updateStats;
});
