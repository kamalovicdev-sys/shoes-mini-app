import React, { useState, useEffect } from 'react';
import './Checkout.css';

const WebApp = window.Telegram.WebApp;

function Checkout({ cart, total, onBack, onComplete }) {
  const [formData, setFormData] = useState({
    name: WebApp?.initDataUnsafe?.user?.first_name || '',
    phone: '',
    address: '',
    comment: ''
  });

  useEffect(() => {
    WebApp.MainButton.setText(`BUYURTMANI TASDIQLASH - €${total}`);
    WebApp.MainButton.show();
    WebApp.BackButton.show();

    const handleMainButton = () => {
      // 1. Validatsiya: Bo'sh joylarni tekshirish
      if (!formData.name.trim() || !formData.phone.trim() || !formData.address.trim()) {
         if (WebApp.showAlert) WebApp.showAlert("Iltimos, ism, telefon raqam va manzilni to'liq kiriting!");
         else alert("Iltimos, ism, telefon raqam va manzilni to'liq kiriting!");
         return;
      }

      // 2. TUG'IRLANGAN QISM: Telegram limitiga tushmaslik uchun ortiqcha narsalarni (rasm, uzun ta'rif) qirqib tashlaymiz
      const optimizedCart = cart.map(item => ({
        name: item.name,
        brand: item.brand,
        price: item.price,
        selectedSize: item.selectedSize
      }));

      const orderData = {
        type: 'checkout_order',
        customer: formData,
        items: optimizedCart, // Endi faqat qisqa ro'yxat ketadi
        totalPrice: total
      };

      // 3. Botga jo'natish
      if (WebApp.initDataUnsafe?.user) {
        WebApp.sendData(JSON.stringify(orderData));
      } else {
        alert("Buyurtma qabul qilindi!\n\n" + JSON.stringify(orderData, null, 2));
        onComplete();
      }
    };

    const handleBackButton = () => {
      onBack();
    };

    WebApp.MainButton.onClick(handleMainButton);
    WebApp.BackButton.onClick(handleBackButton);

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