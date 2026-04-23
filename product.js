// product.js - Chaply Məhsullar (EmailJS Tam Dəstəkli)

// ============================================================
// KONFİQURASİYA
// ============================================================
const CONFIG = {
    SHEET_ID: '1md0gSVfSMdHskEL57HaNteots5hqN_taxMDnQCyVFfc',
    PRODUCTS_SHEET: 'products',
    IMAGE_PROXY_URL: 'https://script.google.com/macros/s/AKfycbxVBpMw6VfLFSVVM9N1Mbfj7VZsORvisnFqgiZpPpdpJQWwGi2eO6wLY4CJD_zx59qm/exec',
    EMAILJS_PUBLIC_KEY: 'nkZ98Ga10XtaLm5By',
    EMAILJS_SERVICE_ID: 'service_7cd7g3b',
    EMAILJS_TEMPLATE_ID: 'template_4kwa9rq',
    ORDER_TO_EMAIL: 'eli120124@gmail.com'
};

// BÜTÜN MÜMKÜN ÖLÇÜLƏR
const ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

// EmailJS başlat
if (window.emailjs) {
    emailjs.init(CONFIG.EMAILJS_PUBLIC_KEY);
}

let ALL_PRODUCTS = [];
let currentProduct = null;
let selectedSize = '';
let currentQuantity = 1;

const imageCache = new Map();

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
// SİFARİŞ NÖMRƏSİ VƏ TARİX
// ============================================================
function generateOrderId() {
    return 'CH-' + Date.now().toString().slice(-8) + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
}

function getCurrentDateTime() {
    const now = new Date();
    return now.toLocaleString('az-AZ', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// ============================================================
// GOOGLE DRIVE ŞƏKİL YÜKLƏMƏ
// ============================================================
function extractGoogleDriveId(url) {
    if (!url) return null;
    if (url.match(/^[a-zA-Z0-9_-]{25,}$/)) return url;
    const match1 = url.match(/\/d\/([^\/]+)/);
    if (match1) return match1[1];
    const match2 = url.match(/[?&]id=([^&]+)/);
    if (match2) return match2[1];
    const match3 = url.match(/file\/d\/([^\/]+)/);
    if (match3) return match3[1];
    return null;
}

async function loadImageViaProxy(fileId) {
    if (imageCache.has(fileId)) return imageCache.get(fileId);

    if (!CONFIG.IMAGE_PROXY_URL || CONFIG.IMAGE_PROXY_URL.includes('YOUR_SCRIPT_ID')) {
        console.warn('⚠️ Proksi URL təyin edilməyib!');
        return null;
    }

    try {
        const proxyUrl = `${CONFIG.IMAGE_PROXY_URL}?id=${fileId}`;
        const response = await fetch(proxyUrl);
        const data = await response.json();

        if (data.success && data.dataUrl) {
            imageCache.set(fileId, data.dataUrl);
            return data.dataUrl;
        }
        return null;
    } catch (error) {
        console.error('❌ Proksi xətası:', error);
        return null;
    }
}

async function getImageUrl(originalUrl) {
    if (!originalUrl) return 'https://placehold.co/400x400/f0f7f4/1a5c3e?text=Chaply';
    if (originalUrl.startsWith('data:') || originalUrl.includes('placehold.co')) return originalUrl;

    const fileId = extractGoogleDriveId(originalUrl);
    if (fileId) {
        const dataUrl = await loadImageViaProxy(fileId);
        if (dataUrl) return dataUrl;
        return 'https://placehold.co/400x400/f0f7f4/1a5c3e?text=Yüklənmədi';
    }
    return originalUrl;
}

// ============================================================
// ÖLÇÜLƏRİ PARSE ET
// ============================================================
function parseSizesFromRow(row) {
    const availableSizes = [];

    for (const size of ALL_SIZES) {
        const columnName = `size_${size}`;
        const value = row[columnName];

        if (value === true || value === 'TRUE' || value === 'true' || value === 1 || value === '1') {
            availableSizes.push(size);
        }
    }

    if (availableSizes.length === 0 && row.sizes) {
        const oldSizes = String(row.sizes).split(',').map(s => s.trim()).filter(Boolean);
        return oldSizes.length > 0 ? oldSizes : ['M'];
    }

    if (availableSizes.length === 0) {
        return ['M'];
    }

    return availableSizes;
}

// ============================================================
// SƏBƏT
// ============================================================
const CART_KEY = 'chaply_cart';

function getCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); }
    catch { return []; }
}

