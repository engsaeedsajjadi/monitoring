// توابع مشترک برای تمام داشبوردها

// مدیریت وضعیت کاربر
function updateUserInfo() {
    const token = localStorage.getItem('access_token');
    if (token) {
        fetch('/auth/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => response.json())
        .then(user => {
            document.getElementById('current-user').textContent = user.name;
        })
        .catch(error => {
            console.error('Error fetching user info:', error);
            window.location.href = '/login';
        });
    } else {
        window.location.href = '/login';
    }
}

// مدیریت خطاهای API
async function handleApiCall(apiCall) {
    try {
        const response = await apiCall();
        if (response.status === 401) {
            localStorage.removeItem('access_token');
            window.location.href = '/login';
            return null;
        }
        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        showNotification('خطا در ارتباط با سرور', 'error');
        return null;
    }
}

// نمایش نوتیفیکیشن
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">&times;</button>
    `;
    
    // استایل نوتیفیکیشن
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        left: 20px;
        background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6'};
        color: white;
        padding: 1rem;
        border-radius: 0.5rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        display: flex;
        justify-content: space-between;
        align-items: center;
        min-width: 300px;
    `;
    
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 5000);
}

// فرمت‌دهی اعداد
function formatNumber(number) {
    return new Intl.NumberFormat('fa-IR').format(number);
}

// فرمت‌دهی تاریخ
function formatDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(date);
}

// مقداردهی اولیه زمانی که DOM لود شد
document.addEventListener('DOMContentLoaded', function() {
    updateUserInfo();
});