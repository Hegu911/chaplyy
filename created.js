// ============================================================
// KONFİQURASİYA
// ============================================================
const CONFIG = {
    SHEET_ID: '1md0gSVfSMdHskEL57HaNteots5hqN_taxMDnQCyVFfc',
    PRODUCTS_SHEET: 'products_for_design',
    STICKERS_SHEET: 'stickers',
    SIZES_SHEET: 'sizes',

    // EmailJS konfiqurasiyası
    EMAILJS_PUBLIC_KEY: 'nkZ98Ga10XtaLm5By',
    EMAILJS_SERVICE_ID: 'service_7cd7g3b',
    EMAILJS_TEMPLATE_ID: 'template_4kwa9rq',
    ORDER_TO_EMAIL: 'eli120124@gmail.com'
};

const FONT_LIST = [
    'Inter', 'Poppins', 'Roboto', 'Montserrat', 'Open Sans', 'Lato', 'Nunito', 'Raleway', 'Quicksand', 'DM Sans',
    'Manrope', 'Plus Jakarta Sans', 'Figtree', 'Work Sans', 'Rubik', 'Playfair Display', 'Merriweather', 'Lora',
    'Cormorant Garamond', 'Bodoni Moda', 'Abril Fatface', 'Old Standard TT', 'Lobster', 'Pacifico', 'Dancing Script',
    'Caveat', 'Great Vibes', 'Satisfy', 'Kaushan Script', 'Fredoka One', 'Bebas Neue', 'Anton'
];

// BÜTÜN MÜMKÜN ÖLÇÜLƏR
const ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

// EmailJS başlat
if (window.emailjs) {
    emailjs.init(CONFIG.EMAILJS_PUBLIC_KEY);
    console.log('✅ EmailJS başladıldı');
}

// ============================================================
// CANVAS INIT
// ============================================================
const canvas = new fabric.Canvas('designCanvas', {
    backgroundColor: '#f0f0f0',
    preserveObjectStacking: true,
    width: 600,
    height: 600
});

let activeProduct = null;
let allProducts = [];
let allSizes = [];
let selectedPrintType = 'no_print';
let currentQuantity = 1;
let currentSizeExtra = 0;
let selectedSize = 'M';

// ============================================================
// SİFARİŞ NÖMRƏSİ VƏ TARİX
// ============================================================
function generateOrderId() {
    return 'CH-' + Date.now().toString().slice(-8) + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
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
    if (type === 'error') { bgColor = '#dc2626'; icon = '❌'; }
    else if (type === 'warning') { bgColor = '#f59e0b'; icon = '⚠️'; }
    else if (type === 'info') { bgColor = '#3b82f6'; icon = 'ℹ️'; }

    toast.style.cssText = `
        position: fixed; bottom: 100px; left: 50%; transform: translateX(-50%) translateY(20px);
        background: ${bgColor}; color: white; padding: 14px 28px; border-radius: 50px;
        font-weight: 600; font-size: 14px; box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        z-index: 99999; display: flex; align-items: center; gap: 10px; opacity: 0;
        transition: all 0.3s ease; font-family: "Inter", sans-serif;
        backdrop-filter: blur(4px); border: 1px solid rgba(255,255,255,0.2);
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
// GOOGLE DRIVE ID ÇIXARMA
// ============================================================
function extractGoogleDriveId(url) {
    if (!url) return null;
    if (url.match(/^[a-zA-Z0-9_-]{25,}$/)) return url;
    const match1 = url.match(/\/d\/([^\/]+)/);
    if (match1) return match1[1];
    const match2 = url.match(/[?&]id=([^&]+)/);
    if (match2) return match2[1];
    const match3 = url.match(/uc\?export=download&id=([^&]+)/);
    if (match3) return match3[1];
    const match4 = url.match(/file\/d\/([^\/]+)/);
    if (match4) return match4[1];
    return null;
}

function getGoogleDriveCdnUrl(fileId) {
    return `https://lh3.googleusercontent.com/d/${fileId}=w1200-h1200`;
}

// ============================================================
// FON ŞƏKLİNİ TƏYİN ET
// ============================================================
function setProductBackground(imgUrl) {
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    canvas.setBackgroundColor('#e0e0e0', canvas.renderAll.bind(canvas));

    if (!imgUrl) {
        canvas.setBackgroundColor('#f0f0f0', canvas.renderAll.bind(canvas));
        return;
    }

    const fileId = extractGoogleDriveId(imgUrl);
    let finalImageUrl = fileId ? getGoogleDriveCdnUrl(fileId) : imgUrl;

    fabric.Image.fromURL(finalImageUrl, function (img) {
        if (!img) {
            canvas.setBackgroundColor('#e8e8e8', canvas.renderAll.bind(canvas));
            return;
        }

        const scaleX = canvasWidth / img.width;
        const scaleY = canvasHeight / img.height;
        const scale = Math.max(scaleX, scaleY);

        img.set({
            scaleX: scale,
            scaleY: scale,
            originX: 'left',
            originY: 'top',
            left: (canvasWidth - img.width * scale) / 2,
            top: (canvasHeight - img.height * scale) / 2,
            selectable: false,
            evented: false,
            crossOrigin: 'anonymous'
        });

        canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
    }, { crossOrigin: 'anonymous' });
}

