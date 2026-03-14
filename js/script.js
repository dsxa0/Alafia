let products = [];
let cart = JSON.parse(localStorage.getItem('aafiya_cart')) || [];
let storeSettings = {};
let toastTimeout;

function toggleMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    const overlay = document.getElementById('cart-overlay');
    if (menu.classList.contains('hidden')) {
        menu.classList.remove('hidden'); 
        overlay.classList.remove('hidden'); 
        document.body.style.overflow = 'hidden';
    } else { 
        closeAllOverlays(); 
    }
}

function toggleCart() {
    const sidebar = document.getElementById('cart-sidebar');
    const overlay = document.getElementById('cart-overlay');
    if (sidebar.classList.contains('-translate-x-full')) {
        sidebar.classList.remove('-translate-x-full'); 
        overlay.classList.remove('hidden'); 
        document.body.style.overflow = 'hidden';
    } else { 
        closeAllOverlays(); 
    }
}

function closeAllOverlays() {
    document.getElementById('mobile-menu').classList.add('hidden');
    document.getElementById('cart-sidebar').classList.add('-translate-x-full');
    document.getElementById('cart-overlay').classList.add('hidden');
    document.body.style.overflow = '';
}

async function fetchStoreData() {
    try {
        const response = await fetch('api.php');
        const data = await response.json();
        
        if(data.status === 'success') {
            products = data.data.products.slice(0, 8);
            
            data.data.settings.forEach(s => { storeSettings[s.setting_key] = s.setting_value; });
            
            document.getElementById('phone-text').innerText = storeSettings.phone || 'غير متوفر';
            document.getElementById('email-text').innerText = storeSettings.email || 'غير متوفر';
            document.getElementById('fb-link').href = storeSettings.facebook || '#';
            document.getElementById('tw-link').href = storeSettings.twitter || '#';
            
            if(storeSettings.whatsapp) {
                const waNumber = storeSettings.whatsapp.replace(/[^0-9]/g, '');
                const waUrl = `https://wa.me/${waNumber}`;
                document.getElementById('wa-link').href = waUrl;
                document.getElementById('floating-wa').href = waUrl;
                document.getElementById('floating-wa').classList.remove('hidden');
            }
            
            renderProducts();
            updateCartUI();
            
            if (data.data.promo_banner) {
                document.getElementById('hero-main-img').src = data.data.promo_banner.image_url;
            }
            
            document.getElementById('loading-spinner').classList.add('hidden');
            document.getElementById('product-list').classList.remove('hidden');
            if (data.data.products.length > 0) {
                document.getElementById('view-all-btn').classList.remove('hidden');
            }
        }
    } catch (error) {
        console.error("Fetch error: ", error);
        document.getElementById('loading-spinner').innerHTML = `<div class="text-red-500 font-bold p-6">تعذر الاتصال بقاعدة البيانات.</div>`;
    }
}

