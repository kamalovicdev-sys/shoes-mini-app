import React, { useState } from 'react';
import './Admin.css';

// API manzilingiz (Koyeb havolangizni yozing)
const API_URL = "https://competent-mastodon-lfshoes-751b6276.koyeb.app";

function Admin() {
  const [activeTab, setActiveTab] = useState('products');

  // 1. Shu yerni to'g'irladik: faqat bitta marta e'lon qilinadi
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('adminToken');
  });

  const [loginData, setLoginData] = useState({ username: '', password: '' });

  const [formData, setFormData] = useState({
    brand: '', name: '', price: '', image: null, description: '', sizes: '', isDeal: false, oldPrice: '', discount: ''
  });

  const [imagePreview, setImagePreview] = useState(null);

  // ... (buyog'iga handleLoginSubmit va boshqa funksiyalar davom etib ketaveradi)

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
        localStorage.setItem('adminToken', result.token);
        setIsAuthenticated(true);
      } else {
        // Agar serverdan "message" kelmasa, FastAPI'ning "detail" xatosini chiqaradi
        alert(result.message || result.detail || "Server topilmadi, havolani tekshiring!");
      }
    } catch (error) {
      console.error(error);
      alert("Server bilan ulanishda xatolik yuz berdi.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setIsAuthenticated(false);
  };

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
        headers: {
          "Authorization": `Bearer ${token}`
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
        if (response.status === 401) handleLogout();
      }
    } catch (error) {
      console.error(error);
      alert("Server xatosi.");
    }
  };

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

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2>Admin Panel</h2>
        {/* Chiqish tugmasi endi toza klass orqali ishlaydi */}
        <button className="logout-btn" onClick={handleLogout}>Chiqish</button>
      </div>

      <div className="admin-tabs">
        <button className={activeTab === 'products' ? 'active' : ''} onClick={() => setActiveTab('products')}>📦 Mahsulotlar</button>
        <button className={activeTab === 'orders' ? 'active' : ''} onClick={() => setActiveTab('orders')}>📥 Buyurtmalar</button>
      </div>

      <div className="admin-content">
        {activeTab === 'products' && (
          <div className="admin-section">
            <h3>Yangi mahsulot</h3>
            <form className="add-product-form" onSubmit={handleSubmit}>

              <div className="form-group image-upload-group">
                <input type="file" accept="image/*" onChange={handleImageChange} required={!imagePreview} />
                <label style={{color: '#6B7280', fontSize: '13px'}}>Rasm yuklash uchun ustiga bosing</label>
                {imagePreview && <div className="image-preview-box"><img src={imagePreview} alt="Preview" /></div>}
              </div>

              <div className="form-group">
                <label>Brend</label><input type="text" name="brand" value={formData.brand} onChange={handleChange} placeholder="Masalan: Nike" required />
              </div>
              <div className="form-group">
                <label>Nomi</label><input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Air Force 1" required />
              </div>
              <div className="form-group">
                <label>Narxi</label><input type="text" name="price" value={formData.price} onChange={handleChange} placeholder="€89.95" required />
              </div>
              <div className="form-group">
                <label>O'lchamlar</label><input type="text" name="sizes" value={formData.sizes} onChange={handleChange} placeholder="39, 40, 41" required />
              </div>
              <div className="form-group">
                <label>Batafsil ma'lumot</label><textarea name="description" value={formData.description} onChange={handleChange} placeholder="Mahsulot haqida ma'lumot..." rows="3" required></textarea>
              </div>

              <div className="form-group checkbox-group">
                <label><input type="checkbox" name="isDeal" checked={formData.isDeal} onChange={handleChange} />Chegirma bormi?</label>
              </div>

              {formData.isDeal && (
                <div className="deal-fields">
                  <div className="form-group"><label>Eski narx</label><input type="text" name="oldPrice" value={formData.oldPrice} onChange={handleChange} placeholder="€99.95"/></div>
                  <div className="form-group"><label>Foiz</label><input type="text" name="discount" value={formData.discount} onChange={handleChange} placeholder="-10%"/></div>
                </div>
              )}

              <button type="submit" className="submit-btn">Saqlash</button>
            </form>
          </div>
        )}
        {activeTab === 'orders' && (<div className="admin-section"><h3>Yangi buyurtmalar</h3><p style={{color: '#6B7280'}}>Hozircha buyurtmalar yo'q.</p></div>)}
      </div>
    </div>
  );
}

export default Admin;