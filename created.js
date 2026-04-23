// ============================================================
// KONFİQURASİYA
// ============================================================
const CONFIG = {
    SHEET_ID: '1md0gSVfSMdHskEL57HaNteots5hqN_taxMDnQCyVFfc',
    PRODUCTS_SHEET: 'products_for_design',
    STICKERS_SHEET: 'stickers',
    SIZES_SHEET: 'sizes',
    EMAILJS_PUBLIC_KEY: 'nkZ98Ga10XtaLm5By',
    EMAILJS_SERVICE_ID: 'service_7cd7g3b',
    EMAILJS_TEMPLATE_ID: 'template_4kwa9rq',
    ORDER_TO_EMAIL: 'eli120124@gmail.com'
};

const FONT_LIST = [
    'Inter', 'Poppins', 'Roboto', 'Montserrat', 'Open Sans', 'Lato', 'Nunito', 'Raleway',
    'Quicksand', 'DM Sans', 'Manrope', 'Rubik', 'Playfair Display', 'Bebas Neue', 'Anton'
];

if (window.emailjs) emailjs.init(CONFIG.EMAILJS_PUBLIC_KEY);

// ============================================================
// RESPONSİV CANVAS ÖLÇÜSÜ
// ============================================================
function getResponsiveCanvasSize() {
    const container = document.querySelector('.canvas-wrapper');
    if (!container) return { width: 500, height: 500 };
    const containerWidth = container.clientWidth - 40;
    const size = Math.min(containerWidth, 500);
    return { width: size, height: size };
}

// ============================================================
// CANVAS INIT - KİÇİK OBYEKTLƏRİN SEÇİLMƏSİ ÜÇÜN OPTİMİZASİYA
// ============================================================
const canvasSize = getResponsiveCanvasSize();
const canvas = new fabric.Canvas('designCanvas', {
    backgroundColor: '#f0f0f0',
    preserveObjectStacking: true,
    width: canvasSize.width,
    height: canvasSize.height,
    selection: true,
    cornerSize: window.innerWidth <= 768 ? 20 : 12,
    cornerStyle: 'circle',
    borderColor: 'rgb(20,78,46)',
    borderScaleFactor: window.innerWidth <= 768 ? 3 : 2,
    transparentCorners: false,
    centeredRotation: true,
    targetFindTolerance: 30,
    perPixelTargetFind: true,
    interactive: true
});

let activeProduct = null;
let allProducts = [];
let allSizes = [];
let selectedPrintType = 'no_print';
let currentQuantity = 1;
let currentSizeExtra = 0;
let selectedSize = 'M';

// ============================================================
// KÖMƏKÇİ FUNKSİYALAR
// ============================================================
function showToast(msg, type = 'success') {
    const old = document.querySelector('.custom-toast');
    if (old) old.remove();
    
    const toast = document.createElement('div');
    toast.className = 'custom-toast';
    toast.style.cssText = `
        position: fixed; bottom: 100px; left: 50%; transform: translateX(-50%);
        background: #0f3c23; color: white; padding: 12px 24px; border-radius: 30px;
        font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 500;
        z-index: 100000; opacity: 0; transition: opacity 0.3s ease;
        box-shadow: 0 8px 24px rgba(0,0,0,0.2); pointer-events: none;
        max-width: 90vw; text-align: center;
    `;
    
    const colors = { success: '#0f3c23', error: '#dc2626', warning: '#f59e0b', info: '#3b82f6' };
    toast.style.background = colors[type] || colors.success;
    toast.innerHTML = (type === 'error' ? '❌ ' : type === 'warning' ? '⚠️ ' : type === 'info' ? 'ℹ️ ' : '✅ ') + msg;
    document.body.appendChild(toast);
    
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
    });
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function extractGoogleDriveId(url) {
    if (!url) return null;
    const match = url.match(/\/d\/([^\/]+)/);
    return match ? match[1] : null;
}

function getGoogleDriveCdnUrl(fileId) {
    return `https://lh3.googleusercontent.com/d/${fileId}=w800-h800`;
}

function setProductBackground(imgUrl) {
    const w = canvas.width, h = canvas.height;
    if (!imgUrl) { canvas.setBackgroundColor('#f0f0f0', () => canvas.renderAll()); return; }
    
    const fid = extractGoogleDriveId(imgUrl);
    const url = fid ? getGoogleDriveCdnUrl(fid) : imgUrl;
    
    fabric.Image.fromURL(url, (img) => {
        if (!img) { canvas.setBackgroundColor('#e8e8e8', () => canvas.renderAll()); return; }
        const scale = Math.max(w / img.width, h / img.height);
        img.set({
            scaleX: scale, scaleY: scale,
            left: (w - img.width * scale) / 2,
            top: (h - img.height * scale) / 2,
            selectable: false, evented: false
        });
        canvas.setBackgroundImage(img, () => canvas.renderAll());
    }, { crossOrigin: 'anonymous' });
}

function generateOrderId() {
    return 'CH-' + Date.now().toString().slice(-8) + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
}

