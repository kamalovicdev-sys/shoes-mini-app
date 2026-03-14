import React, { useState, useEffect } from 'react';
import './Admin.css';

// API manzilingiz (Koyeb havolangizni shu yerga yozing)
const API_URL = "https://competent-mastodon-lfshoes-751b6276.koyeb.app/";

function Admin() {
  const [activeTab, setActiveTab] = useState('products');

  // === AUTHENTICATION STATE ===
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginData, setLoginData] = useState({ username: '', password: '' });

  // Sahifa ochilganda brauzer xotirasida (localStorage) token borligini tekshiramiz
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const [formData, setFormData] = useState({
    brand: '', name: '', price: '', image: null, description: '', sizes: '', isDeal: false, oldPrice: '', discount: ''
  });
  const [imagePreview, setImagePreview] = useState(null);

  // === LOGIN QILISH FUNKSIYASI ===
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    const loginForm = new FormData();
    loginForm.append("username", loginData.username);
    loginForm.append("password", loginData.password);

    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: "POST",
        body: loginForm,
      });
      const result = await response.json();

      if (result.status === "success") {
        // Tokkenni brauzerga saqlab qo'yamiz va tizimga kiritamiz
        localStorage.setItem('adminToken', result.token);
        setIsAuthenticated(true);
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error(error);
      alert("Server bilan ulanishda xatolik yuz berdi.");
    }
  };

  // Tizimdan chiqish (Logout)
  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setIsAuthenticated(false);
  };

  // Formadagi o'zgarishlarni ushlab olish
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

  // Mahsulot saqlash (Endi u tokenni ham yuboradi)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.image) return alert("Iltimos, mahsulot rasmini yuklang!");

    const submitData = new FormData();
    Object.keys(formData).forEach(key => submitData.append(key, formData[key]));

    const token = localStorage.getItem('adminToken'); // Tokkeni xotiradan olamiz

    try {
      const response = await fetch(`${API_URL}/api/products`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}` // Tokenni maxsus himoya qatorida jo'natamiz
        },
        body: submitData,
      });

      if (response.ok) {
        alert("🎉 Mahsulot muvaffaqiyatli qo'shildi!");
        setFormData({ brand: '', name: '', price: '', image: null, description: '', sizes: '', isDeal: false, oldPrice: '', discount: '' });
        setImagePreview(null);
      } else {
        const errorData = await response.json();
        alert("Xatolik: " + (errorData.detail || "Saqlashda muammo bo'ldi"));
        // Agar token eskirgan yoki noto'g'ri bo'lsa tizimdan chiqarib yuboramiz
        if (response.status === 401) handleLogout();
      }
    } catch (error) {
      console.error(error);
      alert("Server xatosi.");
    }
  };

  // === AGAR TIZIMGA KIRMAGAN BO'LSA LOGIN OYNASI CHIQADI ===
  if (!isAuthenticated) {
    return (
      <div className="admin-container login-container">
        <div className="admin-header"><h2>🔒 Admin Panelga Kirish</h2></div>
        <div className="admin-content">
          <form className="add-product-form" onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <label>Login</label>
              <input type="text" value={loginData.username} onChange={e => setLoginData({...loginData, username: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Parol</label>
              <input type="password" value={loginData.password} onChange={e => setLoginData({...loginData, password: e.target.value})} required />
            </div>
            <button type="submit" className="submit-btn">Kirish</button>
          </form>
        </div>
      </div>
    );
  }

  // === ASOSIY ADMIN PANEL (Faqat parolni topganlar uchun) ===
  return (
    <div className="admin-container">
      <div className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>🛠 Admin Panel</h2>
        <button onClick={handleLogout} style={{ background: 'transparent', color: 'white', border: '1px solid white', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' }}>Chiqish</button>
      </div>

      <div className="admin-tabs">
        <button className={activeTab === 'products' ? 'active' : ''} onClick={() => setActiveTab('products')}>📦 Mahsulotlar</button>
        <button className={activeTab === 'orders' ? 'active' : ''} onClick={() => setActiveTab('orders')}>📥 Buyurtmalar</button>
      </div>

      <div className="admin-content">
        {activeTab === 'products' && (
          <div className="admin-section">
            <h3>Yangi mahsulot qo'shish</h3>
            <form className="add-product-form" onSubmit={handleSubmit}>
              {/* === BARCHA INPUTLAR AVVALGIDEK QOLADI === */}
              <div className="form-group image-upload-group">
                <label>Mahsulot rasmi</label>
                <input type="file" accept="image/*" onChange={handleImageChange} required={!imagePreview} />
                {imagePreview && <div className="image-preview-box"><img src={imagePreview} alt="Preview" /></div>}
              </div>
              <div className="form-group">
                <label>Brend</label><input type="text" name="brand" value={formData.brand} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Nomi</label><input type="text" name="name" value={formData.name} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Narxi</label><input type="text" name="price" value={formData.price} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>O'lchamlar</label><input type="text" name="sizes" value={formData.sizes} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Batafsil ma'lumot</label><textarea name="description" value={formData.description} onChange={handleChange} required></textarea>
              </div>
              <div className="form-group checkbox-group">
                <label><input type="checkbox" name="isDeal" checked={formData.isDeal} onChange={handleChange} />Chegirma bormi?</label>
              </div>
              {formData.isDeal && (
                <div className="deal-fields">
                  <div className="form-group"><label>Eski narx</label><input type="text" name="oldPrice" value={formData.oldPrice} onChange={handleChange} /></div>
                  <div className="form-group"><label>Chegirma foizi</label><input type="text" name="discount" value={formData.discount} onChange={handleChange} /></div>
                </div>
              )}
              <button type="submit" className="submit-btn">Mahsulotni Saqlash</button>
            </form>
          </div>
        )}
        {activeTab === 'orders' && (<div className="admin-section"><h3>Yangi buyurtmalar</h3><p>Tez orada...</p></div>)}
      </div>
    </div>
  );
}

export default Admin;