// ============================================================
// MOBİL PANEL İDARƏETMƏ
// ============================================================
let activeMobilePanel = 'text';

function openMobilePanel(panelId) {
    document.querySelectorAll('.mobile-panel-container').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tool-icon').forEach(i => i.classList.remove('active'));

    const panel = document.getElementById(`mobile-panel-${panelId}`);
    const icon = document.querySelector(`.tool-icon[data-panel="${panelId}"]`);

    if (panel) panel.classList.add('active');
    if (icon) icon.classList.add('active');

    activeMobilePanel = panelId;
}

function closeMobilePanel(panelId) {
    const panel = document.getElementById(`mobile-panel-${panelId}`);
    const icon = document.querySelector(`.tool-icon[data-panel="${panelId}"]`);

    if (panel) panel.classList.remove('active');
    if (icon) icon.classList.remove('active');
}

document.querySelectorAll('.tool-icon').forEach(icon => {
    icon.addEventListener('click', () => {
        const panelId = icon.dataset.panel;
        if (activeMobilePanel === panelId) {
            closeMobilePanel(panelId);
            activeMobilePanel = null;
        } else {
            openMobilePanel(panelId);
        }
    });
});

window.closeMobilePanel = closeMobilePanel;

// ============================================================
// ŞRİFT DROPDOWNLARINI DOLDUR
// ============================================================
function populateFontSelectors() {
    const desktopSelect = document.getElementById('desktopFontFamily');
    const mobileSelect = document.getElementById('mobileFontFamily');

    if (desktopSelect) {
        desktopSelect.innerHTML = '';
        FONT_LIST.forEach(font => {
            const option = document.createElement('option');
            option.value = font;
            option.textContent = font;
            option.style.fontFamily = font;
            desktopSelect.appendChild(option);
        });
        desktopSelect.value = 'Inter';
    }

    if (mobileSelect) {
        mobileSelect.innerHTML = '';
        FONT_LIST.forEach(font => {
            const option = document.createElement('option');
            option.value = font;
            option.textContent = font;
            option.style.fontFamily = font;
            mobileSelect.appendChild(option);
        });
        mobileSelect.value = 'Inter';
    }
}

// ============================================================
// GOOGLE SHEETS FETCH
// ============================================================
async function fetchSheet(sheetName) {
    try {
        const url = `https://opensheet.elk.sh/${CONFIG.SHEET_ID}/${sheetName}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Sheet fetch error');
        const data = await res.json();
        console.log(`✅ ${sheetName} yükləndi`);
        return data;
    } catch (e) {
        console.error(`❌ ${sheetName} yüklənə bilmədi:`, e);
        return [];
    }
}

// ============================================================
// ÖLÇÜLƏRİ YÜKLƏ
// ============================================================
async function loadSizes() {
    allSizes = await fetchSheet(CONFIG.SIZES_SHEET);
    const sizeSelect = document.getElementById('orderSize');
    if (!sizeSelect) return;

    sizeSelect.innerHTML = '';
    if (allSizes.length === 0) {
        ALL_SIZES.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s;
            opt.textContent = s;
            sizeSelect.appendChild(opt);
        });
        selectedSize = 'M';
        return;
    }

    allSizes.forEach(sz => {
        const opt = document.createElement('option');
        opt.value = sz.name || sz.size || sz;
        opt.textContent = sz.name || sz.size || sz;
        sizeSelect.appendChild(opt);
    });

    selectedSize = sizeSelect.value;
}

// ============================================================
// MƏHSUL ŞABLONLARINI YÜKLƏ
// ============================================================
async function loadProductTemplates() {
    const topContainer = document.getElementById('templatesList');
    const mobileContainer = document.getElementById('mobileTemplatesList');

    const products = await fetchSheet(CONFIG.PRODUCTS_SHEET);
    allProducts = products;

    if (!products.length) {
        topContainer.innerHTML = '<div class="template-card"><span>Məhsul tapılmadı</span></div>';
        if (mobileContainer) mobileContainer.innerHTML = '<div class="mobile-template-card"><span>Məhsul yoxdur</span></div>';
        return;
    }

    topContainer.innerHTML = '';
    products.forEach((product, index) => {
        const card = createTemplateCard(product, index, 'top');
        topContainer.appendChild(card);
    });

    if (mobileContainer) {
        mobileContainer.innerHTML = '';
        products.forEach((product, index) => {
            const card = createTemplateCard(product, index, 'mobile');
            mobileContainer.appendChild(card);
        });
    }

    if (products.length > 0) {
        setTimeout(() => {
            const firstCard = topContainer.querySelector('.template-card');
            if (firstCard) firstCard.click();
        }, 500);
    }
}

function createTemplateCard(product, index, type) {
    const card = document.createElement('div');
    card.className = type === 'mobile' ? 'mobile-template-card' : 'template-card';
    card.dataset.index = index;

    const img = document.createElement('img');
    let imageUrl = product.image || product.url || product.img || product.photo || product.picture;

    if (!imageUrl) {
        imageUrl = 'https://placehold.co/200x200/1a5c3e/white?text=No+Image';
    } else {
        const fileId = extractGoogleDriveId(imageUrl);
        if (fileId) imageUrl = `https://lh3.googleusercontent.com/d/${fileId}=w200-h200`;
    }

    img.src = imageUrl;
    img.alt = product.name || `Məhsul ${index + 1}`;
    img.crossOrigin = 'anonymous';
    img.referrerPolicy = 'no-referrer';
    img.onerror = function () { this.src = 'https://placehold.co/200x200/1a5c3e/white?text=Error'; };

    const span = document.createElement('span');
    span.textContent = product.name || `Məhsul ${index + 1}`;

    card.appendChild(img);
    card.appendChild(span);

    card.addEventListener('click', () => {
        document.querySelectorAll('.template-card, .mobile-template-card').forEach(c => c.classList.remove('active'));
        document.querySelectorAll(`.template-card[data-index="${index}"], .mobile-template-card[data-index="${index}"]`)
            .forEach(c => c.classList.add('active'));

        activeProduct = product;

        let bgImageUrl = product.image || product.url || product.img || product.photo || product.picture;
        if (bgImageUrl) {
            setProductBackground(bgImageUrl);
        } else {
            canvas.setBackgroundColor('#f0f0f0', canvas.renderAll.bind(canvas));
        }

        updatePrintOptions(product);
        calculateAndUpdatePrice();
    });

    return card;
}