function getCurrentDateTime() {
    const now = new Date();
    return `${now.getDate().toString().padStart(2, '0')}.${(now.getMonth() + 1).toString().padStart(2, '0')}.${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
}

// ============================================================
// MOBİL PANEL FUNKSİYALARI
// ============================================================
let activeMobilePanel = null;

function openMobilePanel(panelId) {
    document.querySelectorAll('.mobile-panel-container').forEach(panel => {
        panel.classList.remove('active');
    });
    
    const panel = document.getElementById(`mobile-panel-${panelId}`);
    if (panel) {
        panel.classList.add('active');
        activeMobilePanel = panelId;
        // Aktiv panelə scroll et
        setTimeout(() => {
            panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
    }
}

function closeMobilePanel(panelId) {
    const panel = document.getElementById(`mobile-panel-${panelId}`);
    if (panel) {
        panel.classList.remove('active');
    }
    if (activeMobilePanel === panelId) {
        activeMobilePanel = null;
    }
}

window.closeMobilePanel = closeMobilePanel;

// ============================================================
// ŞRİFT DROPDOWNLARI
// ============================================================
function populateFontSelectors() {
    const desktopSelect = document.getElementById('desktopFontFamily');
    const mobileSelect = document.getElementById('mobileFontFamily');
    
    [desktopSelect, mobileSelect].forEach(select => {
        if (!select) return;
        select.innerHTML = '';
        FONT_LIST.forEach(font => {
            const opt = document.createElement('option');
            opt.value = font;
            opt.textContent = font;
            opt.style.fontFamily = font;
            select.appendChild(opt);
        });
        select.value = 'Inter';
    });
}

// ============================================================
// GOOGLE SHEETS
// ============================================================
async function fetchSheet(sheetName) {
    try {
        const url = `https://opensheet.elk.sh/${CONFIG.SHEET_ID}/${sheetName}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch (e) {
        console.error(`${sheetName} xətası:`, e);
        return [];
    }
}

async function loadSizes() {
    allSizes = await fetchSheet(CONFIG.SIZES_SHEET);
    const sel = document.getElementById('orderSize');
    if (!sel) return;
    sel.innerHTML = '';
    
    if (allSizes.length) {
        allSizes.forEach(sz => {
            const opt = document.createElement('option');
            opt.value = sz.name || sz.size || sz;
            opt.textContent = sz.name || sz.size || sz;
            sel.appendChild(opt);
        });
    } else {
        ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'].forEach(sz => {
            const opt = document.createElement('option');
            opt.value = sz;
            opt.textContent = sz;
            sel.appendChild(opt);
        });
    }
    selectedSize = sel.value || 'M';
}