function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartBadge();
}

function addToCart(product, size, quantity) {
    const cart = getCart();
    cart.push({ product, size, quantity, addedAt: Date.now() });
    saveCart(cart);
    showToast(`"${product.name}" səbətə əlavə edildi!`, 'success');
}

function updateCartBadge() {
    const el = document.getElementById('cartCount');
    if (el) el.textContent = getCart().length;
}

// ============================================================
// SƏBƏT POPUP
// ============================================================
async function showCart() {
    const cart = getCart();
    if (!cart.length) {
        showToast('🛒 Səbətiniz boşdur', 'info');
        return;
    }

    const existingPopup = document.getElementById('cartPopupModal');
    if (existingPopup) existingPopup.remove();

    let cartItemsHtml = '';
    let totalPrice = 0;

    for (let i = 0; i < cart.length; i++) {
        const item = cart[i];
        const itemTotal = item.product.price * item.quantity;
        totalPrice += itemTotal;

        const imgUrl = await getImageUrl(item.product.image);

        cartItemsHtml += `
            <div style="display: flex; align-items: center; gap: 15px; padding: 15px 0; border-bottom: 1px solid #e0eae6;">
                <div style="width: 65px; height: 65px; background: #f0f3f1; border-radius: 14px; overflow: hidden; flex-shrink: 0;">
                    <img src="${imgUrl}" style="width: 100%; height: 100%; object-fit: cover;">
                </div>
                <div style="flex: 1;">
                    <h4 style="margin: 0 0 5px; font-size: 15px; font-weight: 700; color: #1e2a23;">${escapeHtml(item.product.name)}</h4>
                    <div style="font-size: 13px; color: #5a6e62;">Ölçü: ${item.size} | Say: ${item.quantity}</div>
                </div>
                <div style="font-weight: 800; color: var(--primary); font-size: 16px;">${itemTotal.toFixed(2)} ₼</div>
                <button class="remove-cart-item" data-index="${i}" style="background: none; border: none; font-size: 20px; cursor: pointer; color: #ff6b35; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `;
    }

    const popup = document.createElement('div');
    popup.id = 'cartPopupModal';
    popup.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(10px);
        z-index: 10005; display: flex; align-items: center; justify-content: center;
        font-family: "Inter", sans-serif; animation: fadeIn 0.25s ease;
    `;

    popup.innerHTML = `
        <div style="background: white; width: 90%; max-width: 520px; border-radius: 36px; overflow: hidden; box-shadow: 0 30px 60px rgba(0,0,0,0.3);">
            <div style="background: linear-gradient(135deg, rgb(20, 78, 46) 0%, rgb(15, 60, 35) 100%); padding: 22px 24px; color: white; display: flex; justify-content: space-between; align-items: center;">
                <h2 style="margin: 0; font-size: 22px; display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-shopping-bag"></i> Səbətiniz (${cart.length})
                </h2>
                <span id="closeCartPopup" style="font-size: 32px; cursor: pointer;">&times;</span>
            </div>
            <div style="padding: 20px 24px; max-height: 420px; overflow-y: auto;">
                ${cartItemsHtml}
            </div>
            <div style="padding: 20px 24px; border-top: 1px solid #e0eae6; background: #f9fbfa;">
                <div style="display: flex; justify-content: space-between; font-weight: 800; font-size: 20px; margin-bottom: 20px;">
                    <span>Ümumi məbləğ:</span>
                    <span style="color: var(--primary);">${totalPrice.toFixed(2)} ₼</span>
                </div>
                <div style="display: flex; gap: 12px;">
                    <button id="clearCartBtn" style="flex: 1; padding: 14px; border-radius: 50px; border: 2px solid #ddd; background: white; cursor: pointer; font-weight: 600;">
                        <i class="fas fa-trash-alt"></i> Təmizlə
                    </button>
                    <button id="checkoutFromCartBtn" style="flex: 2; padding: 14px; border-radius: 50px; border: none; background: var(--primary); color: white; font-weight: 700; cursor: pointer;">
                        <i class="fas fa-check-circle"></i> Sifarişi tamamla
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(popup);

    document.getElementById('closeCartPopup').onclick = () => popup.remove();
    popup.onclick = (e) => { if (e.target === popup) popup.remove(); };

    document.getElementById('clearCartBtn').onclick = () => {
        if (confirm('Səbəti tamamilə təmizləmək istədiyinizə əminsiniz?')) {
            localStorage.removeItem(CART_KEY);
            updateCartBadge();
            popup.remove();
            showToast('🗑️ Səbət tamamilə təmizləndi', 'warning');
        }
    };

    document.getElementById('checkoutFromCartBtn').onclick = () => {
        if (cart.length > 0) {
            const firstItem = cart[0];
            currentProduct = firstItem.product;
            selectedSize = firstItem.size;
            currentQuantity = firstItem.quantity;
            popup.remove();
            openOrderModal(firstItem.product, firstItem.size, firstItem.quantity);
        }
    };

    document.querySelectorAll('.remove-cart-item').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            const index = parseInt(btn.dataset.index);
            const currentCart = getCart();
            const removedProduct = currentCart[index].product.name;
            currentCart.splice(index, 1);
            saveCart(currentCart);
            showToast(`"${removedProduct}" səbətdən silindi`, 'info');

            if (currentCart.length === 0) {
                popup.remove();
            } else {
                showCart();
            }
        };
    });
}

