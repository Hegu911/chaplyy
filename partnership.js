// partnership.js - Chaply Əməkdaşlıq Səhifəsi (EmailJS Tam Dəstəkli)

// ============================================================
// KONFİQURASİYA
// ============================================================
const CONFIG = {
    EMAILJS_PUBLIC_KEY: 'zGRXX8FVHkDV02Vi3',
    EMAILJS_SERVICE_ID: 'service_txkzspn',
    EMAILJS_TEMPLATE_ID: 'template_asbp9yf',
    PARTNERSHIP_TO_EMAIL: 'samirsamiragayevagayev1121@gmail.com'  // Bu email-ə gedəcək
};

// EmailJS başlat
if (window.emailjs) {
    emailjs.init(CONFIG.EMAILJS_PUBLIC_KEY);
    console.log('✅ EmailJS başladıldı (Partnership)');
}

// ============================================================
// MÜRACİƏT NÖMRƏSİ VƏ TARİX
// ============================================================
function generateApplicationId() {
    return 'PART-' + Date.now().toString().slice(-8) + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
}

function getCurrentDateTime() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${day}.${month}.${year} ${hours}:${minutes}`;
}

// ============================================================
// TOAST NOTIFICATION
// ============================================================
function showToast(message, type = 'success') {
    const existingToasts = document.querySelectorAll('.custom-toast');
    existingToasts.forEach(toast => toast.remove());

    const toast = document.createElement('div');
    toast.className = 'custom-toast';

    let bgColor = '#0f3c23';
    let icon = '✅';
    if (type === 'error') {
        bgColor = '#dc2626';
        icon = '❌';
    } else if (type === 'warning') {
        bgColor = '#f59e0b';
        icon = '⚠️';
    } else if (type === 'info') {
        bgColor = '#3b82f6';
        icon = 'ℹ️';
    }

    toast.style.cssText = `
        position: fixed;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%) translateY(20px);
        background: ${bgColor};
        color: white;
        padding: 14px 28px;
        border-radius: 50px;
        font-weight: 600;
        font-size: 14px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        z-index: 99999;
        display: flex;
        align-items: center;
        gap: 10px;
        opacity: 0;
        transition: all 0.3s ease;
        font-family: "Inter", sans-serif;
    `;

    toast.innerHTML = `${icon} ${message}`;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';
    }, 10);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(20px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============================================================
// SƏHİFƏ YÜKLƏNMƏSİ
// ============================================================
document.addEventListener('DOMContentLoaded', function () {
    const modal = document.getElementById('registerModal');
    const joinBtn = document.getElementById('joinNowBtn');
    const closeModalBtn = document.querySelector('#registerModal .close-modal');
    const registerForm = document.getElementById('registerForm');

    // Modal aç
    if (joinBtn) {
        joinBtn.addEventListener('click', () => {
            modal.style.display = 'flex';
        });
    }

    // Modal bağla
    function closeModal() {
        if (modal) modal.style.display = 'none';
    }
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    window.addEventListener('click', e => {
        if (e.target === modal) closeModal();
    });

    // Form göndərmə
    if (registerForm) {
        registerForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const name = document.getElementById('regName')?.value.trim();
            const surname = document.getElementById('regSurname')?.value.trim();
            const phone = document.getElementById('regPhone')?.value.trim();
            const email = document.getElementById('regEmail')?.value.trim() || '';
            const instagram = document.getElementById('regInstagram')?.value.trim() || '-';
            const note = document.getElementById('regNote')?.value.trim() || '-';

            if (!name || !surname || !phone) {
                showToast('Ad, Soyad və Əlaqə nömrəsi vacibdir!', 'warning');
                return;
            }

            if (!phone.match(/^[\+\d\s\-\(\)]{10,20}$/)) {
                showToast('Düzgün telefon nömrəsi daxil edin!', 'warning');
                return;
            }

            const applicationId = generateApplicationId();
            const applicationDate = getCurrentDateTime();

            // Template parametrləri
            const templateParams = {
                email: CONFIG.PARTNERSHIP_TO_EMAIL,
                application_id: String(applicationId),
                application_date: String(applicationDate),
                applicant_name: String(name + ' ' + surname),
                applicant_phone: String(phone),
                applicant_email: String(email || '-'),
                applicant_instagram: String(instagram),
                applicant_note: String(note)
            };

            console.log('📧 Əməkdaşlıq müraciəti göndərilir:', templateParams);

            const submitBtn = registerForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Göndərilir...';
            submitBtn.disabled = true;

            try {
                await emailjs.send(
                    CONFIG.EMAILJS_SERVICE_ID,
                    CONFIG.EMAILJS_TEMPLATE_ID,
                    templateParams
                );

                showToast(`✅ Təşəkkürlər ${name}! Müraciətiniz göndərildi.`, 'success');
                registerForm.reset();
                closeModal();
            } catch (err) {
                console.error('❌ EmailJS xətası:', err);
                showToast('❌ Xəta: ' + (err?.text || err?.message || 'Bilinməyən'), 'error');
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    // Routing
    const routes = {
        '/': 'index.html',
        '/product': 'product.html',
        '/design': 'created.html',
        '/partnership': 'partnership.html',
        '/designed': 'design.html'
    };

    document.querySelectorAll('[data-link]').forEach(el => {
        el.addEventListener('click', function (e) {
            e.preventDefault();
            const path = this.getAttribute('data-link');
            window.location.href = routes[path] || (path + '.html');
        });
    });
});