async function loadProductTemplates() {
    const container = document.getElementById('templatesList');
    allProducts = await fetchSheet(CONFIG.PRODUCTS_SHEET);
    
    if (!container) return;
    
    if (!allProducts.length) {
        container.innerHTML = '<div class="template-card"><span>Məhsul tapılmadı</span></div>';
        return;
    }
    
    container.innerHTML = '';
    allProducts.forEach((product, i) => {
        const card = document.createElement('div');
        card.className = 'template-card';
        
        const img = document.createElement('img');
        let url = product.image || product.url || 'https://placehold.co/200x200/1a5c3e/white?text=Image';
        const fid = extractGoogleDriveId(url);
        if (fid) url = `https://lh3.googleusercontent.com/d/${fid}=w150-h150`;
        img.src = url;
        img.alt = product.name || 'Məhsul';
        img.onerror = () => { img.src = 'https://placehold.co/200x200/1a5c3e/white?text=No+Image'; };
        
        const span = document.createElement('span');
        span.textContent = product.name || `Məhsul ${i+1}`;
        
        card.appendChild(img);
        card.appendChild(span);
        
        card.onclick = () => {
            document.querySelectorAll('.template-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            activeProduct = product;
            setProductBackground(product.image || product.url);
            updatePrintOptions(product);
            calculateAndUpdatePrice();
        };
        container.appendChild(card);
    });
    
    // Mobil şablonları da doldur
    updateMobileTemplates();
    
    setTimeout(() => {
        const first = document.querySelector('.template-card');
        if (first) first.click();
    }, 500);
}

function updateMobileTemplates() {
    const container = document.getElementById('mobileTemplatesList');
    if (!container || !allProducts.length) return;
    
    container.innerHTML = '';
    allProducts.forEach((product, i) => {
        const card = document.createElement('div');
        card.className = 'mobile-template-card';
        
        const img = document.createElement('img');
        let url = product.image || product.url || 'https://placehold.co/200x200/1a5c3e/white?text=Image';
        const fid = extractGoogleDriveId(url);
        if (fid) url = `https://lh3.googleusercontent.com/d/${fid}=w100-h100`;
        img.src = url;
        img.alt = product.name || 'Məhsul';
        img.onerror = () => { img.src = 'https://placehold.co/200x200/1a5c3e/white?text=No+Image'; };
        
        const span = document.createElement('span');
        span.textContent = product.name || `Məhsul ${i+1}`;
        
        card.appendChild(img);
        card.appendChild(span);
        
        card.onclick = () => {
            document.querySelectorAll('.mobile-template-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            
            document.querySelectorAll('.template-card').forEach(c => c.classList.remove('active'));
            const desktopCards = document.querySelectorAll('.template-card');
            if (desktopCards[i]) desktopCards[i].classList.add('active');
            
            activeProduct = product;
            setProductBackground(product.image || product.url);
            updatePrintOptions(product);
            calculateAndUpdatePrice();
            closeMobilePanel('templates');
        };
        container.appendChild(card);
    });
}

async function loadStickers() {
    const stickers = await fetchSheet(CONFIG.STICKERS_SHEET);
    const desktopContainer = document.getElementById('desktopStickersList');
    const mobileContainer = document.getElementById('mobileStickersList');
    
    if (!stickers.length) {
        const msg = '<div style="grid-column:span 3; text-align:center; color:#999;">Şablon yoxdur</div>';
        if (desktopContainer) desktopContainer.innerHTML = msg;
        if (mobileContainer) mobileContainer.innerHTML = msg;
        return;
    }
    
    const createCard = (sticker) => {
        const card = document.createElement('div');
        card.className = 'sticker-card';
        const img = document.createElement('img');
        let url = sticker.image || sticker.url || 'https://placehold.co/100x100/1a5c3e/white?text=Sticker';
        const fid = extractGoogleDriveId(url);
        if (fid) url = `https://lh3.googleusercontent.com/d/${fid}=w100-h100`;
        img.src = url;
        img.onerror = () => { img.src = 'https://placehold.co/100x100/1a5c3e/white?text=No+Image'; };
        img.alt = sticker.name || 'Şablon';
        const span = document.createElement('span');
        span.textContent = sticker.name || 'Şablon';
        card.appendChild(img);
        card.appendChild(span);
        card.onclick = () => {
            addStickerToCanvas(sticker.image || sticker.url);
            if (window.innerWidth <= 768) closeMobilePanel('stickers');
        };
        return card;
    };
    
    if (desktopContainer) {
        desktopContainer.innerHTML = '';
        stickers.forEach(s => desktopContainer.appendChild(createCard(s)));
    }
    if (mobileContainer) {
        mobileContainer.innerHTML = '';
        stickers.forEach(s => mobileContainer.appendChild(createCard(s)));
    }
}

function addStickerToCanvas(imgUrl) {
    if (!imgUrl) return;
    const fid = extractGoogleDriveId(imgUrl);
    const url = fid ? `https://lh3.googleusercontent.com/d/${fid}=w300-h300` : imgUrl;
    
    fabric.Image.fromURL(url, (img) => {
        if (!img) return;
        const maxW = canvas.width * 0.4;
        if (img.width > maxW) img.scaleToWidth(maxW);
        img.set({
            left: canvas.width/2 - (img.width * (img.scaleX || 1))/2,
            top: canvas.height/2 - (img.height * (img.scaleY || 1))/2,
            cornerSize: window.innerWidth <= 768 ? 20 : 12,
            cornerStyle: 'circle',
            borderColor: 'rgb(20,78,46)',
            hasControls: true,
            hasBorders: true
        });
        canvas.add(img).setActiveObject(img);
        canvas.renderAll();
    }, { crossOrigin: 'anonymous' });
}

// ============================================================
// PRINT & PRICE
// ============================================================
function updatePrintOptions(product) {
    const container = document.getElementById('printOptionsGrid');
    if (!container) return;
    
    const options = [
        { id: 'no_print', name: 'Çapsız', key: 'price_no_print' },
        { id: 'small', name: 'Kiçik çap', key: 'price_small_print' },
        { id: 'single', name: 'Tək tərəf', key: 'price_single_side' },
        { id: 'double', name: 'İki tərəf', key: 'price_double_side' },
        { id: 'sleeve', name: 'Qol çapı', key: 'price_sleeve' },
        { id: 'collar', name: 'Boyun çapı', key: 'price_collar' }
    ];
    
    container.innerHTML = '';
    options.forEach(opt => {
        const price = product[opt.key];
        const btn = document.createElement('div');
        btn.className = 'print-option-btn';
        btn.dataset.printType = opt.id;
        
        if (!price || price === 'none') {
            btn.classList.add('disabled');
            btn.innerHTML = `<i class="fas fa-ban"></i> ${opt.name}<br><small>❌</small>`;
        } else {
            btn.innerHTML = `<i class="fas fa-print"></i> ${opt.name}<br><small>+${parseFloat(price).toFixed(2)} ₼</small>`;
            btn.onclick = () => {
                document.querySelectorAll('.print-option-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                selectedPrintType = opt.id;
                calculateAndUpdatePrice();
            };
        }
        container.appendChild(btn);
    });
    
    const noPrint = container.querySelector('.print-option-btn:first-child');
    if (noPrint && !noPrint.classList.contains('disabled')) {
        noPrint.classList.add('active');
        selectedPrintType = 'no_print';
    } else {
        // İlk aktiv seçimi tap
        const firstActive = container.querySelector('.print-option-btn:not(.disabled)');
        if (firstActive) {
            firstActive.classList.add('active');
            selectedPrintType = firstActive.dataset.printType || 'no_print';
        }
    }
    calculateAndUpdatePrice();
}

function calculateAndUpdatePrice() {
    if (!activeProduct) return;
    
    const qty = parseInt(document.getElementById('orderQuantity')?.value) || 1;
    currentQuantity = qty;
    
    const sizeSel = document.getElementById('orderSize');
    if (sizeSel) selectedSize = sizeSel.value;
    
    let sizeExtra = 0;
    if (sizeSel && allSizes.length) {
        const sz = allSizes.find(s => (s.name || s.size) === selectedSize);
        if (sz) sizeExtra = parseFloat(sz.price_extra || sz.extra || 0) || 0;
    }
    currentSizeExtra = sizeExtra;
    
    const base = parseFloat(activeProduct.price_no_print) || 0;
    const priceMap = {
        'no_print': 'price_no_print', 'small': 'price_small_print',
        'single': 'price_single_side', 'double': 'price_double_side',
        'sleeve': 'price_sleeve', 'collar': 'price_collar'
    };
    let printPrice = 0;
    const pk = priceMap[selectedPrintType];
    if (pk && activeProduct[pk] && activeProduct[pk] !== 'none') printPrice = parseFloat(activeProduct[pk]) || 0;
    
    const unit = base + printPrice + sizeExtra;
    const total = unit * qty;
    
    const baseEl = document.getElementById('baseProductPrice');
    const printEl = document.getElementById('printServicePrice');
    const sizeEl = document.getElementById('sizeExtraPrice');
    const totalEl = document.getElementById('totalOrderPrice');
    const sizeRow = document.getElementById('sizePriceRow');
    const printRow = document.getElementById('printPriceRow');
    
    if (baseEl) baseEl.textContent = `${base.toFixed(2)} ₼`;
    if (printEl) printEl.textContent = `${printPrice.toFixed(2)} ₼`;
    if (sizeEl) sizeEl.textContent = `${sizeExtra.toFixed(2)} ₼`;
    if (totalEl) totalEl.textContent = `${total.toFixed(2)} ₼`;
    
    // Gizlət/göstər
    if (sizeRow) sizeRow.style.display = sizeExtra === 0 ? 'none' : 'flex';
    if (printRow) printRow.style.display = printPrice === 0 ? 'none' : 'flex';
}

function calculateUnitPrice() {
    if (!activeProduct) return 0;
    const base = parseFloat(activeProduct.price_no_print) || 0;
    const priceMap = {
        'no_print': 'price_no_print', 'small': 'price_small_print',
        'single': 'price_single_side', 'double': 'price_double_side',
        'sleeve': 'price_sleeve', 'collar': 'price_collar'
    };
    let printPrice = 0;
    const pk = priceMap[selectedPrintType];
    if (pk && activeProduct[pk] && activeProduct[pk] !== 'none') printPrice = parseFloat(activeProduct[pk]) || 0;
    return base + printPrice + currentSizeExtra;
}

function getPrintTypeName() {
    const names = {
        'no_print': 'Çapsız', 'small': 'Kiçik çap',
        'single': 'Tək tərəf', 'double': 'İki tərəf',
        'sleeve': 'Qol çapı', 'collar': 'Boyun çapı'
    };
    return names[selectedPrintType] || 'Çapsız';
}

// ============================================================
// CANVAS OBYEKT FUNKSİYALARI
// ============================================================
function addTextToCanvas(text, color, fontFamily = 'Inter') {
    const obj = new fabric.IText(text || 'Mətn', {
        left: canvas.width/2 - 50, 
        top: canvas.height/2 - 20,
        fill: color || '#000000', 
        fontSize: 30, 
        fontFamily: fontFamily,
        fontWeight: 'normal',
        fontStyle: 'normal',
        cornerSize: window.innerWidth <= 768 ? 20 : 12,
        cornerStyle: 'circle',
        borderColor: 'rgb(20,78,46)',
        hasControls: true,
        hasBorders: true,
        lockScalingX: false,
        lockScalingY: false,
        selectable: true
    });
    canvas.add(obj).setActiveObject(obj);
    canvas.renderAll();
    if (window.innerWidth <= 768) showToast('📝 Mətni sürükləyərək yerləşdirin', 'info');
}

function updateTextColor(color) {
    const obj = canvas.getActiveObject();
    if (obj && (obj.type === 'i-text' || obj.type === 'text' || obj.type === 'textbox')) {
        if (obj.isEditing) {
            obj.setSelectionStyles({ 'fill': color });
        } else {
            obj.set('fill', color);
        }
        canvas.renderAll();
    }
}

function updateFontFamily(family) {
    const obj = canvas.getActiveObject();
    if (obj && (obj.type === 'i-text' || obj.type === 'text' || obj.type === 'textbox')) {
        if (obj.isEditing) {
            obj.setSelectionStyles({ 'fontFamily': family });
        } else {
            obj.set('fontFamily', family);
        }
        canvas.renderAll();
    }
}

function updateFontSize(size) {
    const obj = canvas.getActiveObject();
    if (obj && (obj.type === 'i-text' || obj.type === 'text' || obj.type === 'textbox')) {
        const numSize = parseInt(size);
        if (obj.isEditing) {
            obj.setSelectionStyles({ 'fontSize': numSize });
        } else {
            obj.set('fontSize', numSize);
        }
        canvas.renderAll();
        
        // Slider dəyərlərini yenilə
        document.getElementById('desktopFontSizeValue').textContent = numSize;
        document.getElementById('mobileFontSizeValue').textContent = numSize;
    }
}

function toggleBold() {
    const obj = canvas.getActiveObject();
    if (obj && (obj.type === 'i-text' || obj.type === 'text' || obj.type === 'textbox')) {
        const currentWeight = obj.get('fontWeight');
        const newWeight = (currentWeight === 'bold') ? 'normal' : 'bold';
        
        if (obj.isEditing) {
            obj.setSelectionStyles({ 'fontWeight': newWeight });
        } else {
            obj.set('fontWeight', newWeight);
        }
        canvas.renderAll();
    }
}

// DÜZƏLDİLMİŞ İTALİK FUNKSİYASI
function toggleItalic() {
    const obj = canvas.getActiveObject();
    if (obj && (obj.type === 'i-text' || obj.type === 'text' || obj.type === 'textbox')) {
        const currentStyle = obj.get('fontStyle');
        const newStyle = (currentStyle === 'italic') ? 'normal' : 'italic';
        
        if (obj.isEditing) {
            // Redaktə modunda seçilmiş hissəyə tətbiq et
            obj.setSelectionStyles({ 'fontStyle': newStyle });
        } else {
            // Bütün mətnə tətbiq et
            obj.set('fontStyle', newStyle);
        }
        canvas.renderAll();
    }
}

function toggleUnderline() {
    const obj = canvas.getActiveObject();
    if (obj && obj.type === 'i-text') {
        const currentUnderline = obj.get('underline');
        if (obj.isEditing) {
            obj.setSelectionStyles({ 'underline': !currentUnderline });
        } else {
            obj.set('underline', !currentUnderline);
        }
        canvas.renderAll();
    }
}

function bringToFront() {
    const obj = canvas.getActiveObject();
    if (obj) { canvas.bringToFront(obj); canvas.renderAll(); }
}

function deleteSelected() {
    const obj = canvas.getActiveObject();
    if (obj) { canvas.remove(obj); canvas.discardActiveObject(); canvas.renderAll(); }
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
    canvas.setBackgroundColor(color, () => canvas.renderAll());
}

function downloadPNG() {
    const link = document.createElement('a');
    link.download = `chaply-design-${Date.now()}.png`;
    link.href = canvas.toDataURL({ format: 'png' });
    link.click();
    showToast('Dizayn yükləndi!', 'success');
}

function resetCanvas() {
    if (confirm('Bütün elementləri silmək istədiyinizə əminsiniz?')) {
        canvas.clear();
        canvas.backgroundColor = '#f0f0f0';
        if (activeProduct) setProductBackground(activeProduct.image || activeProduct.url);
        canvas.renderAll();
        showToast('Canvas sıfırlandı', 'info');
    }
}

// ============================================================
// FAYL YÜKLƏMƏ FUNKSİYASI (DÜZƏLDİLDİ)
// ============================================================
function handleImageUpload(file, source = 'desktop') {
    if (!file) {
        showToast('Fayl seçilmədi!', 'warning');
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
        showToast('Şəkil 5MB-dan böyük ola bilməz!', 'warning');
        return;
    }
    
    if (!file.type.startsWith('image/')) {
        showToast('Zəhmət olmasa şəkil faylı seçin!', 'warning');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (ev) => {
        try {
            fabric.Image.fromURL(ev.target.result, (img) => {
                if (!img) {
                    showToast('Şəkil yüklənmədi! Fayl formatı dəstəklənməyə bilər.', 'error');
                    return;
                }
                const maxW = canvas.width * 0.4;
                if (img.width > maxW) img.scaleToWidth(maxW);
                img.set({ 
                    left: 100, 
                    top: 100, 
                    cornerSize: window.innerWidth <= 768 ? 20 : 12,
                    cornerStyle: 'circle',
                    borderColor: 'rgb(20,78,46)',
                    hasControls: true,
                    hasBorders: true,
                    lockScalingX: false,
                    lockScalingY: false
                });
                canvas.add(img).setActiveObject(img);
                canvas.renderAll();
                showToast('Şəkil əlavə olundu!', 'success');
            }, { crossOrigin: 'anonymous' });
        } catch (error) {
            console.error('Fabric.js şəkil yükləmə xətası:', error);
            showToast('Şəkil emal edilə bilmədi.', 'error');
        }
    };
    reader.onerror = (error) => {
        console.error('Fayl oxuma xətası:', error);
        showToast('Fayl oxunmadı!', 'error');
    };
    reader.readAsDataURL(file);
}

// ============================================================
// SEÇİM DƏYİŞİKLİYİNDƏ SLIDERLARI YENILƏ
// ============================================================
canvas.on('selection:created', (e) => updateSliders(e.selected?.[0]));
canvas.on('selection:updated', (e) => updateSliders(e.selected?.[0]));
canvas.on('selection:cleared', () => {
    // Seçim ləğv olunduqda default dəyərlərə qaytar
    document.getElementById('desktopFontSizeValue').textContent = '30';
    document.getElementById('mobileFontSizeValue').textContent = '30';
    document.getElementById('desktopRotationValue').textContent = '0';
    document.getElementById('mobileRotationValue').textContent = '0';
    document.getElementById('desktopOpacityValue').textContent = '1.0';
    document.getElementById('mobileOpacityValue').textContent = '1.0';
});

function updateSliders(obj) {
    if (!obj) return;
    
    // Mətn obyekti üçün
    if (obj.type === 'i-text' || obj.type === 'text' || obj.type === 'textbox') {
        const fs = obj.fontSize || 30;
        const desktopFs = document.getElementById('desktopFontSize');
        const mobileFs = document.getElementById('mobileFontSize');
        if (desktopFs) desktopFs.value = fs;
        if (mobileFs) mobileFs.value = fs;
        document.getElementById('desktopFontSizeValue').textContent = fs;
        document.getElementById('mobileFontSizeValue').textContent = fs;
        
        const ff = obj.fontFamily || 'Inter';
        const desktopFam = document.getElementById('desktopFontFamily');
        const mobileFam = document.getElementById('mobileFontFamily');
        if (desktopFam) desktopFam.value = ff;
        if (mobileFam) mobileFam.value = ff;
    }
    
    // Fırlatma
    const angle = Math.round(obj.angle || 0);
    const desktopRot = document.getElementById('desktopRotation');
    const mobileRot = document.getElementById('mobileRotation');
    if (desktopRot) desktopRot.value = angle;
    if (mobileRot) mobileRot.value = angle;
    document.getElementById('desktopRotationValue').textContent = angle;
    document.getElementById('mobileRotationValue').textContent = angle;
    
    // Şəffaflıq
    const opacity = obj.opacity !== undefined ? obj.opacity : 1;
    const desktopOp = document.getElementById('desktopOpacity');
    const mobileOp = document.getElementById('mobileOpacity');
    if (desktopOp) desktopOp.value = opacity;
    if (mobileOp) mobileOp.value = opacity;
    document.getElementById('desktopOpacityValue').textContent = opacity.toFixed(2);
    document.getElementById('mobileOpacityValue').textContent = opacity.toFixed(2);
}

// ============================================================
// BÜTÜN EVENT LISTENERLAR
// ============================================================
function initEventListeners() {
    // ========== DESKTOP FAYL YÜKLƏMƏ (DÜZƏLDİLDİ) ==========
    const desktopImageInput = document.getElementById('desktopImageUpload');
    if (desktopImageInput) {
        // Hər click-də input dəyərini sıfırla ki, eyni fayl təkrar seçilə bilsin
        desktopImageInput.addEventListener('click', function() {
            this.value = null;
        });
        // Fayl seçildikdə handleImageUpload funksiyasını çağır
        desktopImageInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                handleImageUpload(file, 'desktop');
            }
            this.value = null;
        });
    }
    
    // ========== MOBİL FAYL YÜKLƏMƏ (DÜZƏLDİLDİ) ==========
    const mobileImageInput = document.getElementById('mobileImageUpload');
    if (mobileImageInput) {
        mobileImageInput.addEventListener('click', function() {
            this.value = null;
        });
        mobileImageInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                handleImageUpload(file, 'mobile');
                closeMobilePanel('image');
            }
            this.value = null;
        });
    }
    
    // ========== DESKTOP MƏTN ƏLAVƏ ==========
    const desktopAddText = document.getElementById('desktopAddTextBtn');
    if (desktopAddText) {
        desktopAddText.onclick = () => {
            const text = document.getElementById('desktopTextInput')?.value || '';
            const color = document.getElementById('desktopColorPicker')?.value || '#000000';
            const font = document.getElementById('desktopFontFamily')?.value || 'Inter';
            addTextToCanvas(text, color, font);
            const input = document.getElementById('desktopTextInput');
            if (input) input.value = '';
        };
    }
    
    // Enter ilə mətn əlavə et
    const desktopTextInput = document.getElementById('desktopTextInput');
    if (desktopTextInput) {
        desktopTextInput.onkeydown = (e) => {
            if (e.key === 'Enter') {
                const color = document.getElementById('desktopColorPicker')?.value || '#000000';
                const font = document.getElementById('desktopFontFamily')?.value || 'Inter';
                addTextToCanvas(desktopTextInput.value, color, font);
                desktopTextInput.value = '';
            }
        };
    }
    
    // ========== DESKTOP RƏNG ==========
    const desktopColor = document.getElementById('desktopColorPicker');
    if (desktopColor) desktopColor.oninput = (e) => updateTextColor(e.target.value);
    
    const desktopBg = document.getElementById('desktopBgColorPicker');
    if (desktopBg) desktopBg.oninput = (e) => setCanvasBackground(e.target.value);
    
    // ========== DESKTOP ŞRİFT ==========
    const desktopFont = document.getElementById('desktopFontFamily');
    if (desktopFont) desktopFont.onchange = (e) => updateFontFamily(e.target.value);
    
    const desktopFontSize = document.getElementById('desktopFontSize');
    if (desktopFontSize) {
        desktopFontSize.oninput = (e) => {
            updateFontSize(e.target.value);
            document.getElementById('desktopFontSizeValue').textContent = e.target.value;
        };
    }
    
    const desktopBold = document.getElementById('desktopToggleBold');
    if (desktopBold) desktopBold.onclick = toggleBold;
    
    const desktopItalic = document.getElementById('desktopToggleItalic');
    if (desktopItalic) desktopItalic.onclick = toggleItalic;
    
    const desktopUnderline = document.getElementById('desktopToggleUnderline');
    if (desktopUnderline) desktopUnderline.onclick = toggleUnderline;
    
    // ========== DESKTOP OBYEKT İDARƏETMƏ ==========
    const desktopBring = document.getElementById('desktopBringToFrontBtn');
    if (desktopBring) desktopBring.onclick = bringToFront;
    
    const desktopDelete = document.getElementById('desktopDeleteSelectedBtn');
    if (desktopDelete) desktopDelete.onclick = deleteSelected;
    
    const desktopClone = document.getElementById('desktopCloneObjectBtn');
    if (desktopClone) desktopClone.onclick = cloneObject;
    
    const desktopCenter = document.getElementById('desktopCenterObjectBtn');
    if (desktopCenter) desktopCenter.onclick = centerObject;
    
    const desktopRot = document.getElementById('desktopRotation');
    if (desktopRot) {
        desktopRot.oninput = (e) => {
            setRotation(e.target.value);
            document.getElementById('desktopRotationValue').textContent = e.target.value;
        };
    }
    
    const desktopOp = document.getElementById('desktopOpacity');
    if (desktopOp) {
        desktopOp.oninput = (e) => {
            setOpacity(e.target.value);
            document.getElementById('desktopOpacityValue').textContent = parseFloat(e.target.value).toFixed(2);
        };
    }
    
    const desktopDownload = document.getElementById('desktopDownloadPngBtn');
    if (desktopDownload) desktopDownload.onclick = downloadPNG;
    
    const desktopReset = document.getElementById('desktopResetCanvasBtn');
    if (desktopReset) desktopReset.onclick = resetCanvas;
    
    const desktopSend = document.getElementById('desktopSendDesignBtn');
    if (desktopSend) desktopSend.onclick = openPreviewModal;
    
    // ========== MOBİL MƏTN ==========
    const mobileAddText = document.getElementById('mobileAddTextBtn');
    if (mobileAddText) {
        mobileAddText.onclick = () => {
            const text = document.getElementById('mobileTextInput')?.value || '';
            const color = document.getElementById('mobileColorPicker')?.value || '#000000';
            const font = document.getElementById('mobileFontFamily')?.value || 'Inter';
            addTextToCanvas(text, color, font);
            const input = document.getElementById('mobileTextInput');
            if (input) input.value = '';
            closeMobilePanel('text');
        };
    }
    
    const mobileColor = document.getElementById('mobileColorPicker');
    if (mobileColor) mobileColor.oninput = (e) => updateTextColor(e.target.value);
    
    const mobileBg = document.getElementById('mobileBgColorPicker');
    if (mobileBg) mobileBg.oninput = (e) => setCanvasBackground(e.target.value);
    
    const mobileFont = document.getElementById('mobileFontFamily');
    if (mobileFont) mobileFont.onchange = (e) => updateFontFamily(e.target.value);
    
    const mobileFontSize = document.getElementById('mobileFontSize');
    if (mobileFontSize) {
        mobileFontSize.oninput = (e) => {
            updateFontSize(e.target.value);
            document.getElementById('mobileFontSizeValue').textContent = e.target.value;
        };
    }
    
    const mobileBold = document.getElementById('mobileToggleBold');
    if (mobileBold) mobileBold.onclick = toggleBold;
    
    const mobileItalic = document.getElementById('mobileToggleItalic');
    if (mobileItalic) mobileItalic.onclick = toggleItalic;
    
    const mobileUnderline = document.getElementById('mobileToggleUnderline');
    if (mobileUnderline) mobileUnderline.onclick = toggleUnderline;
    
    const mobileBring = document.getElementById('mobileBringToFrontBtn');
    if (mobileBring) mobileBring.onclick = bringToFront;
    
    const mobileDelete = document.getElementById('mobileDeleteSelectedBtn');
    if (mobileDelete) mobileDelete.onclick = deleteSelected;
    
    const mobileClone = document.getElementById('mobileCloneObjectBtn');
    if (mobileClone) mobileClone.onclick = cloneObject;
    
    const mobileCenter = document.getElementById('mobileCenterObjectBtn');
    if (mobileCenter) mobileCenter.onclick = centerObject;
    
    const mobileRot = document.getElementById('mobileRotation');
    if (mobileRot) {
        mobileRot.oninput = (e) => {
            setRotation(e.target.value);
            document.getElementById('mobileRotationValue').textContent = e.target.value;
        };
    }
    
    const mobileOp = document.getElementById('mobileOpacity');
    if (mobileOp) {
        mobileOp.oninput = (e) => {
            setOpacity(e.target.value);
            document.getElementById('mobileOpacityValue').textContent = parseFloat(e.target.value).toFixed(2);
        };
    }
    
    const mobileDownload = document.getElementById('mobileDownloadPngBtn');
    if (mobileDownload) mobileDownload.onclick = downloadPNG;
    
    const mobileReset = document.getElementById('mobileResetCanvasBtn');
    if (mobileReset) mobileReset.onclick = resetCanvas;
    
    const mobileSend = document.getElementById('mobileSendDesignBtn');
    if (mobileSend) mobileSend.onclick = openPreviewModal;
    
    // ========== MOBİL TOOL ICON LAR ==========
    const toolIcons = document.querySelectorAll('.tool-icon');
    toolIcons.forEach(icon => {
        icon.onclick = (e) => {
            e.stopPropagation();
            const panelId = icon.getAttribute('data-panel');
            if (panelId) {
                const targetPanel = document.getElementById(`mobile-panel-${panelId}`);
                if (targetPanel && targetPanel.classList.contains('active')) {
                    closeMobilePanel(panelId);
                    icon.classList.remove('active');
                } else {
                    // Bütün panelləri bağla
                    document.querySelectorAll('.tool-icon').forEach(ti => ti.classList.remove('active'));
                    icon.classList.add('active');
                    openMobilePanel(panelId);
                }
            }
        };
    });
    
    // ========== QİYMƏT YENİLƏMƏ ==========
    const orderQty = document.getElementById('orderQuantity');
    if (orderQty) orderQty.oninput = calculateAndUpdatePrice;
    
    const orderSize = document.getElementById('orderSize');
    if (orderSize) orderSize.onchange = calculateAndUpdatePrice;
    
    // ========== KLAVİATURA QISAYOLLARI ==========
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
        
        if (e.ctrlKey || e.metaKey) {
            switch(e.key.toLowerCase()) {
                case 'c':
                    e.preventDefault();
                    cloneObject();
                    break;
                case 'delete':
                case 'backspace':
                    e.preventDefault();
                    deleteSelected();
                    break;
                case 's':
                    e.preventDefault();
                    downloadPNG();
                    break;
            }
        } else if (e.key === 'Delete' || e.key === 'Backspace') {
            e.preventDefault();
            deleteSelected();
        }
    });
}