// ============================================================
// SƏHİFƏ YÜKLƏNMƏSİ
// ============================================================
document.addEventListener('DOMContentLoaded', function () {
    updateCartBadge();
    loadProductsFromSheets();
    initOrderForm();
    initModalClose();
    initSearch();
    initRouting();
    initDetailModal();

    document.getElementById('cartBadge')?.addEventListener('click', showCart);
});

// ============================================================
// GOOGLE SHEETS-DƏN MƏHSULLAR
// ============================================================
async function loadProductsFromSheets() {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    grid.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i><span>Məhsullar yüklənir...</span></div>';

    try {
        const url = `https://opensheet.elk.sh/${CONFIG.SHEET_ID}/${CONFIG.PRODUCTS_SHEET}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Sheet xətası');
        const data = await res.json();

        ALL_PRODUCTS = data.map(p => ({
            ...p,
            sizes: parseSizesFromRow(p),
            price: parseFloat(p.price) || 0,
            oldPrice: p.oldPrice ? parseFloat(p.oldPrice) : null
        }));

        if (!ALL_PRODUCTS.length) {
            grid.innerHTML = '<div class="no-products"><i class="fas fa-box-open"></i><span>Heç bir məhsul yoxdur</span></div>';
            return;
        }

        await renderProducts(ALL_PRODUCTS);
        loadCategories();
    } catch (err) {
        console.error(err);
        grid.innerHTML = '<div class="no-products"><i class="fas fa-exclamation-triangle"></i><span>Məhsullar yüklənmədi</span></div>';
        showToast('Məhsullar yüklənərkən xəta baş verdi', 'error');
    }
}

async function renderProducts(products) {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    if (!products.length) {
        grid.innerHTML = '<div class="no-products"><i class="fas fa-search"></i><span>Nəticə tapılmadı</span></div>';
        return;
    }

    grid.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i><span>Şəkillər yüklənir...</span></div>';

    let html = '';
    for (let p of products) {
        const category = p.category || 'Məhsul';
        const imageUrl = await getImageUrl(p.image);

        html += `
            <div class="product-card" data-product='${JSON.stringify(p).replace(/'/g, "&apos;")}'>
                <div class="product-img-wrapper">
                    <img class="product-img" src="${imageUrl}" alt="${escapeHtml(p.name)}" loading="lazy">
                    ${p.oldPrice ? '<span class="product-badge">ENDİRİM</span>' : ''}
                    <div class="product-actions">
                        <button class="product-action-btn quick-add" title="Sürətli əlavə et">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                </div>
                <div class="product-info">
                    <span class="product-category">${escapeHtml(category)}</span>
                    <h3 class="product-title">${escapeHtml(p.name)}</h3>
                    <div class="product-price">
                        ${p.price.toFixed(2)} ₼
                        ${p.oldPrice ? `<small>${p.oldPrice.toFixed(2)} ₼</small>` : ''}
                    </div>
                    <button class="quick-view">
                        <i class="fas fa-eye"></i> Sifariş et
                    </button>
                </div>
            </div>
        `;
    }

    grid.innerHTML = html;
    attachProductEvents();
}

function attachProductEvents() {
    document.querySelectorAll('.product-card').forEach(card => {
        const productData = card.getAttribute('data-product');
        if (!productData) return;

        const product = JSON.parse(productData);

        card.addEventListener('click', (e) => {
            if (!e.target.closest('.quick-add') && !e.target.closest('.quick-view')) {
                openProductDetail(product);
            }
        });

        card.querySelector('.quick-view')?.addEventListener('click', (e) => {
            e.stopPropagation();
            openProductDetail(product);
        });

        card.querySelector('.quick-add')?.addEventListener('click', (e) => {
            e.stopPropagation();
            const defaultSize = product.sizes?.[0] || 'M';
            addToCart(product, defaultSize, 1);
        });
    });
}

// ============================================================
// MƏHSUL DETAL MODAL
// ============================================================
function initDetailModal() {
    const modal = document.getElementById('productDetailModal');
    const closeBtn = modal?.querySelector('.detail-close');

    if (closeBtn) closeBtn.addEventListener('click', () => modal.style.display = 'none');
    window.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });

    document.getElementById('increaseQty')?.addEventListener('click', () => {
        const input = document.getElementById('detailQuantity');
        if (input.value < 99) input.value = parseInt(input.value) + 1;
        currentQuantity = parseInt(input.value);
    });

    document.getElementById('decreaseQty')?.addEventListener('click', () => {
        const input = document.getElementById('detailQuantity');
        if (input.value > 1) input.value = parseInt(input.value) - 1;
        currentQuantity = parseInt(input.value);
    });

    document.getElementById('addToCartFromDetail')?.addEventListener('click', () => {
        if (!selectedSize) {
            showToast('Zəhmət olmasa ölçü seçin!', 'warning');
            return;
        }
        addToCart(currentProduct, selectedSize, currentQuantity);
        document.getElementById('productDetailModal').style.display = 'none';
    });

    document.getElementById('buyNowFromDetail')?.addEventListener('click', () => {
        if (!selectedSize) {
            showToast('Zəhmət olmasa ölçü seçin!', 'warning');
            return;
        }
        document.getElementById('productDetailModal').style.display = 'none';
        openOrderModal(currentProduct, selectedSize, currentQuantity);
    });
}

async function openProductDetail(product) {
    currentProduct = product;

    const availableSizes = [];

    ALL_SIZES.forEach(size => {
        const columnName = `size_${size}`;
        const value = product[columnName];

        if (value === true || value === 'TRUE' || value === 'true' || value === 1 || value === '1') {
            availableSizes.push(size);
        }
    });

    if (availableSizes.length === 0 && product.sizes) {
        const oldSizes = String(product.sizes).split(',').map(s => s.trim()).filter(Boolean);
        availableSizes.push(...oldSizes);
    }

    if (availableSizes.length === 0) {
        availableSizes.push('M');
    }

    selectedSize = availableSizes[0];
    currentQuantity = 1;

    const modal = document.getElementById('productDetailModal');
    document.getElementById('detailImage').src = 'https://placehold.co/600x600/f0f7f4/1a5c3e?text=Yüklənir...';

    const imageUrl = await getImageUrl(product.image);
    document.getElementById('detailImage').src = imageUrl;
    document.getElementById('detailName').textContent = product.name;

    const priceHtml = `${product.price.toFixed(2)} ₼ ${product.oldPrice ? `<small style="text-decoration: line-through; color: #999; font-size: 1.2rem;">${product.oldPrice.toFixed(2)} ₼</small>` : ''}`;
    document.getElementById('detailPrice').innerHTML = priceHtml;
    document.getElementById('detailDescription').textContent = product.description || 'Yüksək keyfiyyətli məhsul, rahat və dəbli dizayn.';
    document.getElementById('detailQuantity').value = 1;

    const sizeContainer = document.getElementById('sizeOptions');

    sizeContainer.innerHTML = availableSizes.map(size => {
        const isActive = (size === selectedSize);
        return `<span class="size-option ${isActive ? 'active' : ''}" data-size="${size}">${size}</span>`;
    }).join('');

    sizeContainer.querySelectorAll('.size-option').forEach(el => {
        el.addEventListener('click', () => {
            sizeContainer.querySelectorAll('.size-option').forEach(s => s.classList.remove('active'));
            el.classList.add('active');
            selectedSize = el.dataset.size;
        });
    });

    modal.style.display = 'flex';
}

// ============================================================
// SİFARİŞ MODAL
// ============================================================
async function openOrderModal(product, size, quantity) {
    currentProduct = product;
    selectedSize = size;
    currentQuantity = quantity;

    const modal = document.getElementById('orderModal');
    const summary = document.getElementById('orderSummary');

    const imageUrl = await getImageUrl(product.image);
    const totalPrice = (product.price * quantity).toFixed(2);

    summary.innerHTML = `
        <img src="${imageUrl}" alt="${escapeHtml(product.name)}">
        <div>
            <h4>${escapeHtml(product.name)}</h4>
            <p>Ölçü: ${size} | Say: ${quantity}</p>
            <p style="font-weight: 700; color: var(--primary); margin-top: 6px;">Cəmi: ${totalPrice} ₼</p>
        </div>
    `;

    modal.style.display = 'flex';
}

function initOrderForm() {
    const form = document.getElementById('orderForm');
    if (!form) return;

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const name = document.getElementById('customerName')?.value.trim();
        const surname = document.getElementById('customerSurname')?.value.trim();
        const phone = document.getElementById('customerPhone')?.value.trim();
        const address = document.getElementById('customerAddress')?.value.trim();
        const note = document.getElementById('orderNote')?.value.trim();
        const postcode = document.getElementById('customerPostcode')?.value.trim() || '-';

        if (!name || !surname || !phone || !address) {
            showToast('Zəhmət olmasa bütün vacib sahələri doldurun!', 'warning');
            return;
        }

        if (!currentProduct) {
            showToast('Məhsul məlumatı tapılmadı!', 'error');
            return;
        }

        const totalPrice = (currentProduct.price * currentQuantity).toFixed(2);
        const orderId = generateOrderId();
        const orderDate = getCurrentDateTime();

        // Şəkil URL-ini hazırla
        const productImageUrl = await getImageUrl(currentProduct.image);

        // EmailJS-ə göndəriləcək parametrlər (TEMPLATE İLƏ UYĞUN)
        const templateParams = {
            email: CONFIG.ORDER_TO_EMAIL,           // Template-də {{email}} var
            order_id: orderId,
            order_date: orderDate,
            customer_name: `${name} ${surname}`,
            customer_phone: phone,
            customer_address: address,
            customer_postcode: postcode,
            product_name: currentProduct.name,
            product_category: currentProduct.category || 'Məhsul',
            product_price: currentProduct.price.toFixed(2) + ' ₼',
            product_size: selectedSize,
            product_quantity: currentQuantity,
            total_price: totalPrice + ' ₼',
            product_image: productImageUrl,
            note: note || 'Yoxdur'
        };

        console.log('📧 EmailJS-ə göndərilir:', templateParams);

        // Loading göstər
        const submitBtn = form.querySelector('.submit-order-btn');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Göndərilir...';
        submitBtn.disabled = true;

        try {
            const response = await emailjs.send(
                CONFIG.EMAILJS_SERVICE_ID,
                CONFIG.EMAILJS_TEMPLATE_ID,
                templateParams
            );

            console.log('✅ EmailJS uğurlu:', response);
            showToast('✅ Sifarişiniz göndərildi! Tezliklə əlaqə saxlanılacaq.', 'success');

            document.getElementById('orderModal').style.display = 'none';
            form.reset();
        } catch (err) {
            console.error('❌ EmailJS xətası:', err);
            showToast('❌ Sifariş göndərilərkən xəta baş verdi!', 'error');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}

function initModalClose() {
    const modal = document.getElementById('orderModal');
    const closeBtn = document.getElementById('closeOrderModal');

    if (closeBtn) closeBtn.addEventListener('click', () => modal.style.display = 'none');
    window.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });
}

// ============================================================
// KATEQORİYA & AXTARIŞ
// ============================================================
function loadCategories() {
    const categories = ['Hamısı', ...new Set(ALL_PRODUCTS.map(p => p.category).filter(Boolean))];
    const list = document.getElementById('categoryList');
    if (!list) return;

    list.innerHTML = categories.map(cat => `<li class="category-item ${cat === 'Hamısı' ? 'active' : ''}" data-category="${escapeHtml(cat)}">${escapeHtml(cat)}</li>`).join('');

    document.querySelectorAll('.category-item').forEach(el => {
        el.addEventListener('click', async function () {
            document.querySelectorAll('.category-item').forEach(c => c.classList.remove('active'));
            this.classList.add('active');

            const cat = this.getAttribute('data-category');
            const filtered = cat === 'Hamısı' ? ALL_PRODUCTS : ALL_PRODUCTS.filter(p => p.category === cat);
            await renderProducts(filtered);
            document.getElementById('searchInput').value = '';
        });
    });
}

function initSearch() {
    const input = document.getElementById('searchInput');
    if (!input) return;

    let timeout;
    input.addEventListener('input', function (e) {
        clearTimeout(timeout);
        timeout = setTimeout(async () => {
            const term = e.target.value.toLowerCase();
            const filtered = ALL_PRODUCTS.filter(p =>
                (p.name || '').toLowerCase().includes(term) ||
                (p.description || '').toLowerCase().includes(term) ||
                (p.category || '').toLowerCase().includes(term)
            );
            await renderProducts(filtered);
            document.querySelectorAll('.category-item').forEach(c => c.classList.remove('active'));
            document.querySelector('.category-item[data-category="Hamısı"]')?.classList.add('active');
        }, 300);
    });
}

// ============================================================
// ROUTING
// ============================================================
function initRouting() {
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
}

function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/[&<>"']/g, m => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[m]));
}

// CSS animasiyaları
const styleSheet = document.createElement("style");
styleSheet.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    @keyframes slideUp {
        from { opacity: 0; transform: translateY(30px); }
        to { opacity: 1; transform: translateY(0); }
    }
`;
document.head.appendChild(styleSheet);