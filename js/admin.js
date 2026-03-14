let adminProducts = []; 
let adminCategories = []; 

function showAlert(msg) { alert(msg); }

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const isHidden = sidebar.classList.contains('translate-x-full');
    if(isHidden) {
        sidebar.classList.remove('translate-x-full');
        sidebar.classList.add('translate-x-0');
        overlay.classList.remove('hidden');
    } else {
        sidebar.classList.remove('translate-x-0');
        sidebar.classList.add('translate-x-full');
        overlay.classList.add('hidden');
    }
}

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(); 
    fd.append('action', 'login'); 
    fd.append('password', document.getElementById('admin-pass').value);
    
    try {
        const res = await fetch('admin_api.php', { method: 'POST', body: fd });
        const data = await res.json();
        if(data.status === 'success') {
            document.getElementById('login-screen').classList.add('hidden');
            const dashboard = document.getElementById('dashboard');
            dashboard.classList.add('show');
            loadData();
        } else { 
            const err = document.getElementById('login-error');
            err.innerText = data.message;
            err.classList.remove('hidden'); 
        }
    } catch(e) { alert("خطأ في الاتصال بالخادم!"); }
});

async function loadData() {
    try {
        const res = await fetch('api.php'); 
        const data = await res.json();
        if(data.status === 'success') {
            adminProducts = data.data.products;
            adminCategories = data.data.categories;
            
            const catList = document.getElementById('admin-category-list');
            const catSelect = document.getElementById('category-select');
            const editCatSelect = document.getElementById('edit-category-select');
            
            if(adminCategories.length === 0) {
                catList.innerHTML = `<tr><td colspan="3" class="text-center p-6 text-gray-500">لا توجد أقسام.</td></tr>`;
                catSelect.innerHTML = `<option value="">-- أضف قسم أولاً --</option>`;
                editCatSelect.innerHTML = `<option value="">-- أضف قسم أولاً --</option>`;
            } else {
                catList.innerHTML = adminCategories.map(c => `
                    <tr class="border-b hover:bg-gray-50 transition">
                        <td class="p-2 md:p-3 text-gray-500 whitespace-nowrap">#${c.id}</td>
                        <td class="p-2 md:p-3 font-bold whitespace-nowrap" dir="auto">${c.name}</td>
                        <td class="p-2 md:p-3 text-center whitespace-nowrap"><button onclick="delCategory(${c.id})" class="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded transition"><i class="fa-solid fa-trash-can"></i></button></td>
                    </tr>
                `).join('');
                
                const optionsHTML = '<option value="">-- اختر القسم --</option>' + 
                    adminCategories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
                catSelect.innerHTML = optionsHTML;
                editCatSelect.innerHTML = optionsHTML;
            }

            const pList = document.getElementById('admin-product-list');
            if(adminProducts.length === 0) {
                pList.innerHTML = `<tr><td colspan="5" class="text-center p-6 text-gray-500">لا توجد منتجات.</td></tr>`;
            } else {
                pList.innerHTML = adminProducts.map(p => `
                    <tr class="hover:bg-gray-50 border-b transition">
                        <td class="p-2 md:p-3 whitespace-nowrap"><div class="w-10 h-10 md:w-12 md:h-12 bg-white border rounded flex items-center justify-center p-1"><img src="${p.image_url}" class="max-w-full max-h-full object-contain mix-blend-multiply" onerror="this.src='https://via.placeholder.com/150?text=No+Image'"></div></td>
                        <td class="p-2 md:p-3 font-bold text-gray-700 min-w-[120px]">${p.name}</td>
                        <td class="p-2 md:p-3 whitespace-nowrap"><span class="bg-medical-50 border border-medical-100 text-medical-dark text-xs px-2 py-1 rounded-full">${p.category_name || 'بدون قسم'}</span></td>
                        <td class="p-2 md:p-3 text-medical-dark font-bold whitespace-nowrap">${parseFloat(p.price).toLocaleString()} ج.س</td>
                        <td class="p-2 md:p-3 text-center whitespace-nowrap">
                            <div class="flex items-center justify-center gap-1">
                                <button onclick="openEditModal(${p.id})" class="text-blue-500 hover:bg-blue-50 p-2 rounded transition" title="تعديل"><i class="fa-solid fa-pen-to-square"></i></button>
                                <button onclick="delProduct(${p.id})" class="text-red-400 hover:bg-red-50 p-2 rounded transition" title="حذف"><i class="fa-solid fa-trash-can"></i></button>
                            </div>
                        </td>
                    </tr>
                `).join('');
            }
            
            const s = {}; data.data.settings.forEach(x => s[x.setting_key] = x.setting_value);
            document.getElementById('set-phone').value = s.phone || ''; document.getElementById('set-whatsapp').value = s.whatsapp || '';
            document.getElementById('set-email').value = s.email || ''; document.getElementById('set-fb').value = s.facebook || ''; document.getElementById('set-tw').value = s.twitter || '';

            const banner = data.data.promo_banner;
            if (banner) {
                document.getElementById('current-banner-preview').src = banner.image_url;
                document.getElementById('current-banner-wrap').classList.remove('hidden');
                document.getElementById('no-banner-msg').classList.add('hidden');
            } else {
                document.getElementById('current-banner-wrap').classList.add('hidden');
                document.getElementById('no-banner-msg').classList.remove('hidden');
            }
        }
    } catch(e) { console.error(e); }
}