// ============================================================
// PREVIEW & ORDER
// ============================================================
function openPreviewModal() {
    if (!activeProduct) { showToast('Zəhmət olmasa məhsul seçin!', 'warning'); return; }
    
    const modal = document.getElementById('previewModal');
    const info = document.getElementById('previewProductInfo');
    const img = document.getElementById('previewCanvasImage');
    
    let url = activeProduct.image || activeProduct.url || 'https://placehold.co/80x80';
    const fid = extractGoogleDriveId(url);
    if (fid) url = `https://lh3.googleusercontent.com/d/${fid}=w80-h80`;
    
    info.innerHTML = `
        <img src="${url}" style="width:70px; height:70px; object-fit:contain; border-radius:12px;" onerror="this.src='https://placehold.co/70x70/1a5c3e/white?text=No+Img'">
        <div><h4>${activeProduct.name || 'Məhsul'}</h4><p>${getPrintTypeName()}</p></div>
    `;
    img.src = canvas.toDataURL({ format: 'png' });
    modal.style.display = 'flex';
}

function closePreviewModal() {
    document.getElementById('previewModal').style.display = 'none';
}

function openOrderForm() {
    closePreviewModal();
    const modal = document.getElementById('orderFormModal');
    const summary = document.getElementById('orderSummary');
    
    calculateAndUpdatePrice();
    
    let url = activeProduct?.image || activeProduct?.url || 'https://placehold.co/60x60';
    const fid = extractGoogleDriveId(url);
    if (fid) url = `https://lh3.googleusercontent.com/d/${fid}=w60-h60`;
    
    const unit = calculateUnitPrice();
    const total = unit * currentQuantity;
    
    summary.innerHTML = `
        <img src="${url}" style="width:50px; height:50px; object-fit:contain;" onerror="this.src='https://placehold.co/50x50/1a5c3e/white?text=No+Img'">
        <div>
            <b>${activeProduct?.name || 'Məhsul'}</b><br>
            ${getPrintTypeName()} | ${selectedSize}<br>
            ${unit.toFixed(2)} ₼ × ${currentQuantity} = ${total.toFixed(2)} ₼
        </div>
    `;
    modal.style.display = 'flex';
}

