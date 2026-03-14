import React, { useState, useEffect } from 'react';
import './Admin.css';

// API manzilingiz (Koyeb havolangizni shu yerga yozing)
const API_URL = "https://competent-mastodon-lfshoes-751b6276.koyeb.app";

function Admin() {
  // Tablar: 'add' (Qo'shish), 'list' (Ro'yxat), 'orders' (Buyurtmalar)
  const [activeTab, setActiveTab] = useState('add');

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('adminToken');
  });

  const [loginData, setLoginData] = useState({ username: '', password: '' });

  // Yangi mahsulot qo'shish uchun form
  const [formData, setFormData] = useState({
    brand: '', name: '', price: '', image: null, description: '', sizes: '', isDeal: false, oldPrice: '', discount: ''
  });
  const [imagePreview, setImagePreview] = useState(null);

  // Boshqarish (Ro'yxat) uchun State'lar
  const [products, setProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  // Tahrirlash (Edit) oynasi uchun State
  const [editModal, setEditModal] = useState(null); // null bo'lsa oyna yopiq
  const [editImagePreview, setEditImagePreview] = useState(null);

  // === MAHSULOTLARNI TORTIB KELISH (Faqat "Ro'yxat" tabiga o'tganda) ===
  const fetchProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const res = await fetch(`${API_URL}/api/products`);
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error("Mahsulotlarni olishda xatolik:", error);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && activeTab === 'list') {
      fetchProducts();
    }
  }, [isAuthenticated, activeTab]);

  // === LOGIN VA LOGOUT ===
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    const loginForm = new FormData();
    loginForm.append("username", loginData.username);
    loginForm.append("password", loginData.password);

    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: "POST", body: loginForm,
      });
      const result = await response.json();
      if (result.status === "success") {
        localStorage.setItem('adminToken', result.token);
        setIsAuthenticated(true);
      } else {
        alert(result.message || result.detail || "Xatolik!");
      }
    } catch (error) {
      alert("Server bilan ulanishda xatolik yuz berdi.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setIsAuthenticated(false);
  };

  // === YANGI MAHSULOT QO'SHISH ===
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.image) return alert("Iltimos, mahsulot rasmini yuklang!");

    const submitData = new FormData();
    Object.keys(formData).forEach(key => submitData.append(key, formData[key]));
    const token = localStorage.getItem('adminToken');

    try {
      const response = await fetch(`${API_URL}/api/products`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: submitData,
      });
      if (response.ok) {
        alert("🎉 Mahsulot muvaffaqiyatli qo'shildi!");
        setFormData({ brand: '', name: '', price: '', image: null, description: '', sizes: '', isDeal: false, oldPrice: '', discount: '' });
        setImagePreview(null);
      } else {
        if (response.status === 401) handleLogout();
      }
    } catch (error) {
      alert("Server xatosi.");
    }
  };

  // === MAHSULOTNI O'CHIRISH (DELETE) ===
  const handleDelete = async (id) => {
    if (!window.confirm("Rostdan ham bu mahsulotni o'chirib tashlamoqchimisiz?")) return;

    const token = localStorage.getItem('adminToken');
    try {
      const response = await fetch(`${API_URL}/api/products/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        fetchProducts(); // O'chgach, ro'yxatni yangilaymiz
      } else {
        if (response.status === 401) handleLogout();
      }
    } catch (error) {
      alert("O'chirishda xatolik yuz berdi.");
    }
  };

  // === MAHSULOTNI TAHRIRLASH (EDIT) ===
  const openEditModal = (product) => {
    setEditModal({
      ...product,
      sizes: product.sizes.join(', '), // Ro'yxatni yana yozuvga aylantiramiz
      newImage: null // Yangi rasm tanlansa shu yerda saqlanadi
    });
    setEditImagePreview(product.image); // Eski rasm
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditModal(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleEditImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditModal(prev => ({ ...prev, newImage: file }));
      setEditImagePreview(URL.createObjectURL(file));
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('adminToken');
    const submitData = new FormData();

    // Barcha ma'lumotlarni qo'shamiz
    Object.keys(editModal).forEach(key => {
      if (key !== 'newImage' && key !== 'image' && key !== 'id') {
        submitData.append(key, editModal[key]);
      }
    });

    // Agar yangi rasm yuklangan bo'lsa
    if (editModal.newImage) {
      submitData.append("image", editModal.newImage);
    }

    try {
      const response = await fetch(`${API_URL}/api/products/${editModal.id}`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` },
        body: submitData,
      });

      if (response.ok) {
        alert("✅ Mahsulot yangilandi!");
        setEditModal(null); // Oynani yopamiz
        fetchProducts(); // Ro'yxatni yangilaymiz
      } else {
        if (response.status === 401) handleLogout();
      }
    } catch (error) {
      alert("Yangilashda xatolik yuz berdi.");
    }
  };


  // === LOGIN OYNASI ===
  if (!isAuthenticated) {
    return (
      <div className="admin-container login-container">
        <div className="admin-header"><h2>🔒 Tizimga kirish</h2></div>
        <div className="admin-content">
          <form className="add-product-form" onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <label>Login</label>
              <input type="text" value={loginData.username} onChange={e => setLoginData({...loginData, username: e.target.value})} placeholder="Admin logini" required />
            </div>
            <div className="form-group">
              <label>Parol</label>
              <input type="password" value={loginData.password} onChange={e => setLoginData({...loginData, password: e.target.value})} placeholder="••••••••" required />
            </div>
            <button type="submit" className="submit-btn">Kirish</button>
          </form>
        </div>
      </div>
    );
  }

  // === ASOSIY ADMIN PANEL ===
  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2>Admin Panel</h2>
        <button className="logout-btn" onClick={handleLogout}>Chiqish</button>
      </div>

      <div className="admin-tabs">
        <button className={activeTab === 'add' ? 'active' : ''} onClick={() => setActiveTab('add')}>➕ Qo'shish</button>
        <button className={activeTab === 'list' ? 'active' : ''} onClick={() => setActiveTab('list')}>📋 Ro'yxat</button>
        <button className={activeTab === 'orders' ? 'active' : ''} onClick={() => setActiveTab('orders')}>📥 Buyurtma</button>
      </div>

      <div className="admin-content">

        {/* 1. YANGI MAHSULOT QO'SHISH TABI */}
        {activeTab === 'add' && (
          <div className="admin-section">
            <h3>Yangi mahsulot</h3>
            <form className="add-product-form" onSubmit={handleSubmit}>
              <div className="form-group image-upload-group">
                <input type="file" accept="image/*" onChange={handleImageChange} required={!imagePreview} />
                <label style={{color: '#6B7280', fontSize: '13px'}}>Rasm yuklash uchun ustiga bosing</label>
                {imagePreview && <div className="image-preview-box"><img src={imagePreview} alt="Preview" /></div>}
              </div>
              <div className="form-group"><label>Brend</label><input type="text" name="brand" value={formData.brand} onChange={handleChange} required /></div>
              <div className="form-group"><label>Nomi</label><input type="text" name="name" value={formData.name} onChange={handleChange} required /></div>
              <div className="form-group"><label>Narxi</label><input type="text" name="price" value={formData.price} onChange={handleChange} required /></div>
              <div className="form-group"><label>O'lchamlar</label><input type="text" name="sizes" value={formData.sizes} onChange={handleChange} placeholder="39, 40, 41" required /></div>
              <div className="form-group"><label>Batafsil ma'lumot</label><textarea name="description" value={formData.description} onChange={handleChange} rows="3" required></textarea></div>
              <div className="form-group checkbox-group"><label><input type="checkbox" name="isDeal" checked={formData.isDeal} onChange={handleChange} />Chegirma bormi?</label></div>
              {formData.isDeal && (
                <div className="deal-fields">
                  <div className="form-group"><label>Eski narx</label><input type="text" name="oldPrice" value={formData.oldPrice} onChange={handleChange} /></div>
                  <div className="form-group"><label>Foiz</label><input type="text" name="discount" value={formData.discount} onChange={handleChange} /></div>
                </div>
              )}
              <button type="submit" className="submit-btn">Saqlash</button>
            </form>
          </div>
        )}

        {/* 2. MAHSULOTLAR RO'YXATI TABI */}
        {activeTab === 'list' && (
          <div className="admin-section" style={{ padding: '16px 12px' }}>
            <h3 style={{ marginLeft: '8px' }}>Mavjud Mahsulotlar</h3>
            {isLoadingProducts ? (
              <p style={{ textAlign: 'center', color: '#6B7280' }}>Yuklanmoqda...</p>
            ) : products.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#6B7280' }}>Hozircha mahsulot yo'q.</p>
            ) : (
              <div className="product-list-container">
                {products.map(product => (
                  <div key={product.id} className="admin-product-item">
                    <img src={product.image} alt={product.name} className="admin-product-img" />
                    <div className="admin-product-info">
                      <div className="admin-product-brand">{product.brand}</div>
                      <div className="admin-product-name">{product.name}</div>
                      <div className="admin-product-price">{product.price}</div>
                    </div>
                    <div className="admin-product-actions">
                      <button className="action-btn edit" onClick={() => openEditModal(product)}>✏️</button>
                      <button className="action-btn delete" onClick={() => handleDelete(product.id)}>🗑</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 3. BUYURTMALAR TABI */}
        {activeTab === 'orders' && (<div className="admin-section"><h3>Yangi buyurtmalar</h3><p style={{color: '#6B7280'}}>Hozircha buyurtmalar yo'q.</p></div>)}

      </div>

      {/* === TAHRIRLASH MODALI === */}
      {editModal && (
        <div className="modal-overlay" style={{ zIndex: 100 }} onClick={() => setEditModal(null)}>
          <div className="filter-bottom-sheet" style={{ maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
            <div className="sheet-header">
              <h3>Tahrirlash</h3>
              <button className="sheet-close" onClick={() => setEditModal(null)}>✕</button>
            </div>
            <form className="add-product-form" onSubmit={handleEditSubmit} style={{ paddingBottom: '20px' }}>
              <div className="form-group image-upload-group" style={{ padding: '10px' }}>
                <label style={{color: '#6B7280', fontSize: '13px', marginBottom: '10px'}}>Yangi rasm tanlash (ixtiyoriy)</label>
                <input type="file" accept="image/*" onChange={handleEditImageChange} />
                {editImagePreview && <div className="image-preview-box" style={{ height: '120px' }}><img src={editImagePreview} alt="Preview" style={{ height: '100%' }} /></div>}
              </div>
              <div className="form-group"><label>Brend</label><input type="text" name="brand" value={editModal.brand} onChange={handleEditChange} required /></div>
              <div className="form-group"><label>Nomi</label><input type="text" name="name" value={editModal.name} onChange={handleEditChange} required /></div>
              <div className="form-group"><label>Narxi</label><input type="text" name="price" value={editModal.price} onChange={handleEditChange} required /></div>
              <div className="form-group"><label>O'lchamlar</label><input type="text" name="sizes" value={editModal.sizes} onChange={handleEditChange} required /></div>
              <div className="form-group"><label>Batafsil</label><textarea name="description" value={editModal.description} onChange={handleEditChange} rows="2" required></textarea></div>
              <div className="form-group checkbox-group"><label><input type="checkbox" name="isDeal" checked={editModal.isDeal} onChange={handleEditChange} />Chegirma bormi?</label></div>
              {editModal.isDeal && (
                <div className="deal-fields">
                  <div className="form-group"><label>Eski narx</label><input type="text" name="oldPrice" value={editModal.oldPrice} onChange={handleEditChange} /></div>
                  <div className="form-group"><label>Foiz</label><input type="text" name="discount" value={editModal.discount} onChange={handleEditChange} /></div>
                </div>
              )}
              <button type="submit" className="submit-btn" style={{ background: '#10B981' }}>Yangilash</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Admin;