// ============================================================
// HAZIR ŞABLONLARI (STICKER) YÜKLƏ
// ============================================================
async function loadStickers() {
    const desktopContainer = document.getElementById('desktopStickersList');
    const mobileContainer = document.getElementById('mobileStickersList');

    const stickers = await fetchSheet(CONFIG.STICKERS_SHEET);

    if (!stickers.length) {
        const msg = '<div class="sticker-card" style="grid-column: span 3;"><span>Şablon tapılmadı</span></div>';
        if (desktopContainer) desktopContainer.innerHTML = msg;
        if (mobileContainer) mobileContainer.innerHTML = msg;
        return;
    }

    if (desktopContainer) {
        desktopContainer.innerHTML = '';
        stickers.forEach(sticker => desktopContainer.appendChild(createStickerCard(sticker)));
    }

    if (mobileContainer) {
        mobileContainer.innerHTML = '';
        stickers.forEach(sticker => mobileContainer.appendChild(createStickerCard(sticker)));
    }
}

function createStickerCard(sticker) {
    const card = document.createElement('div');
    card.className = 'sticker-card';

    const img = document.createElement('img');
    let imgUrl = sticker.image || sticker.url || sticker.img || 'https://placehold.co/100x100/1a5c3e/white?text=Sticker';

    const fileId = extractGoogleDriveId(imgUrl);
    if (fileId) imgUrl = `https://lh3.googleusercontent.com/d/${fileId}=w100-h100`;

    img.src = imgUrl;
    img.alt = sticker.name || 'Şablon';
    img.crossOrigin = 'anonymous';
    img.onerror = function () { this.src = 'https://placehold.co/100x100/1a5c3e/white?text=Error'; };

    const span = document.createElement('span');
    span.textContent = sticker.name || 'Şablon';

    card.appendChild(img);
    card.appendChild(span);

    card.addEventListener('click', () => {
        addStickerToCanvas(sticker.image || sticker.url || sticker.img);
        if (window.innerWidth <= 768) closeMobilePanel('stickers');
    });

    return card;
}

function addStickerToCanvas(imgUrl) {
    if (!imgUrl) return;

    const fileId = extractGoogleDriveId(imgUrl);
    let finalUrl = fileId ? `https://lh3.googleusercontent.com/d/${fileId}=w300-h300` : imgUrl;

    fabric.Image.fromURL(finalUrl, function (img) {
        if (!img) return;

        img.scaleToWidth(150);
        img.set({
            left: canvas.width / 2 - (img.width * img.scaleX) / 2,
            top: canvas.height / 2 - (img.height * img.scaleY) / 2,
            cornerColor: 'white',
            cornerSize: 10,
            transparentCorners: false,
            borderColor: 'rgb(20, 78, 46)',
            borderScaleFactor: 2,
            crossOrigin: 'anonymous'
        });
        canvas.add(img).setActiveObject(img);
        canvas.renderAll();
    }, { crossOrigin: 'anonymous' });
}