function closeOrderFormModal() {
    document.getElementById('orderFormModal').style.display = 'none';
}

// ============================================================
// SİFARİŞ GÖNDƏR
// ============================================================
document.getElementById('finalOrderForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const name = document.getElementById('orderName')?.value.trim();
    const surname = document.getElementById('orderSurname')?.value.trim();
    const phone = document.getElementById('orderPhone')?.value.trim();
    const address = document.getElementById('orderAddress')?.value.trim();
    const postcode = document.getElementById('orderPostcode')?.value.trim() || '-';
    const note = document.getElementById('orderNote')?.value.trim() || '-';
    
    if (!name || !surname || !phone || !address) {
        showToast('Bütün vacib sahələri doldurun!', 'warning');
        return;
    }
    if (!activeProduct) { showToast('Məhsul seçin!', 'error'); return; }
    
    canvas.renderAll();
    canvas.discardActiveObject();
    canvas.renderAll();
    
    let designImage = canvas.toDataURL({ format: 'jpeg', quality: 0.6 });
    if (designImage.length > 50 * 1024) {
        const temp = document.createElement('canvas');
        const ctx = temp.getContext('2d');
        const max = 400;
        let w = canvas.width, h = canvas.height;
        if (w > max || h > max) { const r = Math.min(max/w, max/h); w *= r; h *= r; }
        temp.width = w; temp.height = h;
        ctx.drawImage(canvas.lowerCanvasEl, 0, 0, w, h);
        designImage = temp.toDataURL('image/jpeg', 0.5);
    }
    
    if (designImage.length > 50 * 1024) {
        showToast('Dizayn çox böyükdür, daha sadə edin!', 'error');
        return;
    }
    
    const unit = calculateUnitPrice();
    const total = unit * currentQuantity;
    const orderId = generateOrderId();
    const orderDate = getCurrentDateTime();
    
    let productImg = activeProduct.image || activeProduct.url || 'https://placehold.co/200x200';
    const fid = extractGoogleDriveId(productImg);
    if (fid) productImg = `https://lh3.googleusercontent.com/d/${fid}=w200-h200`;
    
    const params = {
        email: CONFIG.ORDER_TO_EMAIL,
        order_id: orderId,
        order_date: orderDate,
        customer_name: `${name} ${surname}`,
        customer_phone: phone,
        customer_address: address,
        customer_postcode: postcode,
        product_name: activeProduct.name || 'Dizayn',
        product_category: activeProduct.category || 'Dizayn',
        product_price: `${unit.toFixed(2)} ₼`,
        product_size: selectedSize,
        product_quantity: currentQuantity,
        total_price: `${total.toFixed(2)} ₼`,
        product_image: productImg,
        design_image: designImage,
        note: `Çap: ${getPrintTypeName()} | Qeyd: ${note}`
    };
    
    const btn = this.querySelector('button[type="submit"]');
    const original = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Göndərilir...';
    btn.disabled = true;
    
    try {
        await emailjs.send(CONFIG.EMAILJS_SERVICE_ID, CONFIG.EMAILJS_TEMPLATE_ID, params);
        showToast('Sifarişiniz göndərildi!', 'success');
        closeOrderFormModal();
        this.reset();
        const qtyInput = document.getElementById('orderQuantity');
        if (qtyInput) qtyInput.value = 1;
        currentQuantity = 1;
    } catch (err) {
        console.error('EmailJS xətası:', err);
        showToast('Xəta: ' + (err?.text || 'Bilinməyən xəta baş verdi'), 'error');
    } finally {
        btn.innerHTML = original;
        btn.disabled = false;
    }
});

