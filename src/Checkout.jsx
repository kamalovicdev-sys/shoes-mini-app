import React, { useState, useEffect } from 'react';
import './Checkout.css';

const WebApp = window.Telegram.WebApp;

function Checkout({ cart, total, onBack, onComplete }) {
  // Telegram profildagi ismni avtomatik olib kelishga harakat qilamiz
  const [formData, setFormData] = useState({
    name: WebApp?.initDataUnsafe?.user?.first_name || '',
    phone: '',
    address: '',
    comment: ''
  });

  useEffect(() => {
    // Telegram'ning asosiy tugmasini "Buyurtma berish" ga o'zgartiramiz
    WebApp.MainButton.setText(`BUYURTMANI TASDIQLASH - €${total}`);
    WebApp.MainButton.show();
    WebApp.BackButton.show();

    const handleMainButton = () => {
      // Validatsiya: Majburiy maydonlar to'ldirilganligini tekshirish
      if (!formData.name.trim() || !formData.phone.trim() || !formData.address.trim()) {
         if (WebApp.showAlert) WebApp.showAlert("Iltimos, ism, telefon raqam va manzilni to'liq kiriting!");
         else alert("Iltimos, ism, telefon raqam va manzilni to'liq kiriting!");
         return;
      }

      // Botga jo'natiladigan tayyor obyekt
      const orderData = {
        type: 'checkout_order',
        customer: formData,
        items: cart,
        totalPrice: total
      };

      if (WebApp.initDataUnsafe?.user) {
        // Bu buyruq oynani yopadi va ma'lumotni Telegram Botga matn ko'rinishida jo'natadi
        WebApp.sendData(JSON.stringify(orderData));
      } else {
        // Brauzerda test qilish uchun
        alert("Buyurtma qabul qilindi!\n\n" + JSON.stringify(orderData, null, 2));
        onComplete();
      }
    };

    const handleBackButton = () => {
      onBack(); // Orqaga (Savatga) qaytish
    };

    // Tugmalarga hodisalarni ulash
    WebApp.MainButton.onClick(handleMainButton);
    WebApp.BackButton.onClick(handleBackButton);

    // Komponent yopilganda hodisalarni o'chirish
    return () => {
      WebApp.MainButton.offClick(handleMainButton);
      WebApp.BackButton.offClick(handleBackButton);
    };
  }, [formData, cart, total, onBack, onComplete]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="checkout-page">
      <div className="checkout-header">
        <button className="back-btn-local" onClick={onBack}>← Savat</button>
        <h2>Rasmiylashtirish</h2>
      </div>

      <div className="checkout-form">
        <div className="form-group">
          <label>Ism va Familiya *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Ismingizni kiriting"
          />
        </div>

        <div className="form-group">
          <label>Telefon raqam *</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="+998 90 123 45 67"
          />
        </div>

        <div className="form-group">
          <label>Yetkazib berish manzili *</label>
          <textarea
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Shahar, tuman, ko'cha, uy raqami..."
            rows="3"
          ></textarea>
        </div>

        <div className="form-group">
          <label>Qo'shimcha izoh (ixtiyoriy)</label>
          <textarea
            name="comment"
            value={formData.comment}
            onChange={handleChange}
            placeholder="Mo'ljal, domofon kodi yoki boshqa istaklar"
            rows="2"
          ></textarea>
        </div>
      </div>

      <div className="checkout-summary">
        <h3>Sizning buyurtmangiz</h3>
        <p>Mahsulotlar soni: {cart.length} ta</p>
        {cart.map((item, idx) => (
            <p key={idx} style={{ fontSize: '13px', color: '#6B7280', margin: '4px 0' }}>
               - {item.brand} {item.name} (O'lcham: {item.selectedSize})
            </p>
        ))}
        <p className="total-price">Jami summa: €{total}</p>
      </div>
    </div>
  );
}

export default Checkout;