// ============================================================
// EMAILJS KONFİQURASİYA - SİZİN HƏQİQİ DƏYƏRLƏRİNİZ
// ============================================================
const CONFIG = {
    EMAILJS_PUBLIC_KEY: 'EOiOK01llQeySb4Hx',
    EMAILJS_SERVICE_ID: 'service_kttllns',
    EMAILJS_TEMPLATE_ID: 'template_0oy4flc',
    DESIGN_TO_EMAIL: 'sanaymiraga64@gmail.com'
};

// EmailJS-i init et
if (window.emailjs) {
    emailjs.init({ publicKey: CONFIG.EMAILJS_PUBLIC_KEY });
    console.log('✅ EmailJS init edildi');
}

// ============================================================
// SƏHİFƏ YÜKLƏNDİKDƏ FORMANI TƏMİZLƏ
// ============================================================
window.addEventListener('DOMContentLoaded', function () {
    console.log('✅ Səhifə yükləndi');
    const form = document.getElementById('designForm');
    if (form) {
        form.reset();
        console.log('✅ Form təmizləndi');
    } else {
        console.error('❌ designForm tapılmadı!');
    }
});

// ============================================================
// MODAL İDARƏETMƏ
// ============================================================
const modal = document.getElementById('successModal');
const closeModalBtn = document.querySelector('.close-modal');
const modalCloseBtn = document.querySelector('.modal-close-btn');
const modalTitle = document.getElementById('modalTitle');
const modalMessage = document.getElementById('modalMessage');
const modalIconContainer = document.getElementById('modalIconContainer');

function showSuccessModal(title, message) {
    if (!modal) return;
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    modalIconContainer.innerHTML = `<svg class="success-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
    modal.style.display = 'flex';
}

function showErrorModal(title, message) {
    if (!modal) return;
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    modalIconContainer.innerHTML = `<svg class="success-icon" style="color: #e74c3c;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
    modal.style.display = 'flex';
}

function closeModalFunc() { if (modal) modal.style.display = 'none'; }
if (closeModalBtn) closeModalBtn.onclick = closeModalFunc;
if (modalCloseBtn) modalCloseBtn.onclick = closeModalFunc;
window.onclick = function (e) { if (e.target === modal) closeModalFunc(); }

// ============================================================
// FORMA GÖNDƏRİLMƏSİ - EMAILJS İLƏ
// ============================================================
const designForm = document.getElementById('designForm');
const submitBtn = document.getElementById('submitBtn');

if (designForm) {
    console.log('✅ Forma event listener əlavə edilir');
    designForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        console.log('📝 Forma göndərildi!');

        const name = document.getElementById('name').value.trim();
        const surname = document.getElementById('surname').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const postcode = document.getElementById('postcode').value.trim();
        const address = document.getElementById('address').value.trim();
        const message = document.getElementById('message').value.trim();

        if (!name || !surname || !phone || !address || !message) {
            alert('Zəhmət olmasa bütün vacib sahələri doldurun!');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Göndərilir...';

        try {
            console.log('📧 EmailJS göndərilir...');
            console.log('Service ID:', CONFIG.EMAILJS_SERVICE_ID);
            console.log('Template ID:', CONFIG.EMAILJS_TEMPLATE_ID);
            
            const result = await emailjs.send(
                CONFIG.EMAILJS_SERVICE_ID,
                CONFIG.EMAILJS_TEMPLATE_ID,
                {
                    to_email: CONFIG.DESIGN_TO_EMAIL,
                    customer_name: `${name} ${surname}`,
                    customer_phone: phone,
                    customer_postcode: postcode || 'Təqdim edilməyib',
                    customer_address: address,
                    design_message: message,
                    timestamp: new Date().toLocaleString('az-AZ')
                }
            );
            
            console.log('✅ Uğurlu:', result);
            showSuccessModal('Təşəkkürlər!', 'Müraciətiniz uğurla qəbul edildi.');
            designForm.reset();

        } catch (error) {
            console.error('❌ Xəta:', error);
            showErrorModal('Xəta baş verdi', error.text || error.message || 'Göndərilərkən xəta baş verdi.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Göndər';
        }
    });
} else {
    console.error('❌ designForm ELEMENTİ TAPILMADI! ID-ni yoxlayın.');
}

// ============================================================
// ROUTING SİSTEMİ
// ============================================================
(function () {
    const routes = {
        '/': 'index.html',
        '/index': 'index.html',
        '/home': 'index.html',
        '/product': 'product.html',
        '/ai-design': 'ai-design.html',
        '/design': 'created.html',
        '/login': 'login.html',
        '/partnership': 'partnership.html',
        '/designed':'design.html'
    };

    function navigateTo(path) {
        let targetUrl = routes[path];
        if (!targetUrl) targetUrl = routes['/' + path];
        if (!targetUrl) targetUrl = path + '.html';
        window.location.href = targetUrl;
    }

    document.querySelectorAll('[data-link]').forEach(el => {
        const newEl = el.cloneNode(true);
        if (el.parentNode) el.parentNode.replaceChild(newEl, el);
        newEl.addEventListener('click', function (e) {
            e.preventDefault();
            const link = this.getAttribute('data-link');
            if (link) navigateTo(link);
        });
    });
})();