document.getElementById('add-product-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('add-prod-btn');
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري الرفع...'; btn.disabled = true;
    const fd = new FormData(e.target); fd.append('action', 'add_product');
    try {
        const res = await fetch('admin_api.php', { method: 'POST', body: fd });
        const result = await res.json();
        if (result.status === 'success') { document.getElementById('modal-product').classList.add('hidden'); e.target.reset(); loadData(); showAlert('تمت الإضافة بنجاح!'); } else { showAlert(result.message); }
    } catch(err) { showAlert('خطأ في الاتصال'); } finally { btn.innerHTML = 'إضافة المنتج الآن'; btn.disabled = false; }
});

function openEditModal(id) {
    const product = adminProducts.find(p => p.id == id);
    if(!product) return;
    
    document.getElementById('edit-product-form').reset(); 
    document.getElementById('edit-id').value = product.id;
    document.getElementById('edit-name').value = product.name;
    document.getElementById('edit-price').value = product.price;
    document.getElementById('edit-category-select').value = product.category_id || '';

    document.getElementById('modal-edit-product').classList.remove('hidden');
}

document.getElementById('edit-product-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('edit-prod-btn');
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري الحفظ...'; btn.disabled = true;
    const fd = new FormData(e.target); fd.append('action', 'edit_product');
    try {
        const res = await fetch('admin_api.php', { method: 'POST', body: fd });
        const result = await res.json();
        if (result.status === 'success') { document.getElementById('modal-edit-product').classList.add('hidden'); loadData(); showAlert('تم تعديل المنتج بنجاح!'); } else { showAlert(result.message); }
    } catch(err) { showAlert('خطأ في الاتصال'); } finally { btn.innerHTML = 'حفظ التعديلات'; btn.disabled = false; }
});

document.getElementById('add-category-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target); fd.append('action', 'add_category');
    try {
        await fetch('admin_api.php', { method: 'POST', body: fd });
        document.getElementById('modal-category').classList.add('hidden'); e.target.reset(); loadData(); showAlert('تمت الإضافة');
    } catch(err) { showAlert('خطأ في الاتصال'); }
});

async function delProduct(id) {
    if(!confirm('حذف هذا المنتج؟')) return;
    const fd = new FormData(); fd.append('action', 'delete_product'); fd.append('id', id); await fetch('admin_api.php', { method: 'POST', body: fd }); loadData();
}

async function delCategory(id) {
    if(!confirm('حذف القسم؟ (لن تحذف منتجاته)')) return;
    const fd = new FormData(); fd.append('action', 'delete_category'); fd.append('id', id); await fetch('admin_api.php', { method: 'POST', body: fd }); loadData();
}

document.getElementById('settings-form').addEventListener('submit', async (e) => {
    e.preventDefault(); const fd = new FormData(e.target); fd.append('action', 'update_settings'); await fetch('admin_api.php', { method: 'POST', body: fd }); showAlert('تم الحفظ');
});

document.getElementById('password-form').addEventListener('submit', async (e) => {
    e.preventDefault(); const fd = new FormData(e.target); fd.append('action', 'change_password');
    try { const res = await fetch('admin_api.php', { method: 'POST', body: fd }); const data = await res.json(); showAlert(data.message); if(data.status === 'success') e.target.reset(); } catch(err) {}
});

function switchTab(t) {
    ['products', 'categories', 'promo', 'settings'].forEach(id => { document.getElementById('tab-' + id).classList.add('hidden'); document.getElementById('nav-' + id).classList.remove('active-nav'); });
    document.getElementById('tab-' + t).classList.remove('hidden'); document.getElementById('nav-' + t).classList.add('active-nav');
    const titles = { 'products': 'إدارة المنتجات', 'categories': 'إدارة الأقسام', 'promo': 'إدارة العروض', 'settings': 'إعدادات المتجر' }; document.getElementById('page-title').innerText = titles[t];
    
    if (t === 'promo') loadPromoBanner();
    if(window.innerWidth < 768) toggleSidebar();
}

async function loadPromoBanner() {
    try {
        const res = await fetch('api.php');
        const data = await res.json();
        const banner = data.data.promo_banner;
        if (banner) {
            document.getElementById('current-banner-preview').src = banner.image_url;
            document.getElementById('current-banner-wrap').classList.remove('hidden');
            document.getElementById('no-banner-msg').classList.add('hidden');
        } else {
            document.getElementById('current-banner-wrap').classList.add('hidden');
            document.getElementById('no-banner-msg').classList.remove('hidden');
        }
    } catch(e) { console.error(e); }
}

document.getElementById('promo-upload-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('upload-banner-btn');
    const fileInput = document.getElementById('banner-file-input');
    if (!fileInput.files.length) { showAlert('الرجاء اختيار صورة أولاً'); return; }
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin ml-1"></i> جاري الرفع...'; btn.disabled = true;
    const fd = new FormData(e.target); fd.append('action', 'upload_promo_banner');
    try {
        const res = await fetch('admin_api.php', { method: 'POST', body: fd });
        const result = await res.json();
        if (result.status === 'success') { e.target.reset(); loadPromoBanner(); showAlert('تم رفع صورة العرض بنجاح!'); }
        else { showAlert(result.message || 'حدث خطأ'); }
    } catch(err) { showAlert('خطأ في الاتصال'); }
    finally { btn.innerHTML = '<i class="fa-solid fa-upload ml-1"></i> رفع الصورة'; btn.disabled = false; }
});

async function deletePromoBanner() {
    if (!confirm('حذف صورة العرض؟')) return;
    const fd = new FormData(); fd.append('action', 'delete_promo_banner');
    await fetch('admin_api.php', { method: 'POST', body: fd });
    loadPromoBanner();
    showAlert('تم حذف صورة العرض');
}