// ============================================================
// MODALLAR ÜÇÜN ƏLAVƏ FUNKSİYALAR
// ============================================================
function closeSuccessModal() {
    document.getElementById('successModal').style.display = 'none';
}

// Modal xaricinə kliklə bağlama
window.onclick = function(event) {
    const previewModal = document.getElementById('previewModal');
    const orderFormModal = document.getElementById('orderFormModal');
    const successModal = document.getElementById('successModal');
    
    if (event.target === previewModal) closePreviewModal();
    if (event.target === orderFormModal) closeOrderFormModal();
    if (event.target === successModal) closeSuccessModal();
};

// ============================================================
// ROUTING
// ============================================================
function initRouting() {
    const routes = {
        '/': 'index.html', '/product': 'product.html',
        '/design': 'created.html', '/partnership': 'partnership.html',
        '/designed': 'design.html'
    };
    document.querySelectorAll('[data-link]').forEach(el => {
        el.onclick = (e) => {
            e.preventDefault();
            const path = el.getAttribute('data-link');
            window.location.href = routes[path] || path + '.html';
        };
    });
}

// ============================================================
// PƏNCƏRƏ ÖLÇÜSÜ DƏYİŞDİKDƏ
// ============================================================
function resizeCanvas() {
    const newSize = getResponsiveCanvasSize();
    if (newSize.width === canvas.width && newSize.height === canvas.height) return;
    
    const objects = canvas.getObjects();
    const bgImage = canvas.backgroundImage;
    const scaleX = newSize.width / canvas.width;
    const scaleY = newSize.height / canvas.height;
    
    objects.forEach(obj => {
        obj.set({
            left: obj.left * scaleX,
            top: obj.top * scaleY,
            scaleX: obj.scaleX * scaleX,
            scaleY: obj.scaleY * scaleY
        });
        obj.setCoords();
    });
    
    canvas.setWidth(newSize.width);
    canvas.setHeight(newSize.height);
    
    if (bgImage && bgImage._element) {
        const img = bgImage._element;
        const scale = Math.max(newSize.width / img.width, newSize.height / img.height);
        bgImage.set({
            scaleX: scale, scaleY: scale,
            left: (newSize.width - img.width * scale) / 2,
            top: (newSize.height - img.height * scale) / 2
        });
        canvas.setBackgroundImage(bgImage, () => canvas.renderAll());
    }
    canvas.renderAll();
}

window.addEventListener('resize', () => setTimeout(resizeCanvas, 150));
window.addEventListener('orientationchange', () => setTimeout(resizeCanvas, 200));

// ============================================================
// SƏHİFƏ YÜKLƏNMƏSİ
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Dizayn səhifəsi yüklənir...');
    
    initRouting();
    populateFontSelectors();
    
    await loadSizes();
    await loadProductTemplates();
    await loadStickers();
    
    initEventListeners();
    
    setTimeout(() => resizeCanvas(), 100);
    
    if (window.innerWidth <= 768) {
        setTimeout(() => {
            showToast('📱 İpucu: Alətlər panelinə toxunun', 'info');
        }, 1500);
    }
    
    console.log('Hazırdır!');
});

// Qlobal funksiyalar
window.closePreviewModal = closePreviewModal;
window.openOrderForm = openOrderForm;
window.closeOrderFormModal = closeOrderFormModal;
window.closeMobilePanel = closeMobilePanel;
window.closeSuccessModal = closeSuccessModal;
