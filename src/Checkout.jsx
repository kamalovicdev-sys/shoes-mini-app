import React, { useState, useEffect } from 'react';
import './Checkout.css';

const WebApp = window.Telegram.WebApp;
// API manzilini o'zingiznikiga almashtiring
const API_URL = "https://competent-mastodon-lfshoes-751b6276.koyeb.app";

function Checkout({ cart, total, onBack, onComplete }) {
  const [formData, setFormData] = useState({
    name: WebApp?.initDataUnsafe?.user?.first_name || '',
    phone: '',
    address: '',
    comment: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    WebApp.MainButton.setText(`BUYURTMANI TASDIQLASH - ${total}`);
    WebApp.MainButton.show();
    WebApp.BackButton.show();

    const handleMainButton = async () => {
      // Validatsiya
      if (!formData.name.trim() || !formData.phone.trim() || !formData.address.trim()) {
         if (WebApp.showAlert) WebApp.showAlert("Iltimos, ism, telefon raqam va manzilni to'liq kiriting!");
         else alert("Iltimos, ism, telefon raqam va manzilni to'liq kiriting!");
         return;
      }

      if (isSubmitting) return;
      setIsSubmitting(true);
      WebApp.MainButton.showProgress(); // Telegram tugmasida aylanuvchi loading chiqadi

      // Ortiqcha rasm va uzun ta'riflarni qirqib tashlaymiz
      const optimizedCart = cart.map(item => ({
        name: item.name,
        brand: item.brand,
        price: item.price,
        selectedSize: item.selectedSize
      }));

      const orderData = {
        customer: formData,
        items: optimizedCart,
        totalPrice: total
      };

      try {
        // TO'G'RIDAN-TO'G'RI SERVERGA YUBORAMIZ (Shunda oyna qotib qolmaydi)
        const response = await fetch(`${API_URL}/api/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData)
        });

        if (response.ok) {
          if (WebApp.showAlert) {
            WebApp.showAlert("✅ Buyurtmangiz muvaffaqiyatli qabul qilindi! Tez orada bog'lanamiz.", () => {
              WebApp.close(); // Xabarni o'qigach dastur yopiladi
            });
          } else {
            alert("✅ Buyurtmangiz qabul qilindi!");
            onComplete();
          }
        } else {
          throw new Error("Server xatosi");
        }
      } catch (error) {
        console.error(error);
        if (WebApp.showAlert) WebApp.showAlert("Xatolik yuz berdi. Iltimos keyinroq urinib ko'ring.");
        else alert("Xatolik yuz berdi.");
      } finally {
        WebApp.MainButton.hideProgress();
        setIsSubmitting(false);
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
  }, [formData, cart, total, onBack, onComplete, isSubmitting]);

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
          <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Ismingizni kiriting" />
        </div>

        <div className="form-group">
          <label>Telefon raqam *</label>
          <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+998 90 123 45 67" />
        </div>

        <div className="form-group">
          <label>Yetkazib berish manzili *</label>
          <textarea name="address" value={formData.address} onChange={handleChange} placeholder="Shahar, tuman, ko'cha, uy raqami..." rows="3"></textarea>
        </div>

        <div className="form-group">
          <label>Qo'shimcha izoh (ixtiyoriy)</label>
          <textarea name="comment" value={formData.comment} onChange={handleChange} placeholder="Mo'ljal, domofon kodi yoki boshqa istaklar" rows="2"></textarea>
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
        <p className="total-price">Jami summa: {total}</p>
      </div>
    </div>
  );
}

export default Checkout;