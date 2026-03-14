import { useState, useEffect } from 'react'
import './App.css'

const WebApp = window.Telegram.WebApp;

const SHOES = [
  { id: 1, brand: "New Balance", name: "MR530 UNISEX - Trainers - sea salt", price: "€129.95", isSponsored: true, image: "https://images.unsplash.com/photo-1539185441755-769473a23570?w=500&q=80", description: "Kundalik kiyish uchun juda qulay va zamonaviy uslubdagi krossovka." },
  { id: 2, brand: "Nike Sportswear", name: "AIR FORCE 1 - Trainers - white", price: "€89.95", oldPrice: "€99.95", discount: "-10%", isDeal: true, image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80", description: "Klassik oq rangdagi afsonaviy Air Force 1. Har qanday kiyim bilan ajoyib mos tushadi." },
  { id: 3, brand: "Nike Sportswear", name: "AIR FORCE 1 '07 - Trainers - white", price: "€95.95", oldPrice: "€119.95", discount: "-20%", isDeal: true, image: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=500&q=80", description: "Premium charm va havo yostig'iga ega original Air Force 1 '07 modeli." },
  { id: 4, brand: "Puma", name: "RS-X - Trainers - dark blue", price: "€75.00", image: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=500&q=80", description: "Sport va faol hayot tarzi uchun mo'ljallangan yengil va mustahkam Puma krossovkasi." }
];

const FILTERS = ["Sort by", "Brand", "Size", "Colour", "Qualities", "Price"];

function App() {
  const [cart, setCart] = useState([]);
  const [detailsModal, setDetailsModal] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false); // Savat oynasini ochish/yopish uchun

  // Telegram sozlamalari
  useEffect(() => {
    if (WebApp) {
      WebApp.ready();
      WebApp.expand();
      WebApp.setHeaderColor('bg_color'); // Yuqori qism rangini moslashtirish
    }
  }, []);

  // Jami narxni hisoblash funksiyasi (faqat raqamlarni ajratib olib qo'shadi)
  const calculateTotal = () => {
    const total = cart.reduce((sum, item) => {
      const numericPrice = parseFloat(item.price.replace(/[^\d.]/g, ''));
      return sum + numericPrice;
    }, 0);
    return total.toFixed(2);
  };

  // Asosiy tugma (Main Button) va Orqaga (Back Button) mantig'i
  useEffect(() => {
    if (isCartOpen) {
      // Savat ochiq bo'lsa, xaridni tasdiqlash tugmasi chiqadi
      WebApp.MainButton.setText(`CONFIRM ORDER - €${calculateTotal()}`);
      WebApp.MainButton.show();
      WebApp.BackButton.show(); // Orqaga tugmasini yoqish
    } else if (cart.length > 0) {
      // Savatda narsa bor, lekin yopiq bo'lsa
      WebApp.MainButton.setText(`VIEW CART (${cart.length})`);
      WebApp.MainButton.show();
      WebApp.BackButton.hide();
    } else {
      // Savat bo'sh bo'lsa
      WebApp.MainButton.hide();
      WebApp.BackButton.hide();
    }
  }, [cart, isCartOpen]);

  // Tugmalar bosilganda nima bo'lishi
  useEffect(() => {
    const handleMainButtonClick = () => {
      if (isCartOpen) {
        // Xaridni tasdiqlash: botga barcha ma'lumotlarni jo'natamiz
        WebApp.sendData(JSON.stringify({ type: 'order', items: cart, total: calculateTotal() }));
      } else if (cart.length > 0) {
        // Savatni ochish
        setIsCartOpen(true);
      }
    };

    const handleBackButtonClick = () => {
      // Orqaga qaytish
      setIsCartOpen(false);
    };

    WebApp.MainButton.onClick(handleMainButtonClick);
    WebApp.BackButton.onClick(handleBackButtonClick);

    return () => {
      WebApp.MainButton.offClick(handleMainButtonClick);
      WebApp.BackButton.offClick(handleBackButtonClick);
    };
  }, [isCartOpen, cart]);

  const addToCart = (shoe, event) => {
    if (event) event.stopPropagation();
    setCart([...cart, shoe]);
    WebApp.HapticFeedback.impactOccurred('light');
  };

  // Savatdan bitta mahsulotni o'chirish
  const removeFromCart = (indexToRemove) => {
    setCart(cart.filter((_, index) => index !== indexToRemove));
    WebApp.HapticFeedback.impactOccurred('medium');
    // Agar savat bo'shab qolsa, avtomatik yopish
    if (cart.length === 1) {
      setIsCartOpen(false);
    }
  };

  return (
    <div className="app-container">
      {/* --- ASOSIY SAHIFA (Savat yopiq bo'lsa ko'rinadi) --- */}
      {!isCartOpen && (
        <>
          <div className="filters-scroll">
            <div className="filters-container">
              {FILTERS.map((filter, index) => (
                <button key={index} className="filter-btn">
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="shoes-grid">
            {SHOES.map((shoe) => (
              <div key={shoe.id} className="shoe-card">
                <div className="image-container" onClick={() => setDetailsModal(shoe)}>
                  <img src={shoe.image} alt={shoe.name} />
                  {shoe.isDeal && <div className="deal-badge">Deal</div>}
                </div>

                <div className="card-info" onClick={() => setDetailsModal(shoe)}>
                  <div className="brand">{shoe.brand}</div>
                  <div className="name">{shoe.name}</div>
                  <div className="price-section">
                    <span className={`price ${shoe.isDeal ? 'deal-price' : ''}`}>{shoe.price}</span>
                  </div>
                </div>

                <div className="card-actions">
                  <button className="add-to-cart-btn" onClick={(e) => addToCart(shoe, e)}>
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* --- SAVAT SAHIFASI --- */}
      {isCartOpen && (
        <div className="cart-page">
          <h2 className="cart-title">Your Cart</h2>
          <div className="cart-list">
            {cart.map((item, index) => (
              <div key={index} className="cart-item">
                <img src={item.image} alt={item.name} className="cart-item-img" />
                <div className="cart-item-info">
                  <p className="cart-item-brand">{item.brand}</p>
                  <p className="cart-item-name">{item.name}</p>
                  <p className="cart-item-price">{item.price}</p>
                </div>
                <button className="remove-btn" onClick={() => removeFromCart(index)}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              </div>
            ))}
          </div>
          <div className="cart-total-box">
            <span>Total:</span>
            <span>€{calculateTotal()}</span>
          </div>
        </div>
      )}

      {/* --- MODAL OYNA (Details) --- */}
      {detailsModal && (
        <div className="modal-overlay" onClick={() => setDetailsModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setDetailsModal(null)}>✕</button>
            <img src={detailsModal.image} alt={detailsModal.name} className="modal-img" />
            <div className="modal-body">
              <h2 className="modal-brand">{detailsModal.brand}</h2>
              <p className="modal-name">{detailsModal.name}</p>
              <span className="modal-price">{detailsModal.price}</span>
              <div className="modal-divider"></div>
              <p className="modal-description">{detailsModal.description}</p>
              <button className="add-to-cart-btn large" onClick={() => { addToCart(detailsModal, null); setDetailsModal(null); }}>
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App