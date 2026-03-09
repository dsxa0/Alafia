let allProducts = [];
let categories = [];
let currentCategory = 'all';
let cart = JSON.parse(localStorage.getItem('aafiya_cart')) || [];
let storeWa = '';
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

async function initShop() {
    try {
        const res = await fetch('api.php'); 
        const data = await res.json();
        
        if(data.status === 'success') {
            allProducts = data.data.products;
            categories = data.data.categories;
            
            data.data.settings.forEach(s => { 
                if(s.setting_key === 'whatsapp') {
                    storeWa = s.setting_value.replace(/[^0-9]/g, '');
                    if(storeWa) {
                        const waUrl = `https://wa.me/${storeWa}`;
                        document.getElementById('floating-wa').href = waUrl;
                        document.getElementById('floating-wa').classList.remove('hidden');
                    }
                }
            });
            
            renderCategories();
            filterProducts('all');
            updateCartUI();
            document.getElementById('loading-spinner').classList.add('hidden');
            document.getElementById('product-list').classList.remove('hidden');
        }
    } catch(e) {
        console.error("Error:", e);
        document.getElementById('loading-spinner').innerHTML = `<div class="text-red-500 font-bold p-6">تعذر الاتصال بقاعدة البيانات.</div>`;
    }
}

function renderCategories() {
    const container = document.getElementById('categories-container');
    let html = `<button onclick="filterProducts('all')" id="btn-cat-all" class="cat-btn active border border-slate-300 text-slate-600 bg-white hover:bg-slate-50 font-bold px-5 py-2 rounded-full text-sm md:text-base">الكل</button>`;
    
    categories.forEach(c => {
        html += `<button onclick="filterProducts(${c.id})" id="btn-cat-${c.id}" class="cat-btn border border-slate-300 text-slate-600 bg-white hover:bg-slate-50 font-bold px-5 py-2 rounded-full text-sm md:text-base" dir="ltr">${c.name}</button>`;
    });
    container.innerHTML = html;
}

function filterProducts(catId) {
    currentCategory = catId;
    
    document.querySelectorAll('.cat-btn').forEach(b => {
        b.classList.remove('active', 'bg-medical', 'text-white', 'border-medical', 'shadow-md');
        b.classList.add('bg-white', 'text-slate-600', 'border-slate-300');
    });
    
    const activeBtn = document.getElementById(`btn-cat-${catId}`);
    if(activeBtn) {
        activeBtn.classList.remove('bg-white', 'text-slate-600', 'border-slate-300');
        activeBtn.classList.add('active', 'bg-medical', 'text-white', 'border-medical', 'shadow-md');
    }

    const filtered = catId === 'all' ? allProducts : allProducts.filter(p => p.category_id == catId);
    const container = document.getElementById('product-list');
    
    if(filtered.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center bg-white p-8 md:p-12 rounded-2xl border border-slate-200 mx-4">
                <i class="fa-solid fa-box-open text-5xl md:text-6xl text-slate-300 mb-4"></i>
                <h3 class="text-lg md:text-xl font-bold text-slate-700">لا توجد منتجات</h3>
                <p class="text-sm md:text-base text-slate-500 mt-2">لا توجد منتجات مضافة في هذا القسم حالياً.</p>
            </div>`;
        return;
    }

    container.innerHTML = filtered.map(p => `
        <div class="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 overflow-hidden flex flex-col group relative">
            
            <span class="absolute top-3 right-3 bg-medical text-white text-[10px] md:text-xs font-bold px-2 py-1 md:px-3 md:py-1 rounded-full z-10 shadow-sm">${p.category_name || 'قسم عام'}</span>

            <div class="h-48 sm:h-56 md:h-64 overflow-hidden bg-white flex items-center justify-center p-4 md:p-6 relative border-b border-slate-50">
                <img src="${p.image_url}" alt="${p.name}" class="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-500 drop-shadow-sm" onerror="this.src='https://via.placeholder.com/400?text=No+Image'">
            </div>
            
            <div class="p-4 md:p-6 flex flex-col flex-grow bg-slate-50/50">
                <h3 class="font-bold text-base md:text-lg text-slate-800 mb-2 line-clamp-2 leading-snug" title="${p.name}">${p.name}</h3>
                
                <div class="mt-auto pt-3 md:pt-4 flex flex-col gap-3 md:gap-4">
                    <div class="flex items-end gap-1">
                        <span class="text-medical-dark font-black text-xl md:text-2xl">${parseFloat(p.price).toLocaleString()}</span>
                        <span class="text-xs md:text-sm font-bold text-slate-500 mb-1">ج.س</span>
                    </div>
                    
                    <button onclick="addToCart(${p.id})" class="w-full bg-medical-50 text-medical hover:bg-medical hover:text-white border border-medical-100 hover:border-medical py-2.5 md:py-3 rounded-xl font-bold text-sm md:text-base transition-all duration-300 flex items-center justify-center gap-2 group-hover:shadow-md active:scale-95">
                        <i class="fa-solid fa-cart-plus"></i> أضف للسلة
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function addToCart(productId) {
    const product = allProducts.find(p => p.id === productId);
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
                        <span class="text-medical-dark font-black text-xs md:text-sm">${parseFloat(item.price).toLocaleString()} <span class="text-[10px] font-normal">ج.س</span></span>
                        
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
        messageText += `*${index + 1}. ${item.name}*\n   الكمية: ${item.quantity} | السعر: ${itemTotal.toLocaleString()} ج.س\n   ---\n`;
    });
    
    messageText += `\n💰 *الإجمالي الكلي:* ${totalPrice.toLocaleString()} ج.س\n\nالرجاء تأكيد الطلب وإخباري بطرق الدفع المتاحة.`;
    
    if(!storeWa) { 
        alert("عذراً، لم يتم إعداد رقم الواتساب."); 
        return; 
    }
    
    window.open(`https://wa.me/${storeWa}?text=${encodeURIComponent(messageText)}`, '_blank');
}

window.onload = initShop;