function renderProducts() {
    const container = document.getElementById('product-list');
    
    if(products.length === 0) {
        container.innerHTML = `<div class="col-span-full text-center bg-white p-8 md:p-12 rounded-2xl border border-slate-200 mx-4"><i class="fa-solid fa-box-open text-5xl md:text-6xl text-slate-300 mb-4"></i><h3 class="text-lg md:text-xl font-bold text-slate-700">لا توجد منتجات حالياً</h3></div>`;
        return;
    }

    container.innerHTML = products.map((p, index) => `
        <div class="bg-white rounded-xl md:rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 overflow-hidden flex flex-col group relative">
            
            <span class="absolute top-2 right-2 bg-medical text-white text-[9px] md:text-xs font-bold px-1.5 py-0.5 md:px-3 md:py-1 rounded-full z-10 shadow-sm leading-tight max-w-[70%] truncate">${p.category_name || 'قسم عام'}</span>

            <div class="h-32 sm:h-44 md:h-64 overflow-hidden bg-white flex items-center justify-center p-2 md:p-6 relative border-b border-slate-50">
                <img src="${p.image_url}" alt="${p.name}" class="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-500 drop-shadow-sm" onerror="this.src='https://via.placeholder.com/400?text=No+Image'">
            </div>
            
            <div class="p-2.5 md:p-6 flex flex-col flex-grow bg-slate-50/50">
                <h3 class="font-bold text-xs md:text-lg text-slate-800 mb-1 md:mb-2 line-clamp-2 leading-snug" title="${p.name}">${p.name}</h3>
                
                <div class="mt-auto pt-2 md:pt-4 flex flex-col gap-2 md:gap-4">
                    <div class="flex items-end gap-1">
                        <span class="text-medical-dark font-bold text-base md:text-2xl">${parseFloat(p.price).toLocaleString()}</span>
                        <span class="text-[10px] md:text-sm font-bold text-slate-500 mb-0.5">ج.س</span>
                    </div>
                    
                    <button onclick="addToCart(${p.id})" class="w-full bg-medical-50 text-medical hover:bg-medical hover:text-white border border-medical-100 hover:border-medical py-2 md:py-3 rounded-lg md:rounded-xl font-bold text-xs md:text-base transition-all duration-300 flex items-center justify-center gap-1 md:gap-2 group-hover:shadow-md active:scale-95">
                        <i class="fa-solid fa-cart-plus text-xs md:text-base"></i> <span class="hidden sm:inline">أضف للسلة</span><span class="sm:hidden">أضف</span>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) { 
        existingItem.quantity += 1; 
    } else { 
        cart.push({ ...product, quantity: 1 }); 
    }

    saveCart();
    showToast(`تم إضافة "${product.name}" بنجاح`);
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
}

function updateCartQuantity(productId, change) {
    const item = cart.find(i => i.id === productId);
    if(item) {
        item.quantity += change;
        if(item.quantity <= 0) { 
            removeFromCart(productId); 
        } else { 
            saveCart(); 
        }
    }
}

function saveCart() {
    localStorage.setItem('aafiya_cart', JSON.stringify(cart));
    updateCartUI();
}

function updateCartUI() {
    const cartItems = document.getElementById('cart-items');
    const cartCount = document.getElementById('cart-count');
    const cartTotal = document.getElementById('cart-total');
    const emptyMsg = document.getElementById('empty-cart-msg');

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.innerText = totalItems;
    
    cartCount.classList.add('scale-125', 'bg-medical', 'text-white');
    setTimeout(() => cartCount.classList.remove('scale-125', 'bg-medical', 'text-white'), 300);

    if (cart.length === 0) {
        emptyMsg.style.display = 'flex';
        Array.from(cartItems.children).forEach(child => { 
            if(child.id !== 'empty-cart-msg') child.remove(); 
        });
    } else {
        emptyMsg.style.display = 'none';
        const emptyMsgElement = emptyMsg.cloneNode(true);
        
        cartItems.innerHTML = cart.map(item => `
            <div class="bg-white p-2.5 md:p-3 rounded-xl border border-slate-200 shadow-sm flex gap-2 md:gap-3 relative">
                <button onclick="removeFromCart(${item.id})" class="absolute top-1.5 left-1.5 md:top-2 md:left-2 text-slate-300 hover:text-red-500 transition bg-white rounded-full w-5 h-5 md:w-6 md:h-6 flex items-center justify-center border border-slate-100 shadow-sm">
                    <i class="fa-solid fa-times text-[10px] md:text-xs"></i>
                </button>
                
                <div class="w-16 h-16 md:w-20 md:h-20 bg-slate-50 rounded-lg flex-shrink-0 flex items-center justify-center p-1 border border-slate-100">
                    <img src="${item.image_url}" alt="${item.name}" class="max-w-full max-h-full object-contain mix-blend-multiply">
                </div>
                
                <div class="flex-1 flex flex-col justify-between py-1">
                    <h4 class="font-bold text-xs md:text-sm text-slate-700 line-clamp-2 pr-3 leading-tight">${item.name}</h4>
                    
                    <div class="flex items-center justify-between mt-1 md:mt-2">
                        <span class="text-medical-dark font-bold text-xs md:text-sm">${parseFloat(item.price).toLocaleString()} <span class="text-[10px] font-normal">ج.س</span></span>
                        
                        <div class="flex items-center gap-1 md:gap-2 bg-slate-100 rounded-lg p-1 border border-slate-200">
                            <button onclick="updateCartQuantity(${item.id}, -1)" class="w-5 h-5 md:w-6 md:h-6 bg-white rounded flex items-center justify-center text-slate-500 hover:text-medical shadow-sm active:bg-slate-50"><i class="fa-solid fa-minus text-[8px] md:text-[10px]"></i></button>
                            <span class="text-xs font-bold w-3 md:w-4 text-center">${item.quantity}</span>
                            <button onclick="updateCartQuantity(${item.id}, 1)" class="w-5 h-5 md:w-6 md:h-6 bg-white rounded flex items-center justify-center text-slate-500 hover:text-medical shadow-sm active:bg-slate-50"><i class="fa-solid fa-plus text-[8px] md:text-[10px]"></i></button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
        
        cartItems.appendChild(emptyMsgElement);
    }

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotal.innerHTML = `${total.toLocaleString()} <span class="text-xs md:text-sm text-slate-500">ج.س</span>`;
}

function showToast(message) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    
    clearTimeout(toastTimeout);
    toastMessage.innerText = message;
    
    toast.classList.remove('translate-y-24', 'opacity-0');
    
    toastTimeout = setTimeout(() => { 
        toast.classList.add('translate-y-24', 'opacity-0'); 
    }, 3000);
}

function checkout() {
    if(cart.length === 0) { 
        alert("السلة فارغة! الرجاء إضافة منتجات أولاً."); 
        return; 
    }

    let messageText = "مرحباً *متجر العافية*، أود طلب الأجهزة التالية:\n\n";
    let totalPrice = 0;

    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        totalPrice += itemTotal;
        messageText += `*${index + 1}. ${item.name}*\n`;
        messageText += `   الكمية: ${item.quantity} | السعر: ${itemTotal.toLocaleString()} ج.س\n`;
        messageText += `   ---\n`;
    });

    messageText += `\n💰 *الإجمالي الكلي:* ${totalPrice.toLocaleString()} ج.س\n\n`;
    messageText += `الرجاء تأكيد الطلب وإخباري بطرق الدفع المتاحة. شكراً لكم.`;

    let waNumber = storeSettings.whatsapp ? storeSettings.whatsapp.replace(/[^0-9]/g, '') : '';
    if(!waNumber) { 
        alert("عذراً، لم يتم إعداد رقم الواتساب من قبل الإدارة بعد."); 
        return; 
    }

    const encodedText = encodeURIComponent(messageText);
    window.open(`https://wa.me/${waNumber}?text=${encodedText}`, '_blank');
}

window.onload = () => {
    fetchStoreData();
};
