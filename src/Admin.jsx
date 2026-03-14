import React, { useState, useEffect } from 'react';
import './Admin.css';

// API manzilingiz (Koyeb havolangizni shu yerga yozing)
const API_URL = "https://competent-mastodon-lfshoes-751b6276.koyeb.app";

function Admin() {
  const [activeTab, setActiveTab] = useState('products');

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('adminToken');
  });

  const [loginData, setLoginData] = useState({ username: '', password: '' });

  // === MAHSULOT QO'SHISH STATE ===
  const [formData, setFormData] = useState({
    brand: '', name: '', price: '', images: [], description: '', sizes: '', isDeal: false, oldPrice: '', discount: ''
  });
  const [imagePreviews, setImagePreviews] = useState([]);

  // === RO'YXAT VA TAHRIRLASH STATE ===
  const [products, setProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  const [editModal, setEditModal] = useState(null);
  const [editImagePreviews, setEditImagePreviews] = useState([]);

  // === MAHSULOTLARNI BAZADAN OLISH ===
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

  // === YANGI MAHSULOT QO'SHISH FUNKSIYALARI ===
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setFormData(prev => ({ ...prev, images: files }));
      const previews = files.map(file => URL.createObjectURL(file));
      setImagePreviews(previews);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.images.length === 0) return alert("Iltimos, kamida bitta mahsulot rasmini yuklang!");

    const submitData = new FormData();

    Object.keys(formData).forEach(key => {
      if (key !== 'images') {
        submitData.append(key, formData[key]);
      }
    });

    formData.images.forEach(image => {
      submitData.append("images", image);
    });

    const token = localStorage.getItem('adminToken');
    try {
      const response = await fetch(`${API_URL}/api/products`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: submitData
      });
      if (response.ok) {
        alert("🎉 Mahsulot muvaffaqiyatli qo'shildi!");
        setFormData({ brand: '', name: '', price: '', images: [], description: '', sizes: '', isDeal: false, oldPrice: '', discount: '' });
        setImagePreviews([]);
      } else {
        if (response.status === 401) handleLogout();
        else alert("Saqlashda muammo yuz berdi");
      }
    } catch (error) {
      console.error(error);
      alert("Server xatosi.");
    }
  };

  // === O'CHIRISH VA TAHRIRLASH FUNKSIYALARI ===
  const handleDelete = async (id) => {
    if (!window.confirm("Rostdan ham bu mahsulotni o'chirmoqchimisiz?")) return;
    const token = localStorage.getItem('adminToken');
    try {
      const response = await fetch(`${API_URL}/api/products/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        fetchProducts();
      } else {
        if (response.status === 401) handleLogout();
      }
    } catch (error) {
      alert("O'chirishda xatolik yuz berdi.");
    }
  };

  const openEditModal = (product) => {
    setEditModal({
      ...product,
      sizes: product.sizes.join(', '),
      newImages: []
    });
    setEditImagePreviews(product.images || []);
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditModal(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleEditImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setEditModal(prev => ({ ...prev, newImages: files }));
      const previews = files.map(file => URL.createObjectURL(file));
      setEditImagePreviews(previews);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('adminToken');
    const submitData = new FormData();

    Object.keys(editModal).forEach(key => {
      if (key !== 'newImages' && key !== 'images' && key !== 'id') {
        submitData.append(key, editModal[key]);
      }
    });

    if (editModal.newImages && editModal.newImages.length > 0) {
      editModal.newImages.forEach(image => submitData.append("images", image));
    }

    try {
      const response = await fetch(`${API_URL}/api/products/${editModal.id}`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` },
        body: submitData
      });

      if (response.ok) {
        alert("✅ Mahsulot yangilandi!");
        setEditModal(null);
        fetchProducts();
      } else {
        if (response.status === 401) handleLogout();
      }
    } catch (error) {
      console.error(error);
      alert("Yangilashda xato yuz berdi.");
    }
  };

  // === LOGIN EKRANI ===
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
      </div>

      <div className="admin-content">

        {/* === 1. YANGI MAHSULOT QO'SHISH TABI === */}
        {activeTab === 'add' && (
          <div className="admin-section">
            <h3>Yangi mahsulot</h3>
            <form className="add-product-form" onSubmit={handleSubmit}>

              <div className="form-group image-upload-group">
                <input type="file" accept="image/*" onChange={handleImageChange} required={imagePreviews.length === 0} multiple />
                <label style={{color: '#6B7280', fontSize: '13px'}}>Bir nechta rasm yuklash mumkin (ustiga bosing)</label>

                {imagePreviews.length > 0 && (
                  <div className="image-prewiev-list" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '16px' }}>
                    {imagePreviews.map((url, index) => (
                      <div key={index} className="image-preview-box" style={{ width: '80px', height: '80px', margin: 0 }}>
                        <img src={url} alt={`Preview ${index + 1}`} style={{ height: '100%', objectFit: 'cover' }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group"><label>Brend</label><input type="text" name="brand" value={formData.brand} onChange={handleChange} placeholder="Nike" required /></div>
              <div className="form-group"><label>Nomi</label><input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Air Force 1" required /></div>
              <div className="form-group"><label>Narxi</label><input type="text" name="price" value={formData.price} onChange={handleChange} placeholder="€89.95" required /></div>
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

        {/* === 2. MAHSULOTLAR RO'YXATI TABI === */}
        {activeTab === 'list' && (
          <div className="admin-section" style={{ padding: '16px 12px' }}>
            <h3 style={{ marginLeft: '8px' }}>Mahsulotlar</h3>
            {isLoadingProducts ? (
              <p style={{ textAlign: 'center', color: '#6B7280' }}>Yuklanmoqda...</p>
            ) : products.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#6B7280' }}>Mahsulot yo'q.</p>
            ) : (
              <div className="product-list-container">
                {products.map(p => (
                  <div key={p.id} className="admin-product-item">
                    <img src={p.images && p.images.length > 0 ? p.images[0] : ''} alt={p.name} className="admin-product-img" />
                    <div className="admin-product-info">
                      <div className="admin-product-brand">{p.brand}</div>
                      <div className="admin-product-name">{p.name}</div>
                      <div className="admin-product-price">{p.price}</div>
                    </div>
                    <div className="admin-product-actions">
                      <button className="action-btn edit" onClick={() => openEditModal(p)}>✏️</button>
                      <button className="action-btn delete" onClick={() => handleDelete(p.id)}>🗑</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

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
                <label style={{color: '#6B7280', fontSize: '13px', marginBottom: '10px'}}>Yangilash (ixtiyoriy, bir nechta rasm)</label>
                <input type="file" accept="image/*" onChange={handleEditImageChange} multiple />

                {editImagePreviews.length > 0 && (
                  <div className="image-prewiev-list" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '16px' }}>
                    {editImagePreviews.map((url, index) => (
                      <div key={index} className="image-preview-box" style={{ width: '60px', height: '60px', margin: 0 }}>
                        <img src={url} alt={`Prewiev ${index}`} style={{ height: '100%', objectFit: 'cover' }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group"><label>Brend</label><input type="text" name="brand" value={editModal.brand} onChange={handleEditChange} required /></div>
              <div className="form-group"><label>Nomi</label><input type="text" name="name" value={editModal.name} onChange={handleEditChange} required /></div>
              <div className="form-group"><label>Narxi</label><input type="text" name="price" value={editModal.price} onChange={handleEditChange} required /></div>
              <div className="form-group"><label>O'lchamlar</label><input type="text" name="sizes" value={editModal.sizes} onChange={handleEditChange} required /></div>
              <div className="form-group"><label>Batafsil</label><textarea name="description" value={editModal.description} onChange={handleEditChange} rows="3" required></textarea></div>
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