// ============================================================
// ÇAP SEÇİMLƏRİ VƏ QİYMƏT HESABLAMA
// ============================================================
function updatePrintOptions(product) {
    const container = document.getElementById('printOptionsGrid');
    if (!container) return;

    const options = [
        { id: 'no_print', name: 'Çapsız', icon: 'fa-ban', priceKey: 'price_no_print' },
        { id: 'small', name: 'Kiçik çap (10cm)', icon: 'fa-circle', priceKey: 'price_small_print' },
        { id: 'single', name: 'Tək tərəf', icon: 'fa-square', priceKey: 'price_single_side' },
        { id: 'double', name: 'İki tərəf', icon: 'fa-clone', priceKey: 'price_double_side' },
        { id: 'sleeve', name: 'Qol çapı', icon: 'fa-tshirt', priceKey: 'price_sleeve' },
        { id: 'collar', name: 'Boyun çapı', icon: 'fa-tag', priceKey: 'price_collar' }
    ];

    container.innerHTML = '';

    options.forEach(opt => {
        const btn = document.createElement('div');
        btn.className = 'print-option-btn';
        btn.dataset.type = opt.id;

        const priceValue = product[opt.priceKey];
        const isAvailable = priceValue && priceValue !== 'none' && priceValue !== '';

        if (!isAvailable) {
            btn.classList.add('disabled');
            btn.innerHTML = `<i class="fas ${opt.icon}"></i><span>${opt.name}</span><small>Mümkün deyil</small>`;
        } else {
            btn.innerHTML = `<i class="fas ${opt.icon}"></i><span>${opt.name}</span><small>+${parseFloat(priceValue).toFixed(2)} ₼</small>`;
            btn.addEventListener('click', () => {
                document.querySelectorAll('.print-option-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                selectedPrintType = opt.id;
                calculateAndUpdatePrice();
            });
        }
        container.appendChild(btn);
    });

    const noPrintBtn = container.querySelector('[data-type="no_print"]');
    if (noPrintBtn && !noPrintBtn.classList.contains('disabled')) {
        noPrintBtn.classList.add('active');
        selectedPrintType = 'no_print';
    }

    calculateAndUpdatePrice();
}

function calculateAndUpdatePrice() {
    if (!activeProduct) return;

    const quantity = parseInt(document.getElementById('orderQuantity')?.value) || 1;
    currentQuantity = quantity;

    const sizeSelect = document.getElementById('orderSize');
    if (sizeSelect) selectedSize = sizeSelect.value;

    let sizeExtra = 0;
    if (sizeSelect && allSizes.length > 0) {
        const sizeObj = allSizes.find(s => (s.name || s.size) === selectedSize);
        if (sizeObj) sizeExtra = parseFloat(sizeObj.price_extra || sizeObj.extra || 0) || 0;
    }
    currentSizeExtra = sizeExtra;

    const basePrice = parseFloat(activeProduct.price_no_print) || 0;

    let printPrice = 0;
    const priceMap = {
        'no_print': 'price_no_print',
        'small': 'price_small_print',
        'single': 'price_single_side',
        'double': 'price_double_side',
        'sleeve': 'price_sleeve',
        'collar': 'price_collar'
    };

    const selected = priceMap[selectedPrintType];
    if (selected) {
        const printTypePrice = parseFloat(activeProduct[selected]);
        if (printTypePrice && activeProduct[selected] !== 'none') printPrice = printTypePrice;
    }

    const unitPrice = basePrice + printPrice + sizeExtra;
    const totalPrice = unitPrice * quantity;

    document.getElementById('baseProductPrice') && (document.getElementById('baseProductPrice').textContent = `${basePrice.toFixed(2)} ₼`);
    document.getElementById('printServicePrice') && (document.getElementById('printServicePrice').textContent = `${printPrice.toFixed(2)} ₼`);
    document.getElementById('sizeExtraPrice') && (document.getElementById('sizeExtraPrice').textContent = `${sizeExtra.toFixed(2)} ₼`);
    document.getElementById('totalOrderPrice') && (document.getElementById('totalOrderPrice').textContent = `${totalPrice.toFixed(2)} ₼`);
}

function calculateUnitPrice() {
    if (!activeProduct) return 0;
    const basePrice = parseFloat(activeProduct.price_no_print) || 0;
    let printPrice = 0;
    const priceMap = {
        'no_print': 'price_no_print',
        'small': 'price_small_print',
        'single': 'price_single_side',
        'double': 'price_double_side',
        'sleeve': 'price_sleeve',
        'collar': 'price_collar'
    };
    const priceKey = priceMap[selectedPrintType];
    if (priceKey) {
        const val = activeProduct[priceKey];
        if (val && val !== 'none') printPrice = parseFloat(val) || 0;
    }
    return basePrice + printPrice + currentSizeExtra;
}

function getPrintTypeName() {
    const names = {
        'no_print': 'Çapsız',
        'small': 'Kiçik çap (10cm)',
        'single': 'Tək tərəf',
        'double': 'İki tərəf',
        'sleeve': 'Qol çapı',
        'collar': 'Boyun çapı'
    };
    return names[selectedPrintType] || 'Çapsız';
}

// ============================================================
// CANVAS ƏMƏLİYYATLARI
// ============================================================
function addTextToCanvas(text, color, fontFamily = 'Inter') {
    const textObj = new fabric.IText(text || 'Mətn', {
        left: 150, top: 150, fill: color || '#000000', fontSize: 30,
        fontFamily: fontFamily, fontWeight: '600'
    });
    canvas.add(textObj).setActiveObject(textObj);
    canvas.renderAll();
}

function updateTextColor(color) {
    const obj = canvas.getActiveObject();
    if (obj && obj.type === 'i-text') { obj.set('fill', color); canvas.renderAll(); }
}

function updateFontFamily(family) {
    const obj = canvas.getActiveObject();
    if (obj && obj.type === 'i-text') { obj.set('fontFamily', family); canvas.renderAll(); }
}

function updateFontSize(size) {
    const obj = canvas.getActiveObject();
    if (obj && obj.type === 'i-text') { obj.set('fontSize', parseInt(size)); canvas.renderAll(); }
}

function toggleBold() {
    const obj = canvas.getActiveObject();
    if (obj && obj.type === 'i-text') {
        obj.set('fontWeight', obj.fontWeight === 'bold' ? 'normal' : 'bold');
        canvas.renderAll();
    }
}

function toggleItalic() {
    const obj = canvas.getActiveObject();
    if (obj && obj.type === 'i-text') {
        obj.set('fontStyle', obj.fontStyle === 'italic' ? 'normal' : 'italic');
        canvas.renderAll();
    }
}

function toggleUnderline() {
    const obj = canvas.getActiveObject();
    if (obj && obj.type === 'i-text') {
        obj.set('underline', !obj.underline);
        canvas.renderAll();
    }
}

function bringToFront() {
    const obj = canvas.getActiveObject();
    if (obj) { canvas.bringToFront(obj); canvas.renderAll(); }
}

function deleteSelected() {
    const obj = canvas.getActiveObject();
    if (obj) { canvas.remove(obj); canvas.renderAll(); }
}

function cloneObject() {
    const obj = canvas.getActiveObject();
    if (obj) {
        obj.clone(cloned => {
            cloned.set({ left: obj.left + 20, top: obj.top + 20 });
            canvas.add(cloned).setActiveObject(cloned);
            canvas.renderAll();
        });
    }
}

function centerObject() {
    const obj = canvas.getActiveObject();
    if (obj) {
        obj.set({
            left: (canvas.width - obj.width * obj.scaleX) / 2,
            top: (canvas.height - obj.height * obj.scaleY) / 2
        });
        canvas.renderAll();
    }
}

function setRotation(angle) {
    const obj = canvas.getActiveObject();
    if (obj) { obj.set('angle', parseInt(angle)); canvas.renderAll(); }
}

function setOpacity(opacity) {
    const obj = canvas.getActiveObject();
    if (obj) { obj.set('opacity', parseFloat(opacity)); canvas.renderAll(); }
}

function setCanvasBackground(color) {
    canvas.setBackgroundColor(color, canvas.renderAll.bind(canvas));
}

function downloadPNG() {
    const dataURL = canvas.toDataURL({ format: 'png', quality: 1 });
    const link = document.createElement('a');
    link.download = `chaply-design-${Date.now()}.png`;
    link.href = dataURL;
    link.click();
}

function resetCanvas() {
    if (confirm('Bütün elementləri silmək istədiyinizə əminsiniz?')) {
        canvas.clear();
        canvas.backgroundColor = '#f0f0f0';
        if (activeProduct) {
            let bgImageUrl = activeProduct.image || activeProduct.url || activeProduct.img;
            if (bgImageUrl) setProductBackground(bgImageUrl);
        }
        canvas.renderAll();
    }
}

// ============================================================
// EVENT LISTENERS
// ============================================================
function initEventListeners() {
    // Mətn əlavə et
    document.getElementById('desktopAddTextBtn')?.addEventListener('click', () => {
        const text = document.getElementById('desktopTextInput').value.trim();
        const color = document.getElementById('desktopColorPicker').value;
        const font = document.getElementById('desktopFontFamily').value;
        addTextToCanvas(text, color, font);
        document.getElementById('desktopTextInput').value = '';
    });

    document.getElementById('mobileAddTextBtn')?.addEventListener('click', () => {
        const text = document.getElementById('mobileTextInput').value.trim();
        const color = document.getElementById('mobileColorPicker').value;
        const font = document.getElementById('mobileFontFamily').value;
        addTextToCanvas(text, color, font);
        document.getElementById('mobileTextInput').value = '';
    });

    // Rəng
    document.getElementById('desktopColorPicker')?.addEventListener('input', e => updateTextColor(e.target.value));
    document.getElementById('mobileColorPicker')?.addEventListener('input', e => updateTextColor(e.target.value));
    document.getElementById('desktopBgColorPicker')?.addEventListener('input', e => setCanvasBackground(e.target.value));
    document.getElementById('mobileBgColorPicker')?.addEventListener('input', e => setCanvasBackground(e.target.value));

    // Şrift
    document.getElementById('desktopFontFamily')?.addEventListener('change', e => updateFontFamily(e.target.value));
    document.getElementById('mobileFontFamily')?.addEventListener('change', e => updateFontFamily(e.target.value));

    document.getElementById('desktopFontSize')?.addEventListener('input', e => {
        document.getElementById('desktopFontSizeValue').textContent = e.target.value;
        updateFontSize(e.target.value);
    });

    document.getElementById('mobileFontSize')?.addEventListener('input', e => {
        document.getElementById('mobileFontSizeValue').textContent = e.target.value;
        updateFontSize(e.target.value);
    });

    document.getElementById('desktopToggleBold')?.addEventListener('click', toggleBold);
    document.getElementById('mobileToggleBold')?.addEventListener('click', toggleBold);
    document.getElementById('desktopToggleItalic')?.addEventListener('click', toggleItalic);
    document.getElementById('mobileToggleItalic')?.addEventListener('click', toggleItalic);
    document.getElementById('desktopToggleUnderline')?.addEventListener('click', toggleUnderline);
    document.getElementById('mobileToggleUnderline')?.addEventListener('click', toggleUnderline);

    // Obyekt
    document.getElementById('desktopBringToFrontBtn')?.addEventListener('click', bringToFront);
    document.getElementById('mobileBringToFrontBtn')?.addEventListener('click', bringToFront);
    document.getElementById('desktopDeleteSelectedBtn')?.addEventListener('click', deleteSelected);
    document.getElementById('mobileDeleteSelectedBtn')?.addEventListener('click', deleteSelected);
    document.getElementById('desktopCloneObjectBtn')?.addEventListener('click', cloneObject);
    document.getElementById('mobileCloneObjectBtn')?.addEventListener('click', cloneObject);
    document.getElementById('desktopCenterObjectBtn')?.addEventListener('click', centerObject);
    document.getElementById('mobileCenterObjectBtn')?.addEventListener('click', centerObject);

    document.getElementById('desktopRotation')?.addEventListener('input', e => {
        document.getElementById('desktopRotationValue').textContent = e.target.value;
        setRotation(e.target.value);
    });

    document.getElementById('mobileRotation')?.addEventListener('input', e => {
        document.getElementById('mobileRotationValue').textContent = e.target.value;
        setRotation(e.target.value);
    });

    document.getElementById('desktopOpacity')?.addEventListener('input', e => {
        document.getElementById('desktopOpacityValue').textContent = e.target.value;
        setOpacity(e.target.value);
    });

    document.getElementById('mobileOpacity')?.addEventListener('input', e => {
        document.getElementById('mobileOpacityValue').textContent = e.target.value;
        setOpacity(e.target.value);
    });

    // Şəkil yüklə
    function handleImageUpload(file) {
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { alert('Şəkil 5MB-dan böyük ola bilməz!'); return; }
        const reader = new FileReader();
        reader.onload = ev => {
            fabric.Image.fromURL(ev.target.result, img => {
                img.scaleToWidth(200);
                img.set({ left: 100, top: 100 });
                canvas.add(img).setActiveObject(img);
                canvas.renderAll();
            });
        };
        reader.readAsDataURL(file);
    }

    document.getElementById('desktopImageUpload')?.addEventListener('change', e => {
        handleImageUpload(e.target.files[0]);
        e.target.value = '';
    });

    document.getElementById('mobileImageUpload')?.addEventListener('change', e => {
        handleImageUpload(e.target.files[0]);
        e.target.value = '';
    });

    // Saxla & Sıfırla
    document.getElementById('desktopDownloadPngBtn')?.addEventListener('click', downloadPNG);
    document.getElementById('mobileDownloadPngBtn')?.addEventListener('click', downloadPNG);
    document.getElementById('desktopResetCanvasBtn')?.addEventListener('click', resetCanvas);
    document.getElementById('mobileResetCanvasBtn')?.addEventListener('click', resetCanvas);

    // Göndər
    document.getElementById('desktopSendDesignBtn')?.addEventListener('click', sendDesign);
    document.getElementById('mobileSendDesignBtn')?.addEventListener('click', sendDesign);

    // Qiymət yeniləmə
    document.getElementById('orderQuantity')?.addEventListener('input', calculateAndUpdatePrice);
    document.getElementById('orderSize')?.addEventListener('change', calculateAndUpdatePrice);
}

// ============================================================
// PREVIEW MODAL
// ============================================================
function openPreviewModal() {
    const modal = document.getElementById('previewModal');
    const productInfo = document.getElementById('previewProductInfo');
    const previewImg = document.getElementById('previewCanvasImage');

    if (activeProduct) {
        let imgUrl = activeProduct.image || activeProduct.url || activeProduct.img || 'https://placehold.co/80x80';
        const fileId = extractGoogleDriveId(imgUrl);
        if (fileId) imgUrl = `https://lh3.googleusercontent.com/d/${fileId}=w80-h80`;

        productInfo.innerHTML = `
            <img src="${imgUrl}" alt="Məhsul" crossorigin="anonymous">
            <div><h4>${activeProduct.name || 'Seçilmiş məhsul'}</h4><p><i class="fas fa-tag"></i> ${getPrintTypeName()}</p></div>
        `;
    } else {
        productInfo.innerHTML = `<img src="https://placehold.co/80x80" alt="Məhsul"><div><h4>Məhsul seçilməyib</h4><p>Zəhmət olmasa məhsul seçin</p></div>`;
    }

    previewImg.src = canvas.toDataURL({ format: 'png', quality: 0.9 });
    modal.style.display = 'flex';
}

function closePreviewModal() {
    document.getElementById('previewModal').style.display = 'none';
}

function sendDesign() {
    if (!activeProduct) {
        alert('Zəhmət olmasa əvvəlcə məhsul seçin!');
        return;
    }
    openPreviewModal();
}

// ============================================================
// SİFARİŞ FORMASI MODAL
// ============================================================
function openOrderForm() {
    closePreviewModal();
    const modal = document.getElementById('orderFormModal');
    const summary = document.getElementById('orderSummary');

    calculateAndUpdatePrice();

    if (activeProduct) {
        let imgUrl = activeProduct.image || activeProduct.url || activeProduct.img || 'https://placehold.co/60x60';
        const fileId = extractGoogleDriveId(imgUrl);
        if (fileId) imgUrl = `https://lh3.googleusercontent.com/d/${fileId}=w60-h60`;

        const unitPrice = calculateUnitPrice();
        const totalPrice = unitPrice * currentQuantity;

        summary.innerHTML = `
            <img src="${imgUrl}" alt="Məhsul" crossorigin="anonymous">
            <div>
                <h4>${activeProduct.name || 'Seçilmiş məhsul'}</h4>
                <p><i class="fas fa-print"></i> ${getPrintTypeName()}</p>
                <p style="margin-top: 4px; font-weight: 600; color: var(--primary-dark);">
                    ${unitPrice.toFixed(2)} ₼ × ${currentQuantity} = ${totalPrice.toFixed(2)} ₼
                </p>
            </div>
        `;
    }

    modal.style.display = 'flex';
}

function closeOrderFormModal() {
    document.getElementById('orderFormModal').style.display = 'none';
}

// ============================================================
// SİFARİŞİ GÖNDƏR (EmailJS ilə)
// ============================================================
// ============================================================
// SİFARİŞİ GÖNDƏR (EmailJS ilə - DİZAYN ŞƏKLİ İLƏ BİRLİKDƏ)
// ============================================================
// ============================================================
// SİFARİŞİ GÖNDƏR (EmailJS ilə - KİÇİLDİLMİŞ DİZAYN ŞƏKLİ)
// ============================================================
document.getElementById('finalOrderForm')?.addEventListener('submit', async function (e) {
    e.preventDefault();

    const name = document.getElementById('orderName')?.value.trim();
    const surname = document.getElementById('orderSurname')?.value.trim();
    const phone = document.getElementById('orderPhone')?.value.trim();
    const address = document.getElementById('orderAddress')?.value.trim();
    const postcode = document.getElementById('orderPostcode')?.value.trim() || '-';
    const note = document.getElementById('orderNote')?.value.trim() || '-';

    if (!name || !surname || !phone || !address) {
        showToast('Zəhmət olmasa bütün vacib sahələri doldurun!', 'warning');
        return;
    }

    if (!activeProduct) {
        showToast('Zəhmət olmasa məhsul seçin!', 'error');
        return;
    }

    // Canvas-ı yenilə
    canvas.renderAll();

    // ============================================================
    // ŞƏKİLİ KİÇİLT (EmailJS 50KB limiti üçün)
    // ============================================================
    let designImage = canvas.toDataURL({
        format: 'jpeg',        // PNG əvəzinə JPEG (daha kiçik)
        quality: 0.6,          // 60% keyfiyyət
        multiplier: 1          // 1x ölçü
    });

    console.log('🎨 Orijinal şəkil ölçüsü:', (designImage.length / 1024).toFixed(2), 'KB');

    // Əgər hələ də 50KB-dan böyükdürsə, daha da kiçilt
    if (designImage.length > 50 * 1024) {
        console.log('⚠️ Şəkil 50KB-dan böyükdür, kiçildilir...');

        // Canvas-ı müvəqqəti olaraq kiçilt
        const tempCanvas = document.createElement('canvas');
        const ctx = tempCanvas.getContext('2d');

        // Maksimum 400x400 ölçüdə
        const maxSize = 400;
        let width = canvas.width;
        let height = canvas.height;

        if (width > maxSize || height > maxSize) {
            const ratio = Math.min(maxSize / width, maxSize / height);
            width = width * ratio;
            height = height * ratio;
        }

        tempCanvas.width = width;
        tempCanvas.height = height;

        // Canvas-ı kiçildilmiş ölçüdə çək
        ctx.drawImage(canvas.lowerCanvasEl, 0, 0, width, height);

        // JPEG formatında, aşağı keyfiyyətdə
        designImage = tempCanvas.toDataURL('image/jpeg', 0.5);

        console.log('📉 Kiçildilmiş şəkil ölçüsü:', (designImage.length / 1024).toFixed(2), 'KB');
    }

    // Əgər hələ də 50KB-dan böyükdürsə, xəta ver
    if (designImage.length > 50 * 1024) {
        showToast('❌ Dizayn şəkli çox böyükdür! Zəhmət olmasa daha az element istifadə edin.', 'error');
        return;
    }

    const unitPrice = calculateUnitPrice();
    const totalPrice = unitPrice * currentQuantity;
    const orderId = generateOrderId();
    const orderDate = getCurrentDateTime();

    // Məhsul şəklini hazırla
    let productImageUrl = activeProduct.image || activeProduct.url || activeProduct.img || 'https://placehold.co/200x200';
    const fileId = extractGoogleDriveId(productImageUrl);
    if (fileId) {
        productImageUrl = `https://lh3.googleusercontent.com/d/${fileId}=w400-h400`;
    }

    const templateParams = {
        email: CONFIG.ORDER_TO_EMAIL,
        order_id: String(orderId),
        order_date: String(orderDate),
        customer_name: String(name + ' ' + surname),
        customer_phone: String(phone),
        customer_address: String(address),
        customer_postcode: String(postcode),
        product_name: String(activeProduct.name || 'Dizayn məhsulu'),
        product_category: String(activeProduct.category || 'Dizayn'),
        product_price: String(unitPrice.toFixed(2) + ' ₼'),
        product_size: String(selectedSize),
        product_quantity: String(currentQuantity),
        total_price: String(totalPrice.toFixed(2) + ' ₼'),
        product_image: String(productImageUrl),
        design_image: designImage,
        note: String('Çap növü: ' + getPrintTypeName() + ' | Qeyd: ' + note)
    };

    console.log('📧 EmailJS-ə göndərilir (şəkil:', (designImage.length / 1024).toFixed(2), 'KB)');

    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Göndərilir...';
    submitBtn.disabled = true;

    try {
        await emailjs.send(CONFIG.EMAILJS_SERVICE_ID, CONFIG.EMAILJS_TEMPLATE_ID, templateParams);
        showToast('✅ Sifarişiniz göndərildi!', 'success');
        closeOrderFormModal();
        document.getElementById('finalOrderForm').reset();
        document.getElementById('orderQuantity').value = 1;
        currentQuantity = 1;
    } catch (err) {
        console.error('❌ EmailJS xətası:', err);

        // 50KB xətası üçün xüsusi mesaj
        if (err?.text?.includes('50Kb') || err?.message?.includes('50Kb')) {
            showToast('❌ Dizayn şəkli email limitini keçir. Zəhmət olmasa daha sadə dizayn edin.', 'error');
        } else {
            showToast('❌ Xəta: ' + (err?.text || err?.message || 'Bilinməyən'), 'error');
        }
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
});
// ============================================================
// SUCCESS MODAL (Sadə)
// ============================================================
function showSuccessModal(title, message, isSuccess = true) {
    // Toast istifadə edirik, ayrıca modal lazım deyil
    showToast(message, isSuccess ? 'success' : 'error');
}

function closeSuccessModal() {
    document.getElementById('successModal').style.display = 'none';
}

// ============================================================
// ROUTING
// ============================================================
function initRouting() {
    const routes = {
        '/': 'index.html',
        '/index': 'index.html',
        '/home': 'index.html',
        '/product': 'product.html',
        '/design': 'created.html',
        '/partnership': 'partnership.html',
        '/designed': 'design.html'
    };

    document.querySelectorAll('[data-link]').forEach(el => {
        el.addEventListener('click', function (e) {
            e.preventDefault();
            const path = this.getAttribute('data-link');
            window.location.href = routes[path] || path + '.html';
        });
    });
}

// Modal close events
document.getElementById('previewModal')?.addEventListener('click', e => {
    if (e.target.classList.contains('preview-modal')) closePreviewModal();
});

document.getElementById('orderFormModal')?.addEventListener('click', e => {
    if (e.target.classList.contains('order-form-modal')) closeOrderFormModal();
});

document.getElementById('successModal')?.addEventListener('click', e => {
    if (e.target.classList.contains('modal')) closeSuccessModal();
});

// ============================================================
// SƏHİFƏ YÜKLƏNMƏSİ
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Dizayn səhifəsi yüklənir...');

    initRouting();
    populateFontSelectors();

    await loadSizes();
    await loadProductTemplates();
    await loadStickers();

    initEventListeners();

    console.log('✅ Dizayn editoru hazırdır!');
});

// Global funksiyalar
window.closePreviewModal = closePreviewModal;
window.openOrderForm = openOrderForm;
window.closeOrderFormModal = closeOrderFormModal;
window.closeSuccessModal = closeSuccessModal;