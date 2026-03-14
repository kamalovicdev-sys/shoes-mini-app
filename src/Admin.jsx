import React, { useState } from 'react';
import './Admin.css';

function Admin() {
  const [activeTab, setActiveTab] = useState('products');

  // Formaga kiritiladigan ma'lumotlar uchun State
  const [formData, setFormData] = useState({
    brand: '',
    name: '',
    price: '',
    image: null, // Rasm fayli shu yerda saqlanadi
    description: '',
    sizes: '',
    isDeal: false,
    oldPrice: '',
    discount: ''
  });

  // Yuklangan rasmni ekranda ko'rsatish uchun vaqtinchalik havola
  const [imagePreview, setImagePreview] = useState(null);

  // Oddiy matn va belgilash (checkbox) qatorlari o'zgarganda ishlaydi
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Rasm tanlanganda ishlaydigan alohida funksiya
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
      setImagePreview(URL.createObjectURL(file)); // Rasmni ekranga chiqarish uchun
    }
  };

  // "Mahsulotni Saqlash" bosilganda ishlaydi
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.image) {
      alert("Iltimos, mahsulot rasmini yuklang!");
      return;
    }

    // Backendga rasm (fayl) jo'natish uchun albatta FormData kerak
    const submitData = new FormData();
    submitData.append("brand", formData.brand);
    submitData.append("name", formData.name);
    submitData.append("price", formData.price);
    submitData.append("description", formData.description);
    submitData.append("sizes", formData.sizes);
    submitData.append("isDeal", formData.isDeal);
    submitData.append("oldPrice", formData.oldPrice);
    submitData.append("discount", formData.discount);
    submitData.append("image", formData.image); // Rasm faylini qo'shamiz

    try {
      // Python API'ga so'rov yuborish (portingiz 8000 bo'lishi kerak, agar 8001 bo'lsa shuni o'zgartiring)
      const response = await fetch("http://localhost:8000/api/products", {
        method: "POST",
        body: submitData,
      });

      const result = await response.json();

      if (result.status === "success") {
        alert("🎉 " + result.message);

        // Muvaffaqiyatli saqlangach, keyingi mahsulot uchun formani tozalaymiz
        setFormData({
          brand: '', name: '', price: '', image: null, description: '', sizes: '', isDeal: false, oldPrice: '', discount: ''
        });
        setImagePreview(null);
      } else {
         alert("Xatolik yuz berdi: " + result.message);
      }
    } catch (error) {
      console.error("Xatolik:", error);
      alert("Server bilan ulanishda xatolik yuz berdi. Python server ishlab turganiga ishonch hosil qiling!");
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2>🛠 Admin Panel</h2>
      </div>

      <div className="admin-tabs">
        <button
          className={activeTab === 'products' ? 'active' : ''}
          onClick={() => setActiveTab('products')}
        >
          📦 Mahsulotlar
        </button>
        <button
          className={activeTab === 'orders' ? 'active' : ''}
          onClick={() => setActiveTab('orders')}
        >
          📥 Buyurtmalar
        </button>
      </div>

      <div className="admin-content">
        {/* MAHSULOT QO'SHISH OYNASI */}
        {activeTab === 'products' && (
          <div className="admin-section">
            <h3>Yangi mahsulot qo'shish</h3>

            <form className="add-product-form" onSubmit={handleSubmit}>

              <div className="form-group image-upload-group">
                <label>Mahsulot rasmi (Qurilmadan tanlang)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  required={!imagePreview} // Rasm yo'q bo'lsa majburiy
                />

                {imagePreview && (
                  <div className="image-preview-box">
                    <img src={imagePreview} alt="Preview" />
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Brend (Brand)</label>
                <input type="text" name="brand" value={formData.brand} onChange={handleChange} placeholder="Masalan: Nike" required />
              </div>

              <div className="form-group">
                <label>Nomi (Modeli)</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Masalan: Air Force 1" required />
              </div>

              <div className="form-group">
                <label>Narxi</label>
                <input type="text" name="price" value={formData.price} onChange={handleChange} placeholder="Masalan: €89.95" required />
              </div>

              <div className="form-group">
                <label>O'lchamlar (Razmerlar vergul bilan ajratilsin)</label>
                <input type="text" name="sizes" value={formData.sizes} onChange={handleChange} placeholder="Masalan: 39, 40, 41, 42" required />
              </div>

              <div className="form-group">
                <label>Batafsil ma'lumot (Description)</label>
                <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Mahsulot haqida..." rows="3" required></textarea>
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input type="checkbox" name="isDeal" checked={formData.isDeal} onChange={handleChange} />
                  Chegirma (Deal) bormi?
                </label>
              </div>

              {formData.isDeal && (
                <div className="deal-fields">
                  <div className="form-group">
                    <label>Eski narx</label>
                    <input type="text" name="oldPrice" value={formData.oldPrice} onChange={handleChange} placeholder="Masalan: €99.95" />
                  </div>
                  <div className="form-group">
                    <label>Chegirma foizi</label>
                    <input type="text" name="discount" value={formData.discount} onChange={handleChange} placeholder="Masalan: -10%" />
                  </div>
                </div>
              )}

              <button type="submit" className="submit-btn">Mahsulotni Saqlash</button>
            </form>
          </div>
        )}

        {/* BUYURTMALAR OYNASI */}
        {activeTab === 'orders' && (
          <div className="admin-section">
            <h3>Yangi buyurtmalar</h3>
            <p>Bu yerda mijozlar yuborgan buyurtmalar ro'yxati chiqadi... (Tez orada buni ham bazaga ulaymiz)</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Admin;