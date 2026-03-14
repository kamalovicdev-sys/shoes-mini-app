import { useState, useEffect, useMemo } from 'react'
import './App.css'

const WebApp = window.Telegram.WebApp;

// 1. Bazaga "sizes" (razmerlar) qo'shildi
const SHOES = [
  { id: 1, brand: "New Balance", name: "MR530 UNISEX - Trainers - sea salt", price: "€129.95", isSponsored: true, image: "https://images.unsplash.com/photo-1539185441755-769473a23570?w=500&q=80", description: "Kundalik kiyish uchun juda qulay va zamonaviy uslubdagi krossovka.", sizes: [39, 40, 41, 42, 43] },
  { id: 2, brand: "Nike Sportswear", name: "AIR FORCE 1 - Trainers - white", price: "€89.95", oldPrice: "€99.95", discount: "-10%", isDeal: true, image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80", description: "Klassik oq rangdagi afsonaviy Air Force 1. Har qanday kiyim bilan ajoyib mos tushadi.", sizes: [40, 41, 42, 44] },
  { id: 3, brand: "Nike Sportswear", name: "AIR FORCE 1 '07 - Trainers - white", price: "€95.95", oldPrice: "€119.95", discount: "-20%", isDeal: true, image: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=500&q=80", description: "Premium charm va havo yostig'iga ega original Air Force 1 '07 modeli.", sizes: [39, 41, 42] },
  { id: 4, brand: "Puma", name: "RS-X - Trainers - dark blue", price: "€75.00", image: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=500&q=80", description: "Sport va faol hayot tarzi uchun mo'ljallangan yengil va mustahkam Puma krossovkasi.", sizes: [40, 42, 43] },
  { id: 5, brand: "Puma", name: "Suede Classic - Trainers - black", price: "€65.00", image: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=500&q=80", description: "Klassik Puma Suede.", sizes: [38, 39, 40, 41] }
];

const FILTERS = ["Sort by", "Brand", "Size", "Colour"];
const BRANDS = ["All", ...new Set(SHOES.map(shoe => shoe.brand))];
const SORT_OPTIONS = ["Default", "Price: Low to High", "Price: High to Low"];

function App() {
  const [cart, setCart] = useState([]);
  const [detailsModal, setDetailsModal] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Yangi qo'shilgan State: Tanlangan razmerni saqlash
  const [selectedSize, setSelectedSize] = useState(null);

  const [activeFilter, setActiveFilter] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState("All");
  const [sortOrder, setSortOrder] = useState("Default");

  useEffect(() => {
    if (WebApp) {
      WebApp.ready();
      WebApp.expand();
      WebApp.setHeaderColor('bg_color');
    }
  }, []);

  // Modal oyna ochilganda avvalgi tanlangan razmerni tozalash
  useEffect(() => {
    if (detailsModal) {
      setSelectedSize(null);
    }
  }, [detailsModal]);

  const calculateTotal = () => {
    const total = cart.reduce((sum, item) => {
      const numericPrice = parseFloat(item.price.replace(/[^\d.]/g, ''));
      return sum + numericPrice;
    }, 0);
    return total.toFixed(2);
  };

  useEffect(() => {
    if (isCartOpen) {
      WebApp.MainButton.setText(`CONFIRM ORDER - €${calculateTotal()}`);
      WebApp.MainButton.show();
      WebApp.BackButton.show();
    } else if (cart.length > 0) {
      WebApp.MainButton.setText(`VIEW CART (${cart.length})`);
      WebApp.MainButton.show();
      WebApp.BackButton.hide();
    } else {
      WebApp.MainButton.hide();
      WebApp.BackButton.hide();
    }
  }, [cart, isCartOpen]);

  useEffect(() => {
    const handleMainButtonClick = () => {
      if (isCartOpen) {
        if (WebApp.initDataUnsafe?.user) {
          WebApp.sendData(JSON.stringify({ type: 'order', items: cart, total: calculateTotal() }));
        } else {
          alert(`Buyurtma qabul qilindi!\nJami: €${calculateTotal()}`);
        }
      } else if (cart.length > 0) {
        setIsCartOpen(true);
      }
    };
    const handleBackButtonClick = () => setIsCartOpen(false);

    WebApp.MainButton.onClick(handleMainButtonClick);
    WebApp.BackButton.onClick(handleBackButtonClick);

    return () => {
      WebApp.MainButton.offClick(handleMainButtonClick);
      WebApp.BackButton.offClick(handleBackButtonClick);
    };
  }, [isCartOpen, cart]);

  // Savatga qo'shish funksiyasi endi razmerni ham qabul qiladi
  const addToCart = (shoe, size, event) => {
    if (event) event.stopPropagation();

    // Agar Grid'dan to'g'ridan-to'g'ri qo'shilsa (size=null), birinchi razmerni oladi
    const sizeToAdd = size || shoe.sizes[0];

    // Aynan shu poyabzalning shu razmeri savatda borligini tekshiramiz
    if (!cart.some(item => item.id === shoe.id && item.selectedSize === sizeToAdd)) {
      // Yangi id beramiz (o'chirishda muammo bo'lmasligi uchun) va razmerni qo'shamiz
      setCart([...cart, { ...shoe, selectedSize: sizeToAdd, cartItemId: Date.now() }]);
      if (WebApp.HapticFeedback) WebApp.HapticFeedback.impactOccurred('light');
    }
  };

  const removeFromCart = (indexToRemove) => {
    setCart(cart.filter((_, index) => index !== indexToRemove));
    if (WebApp.HapticFeedback) WebApp.HapticFeedback.impactOccurred('medium');
    if (cart.length === 1) setIsCartOpen(false);
  };

  const displayedShoes = useMemo(() => {
    let result = [...SHOES];
    if (selectedBrand !== "All") {
      result = result.filter(shoe => shoe.brand === selectedBrand);
    }
    if (sortOrder === "Price: Low to High") {
      result.sort((a, b) => parseFloat(a.price.replace(/[^\d.]/g, '')) - parseFloat(b.price.replace(/[^\d.]/g, '')));
    } else if (sortOrder === "Price: High to Low") {
      result.sort((a, b) => parseFloat(b.price.replace(/[^\d.]/g, '')) - parseFloat(a.price.replace(/[^\d.]/g, '')));
    }
    return result;
  }, [selectedBrand, sortOrder]);

  const handleFilterClick = (filterName) => {
    if (filterName === "Brand" || filterName === "Sort by") {
      setActiveFilter(filterName);
    } else {
      if(WebApp.showAlert) WebApp.showAlert("Bu filtr tez orada qo'shiladi!");
      else alert("Bu filtr tez orada qo'shiladi!");
    }
  };

  return (
    <div className="app-container">
      {/* 1. ASOSIY SAHIFA */}
      {!isCartOpen && (
        <>
          <div className="filters-scroll">
            <div className="filters-container">
              {FILTERS.map((filter, index) => {
                const isActive = (filter === "Brand" && selectedBrand !== "All") ||
                                 (filter === "Sort by" && sortOrder !== "Default");
                return (
                  <button
                    key={index}
                    className={`filter-btn ${isActive ? 'active-filter' : ''}`}
                    onClick={() => handleFilterClick(filter)}
                  >
                    {filter === "Brand" && selectedBrand !== "All" ? selectedBrand : filter}
                    <svg className="chevron-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="shoes-grid">
            {displayedShoes.length > 0 ? (
              displayedShoes.map((shoe) => {
                const isInCart = cart.some(item => item.id === shoe.id);
                return (
                  <div key={shoe.id} className={`shoe-card ${isInCart ? 'in-cart' : ''}`}>
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
                      <button
                        className="add-to-cart-btn"
                        onClick={(e) => addToCart(shoe, null, e)}
                        disabled={isInCart}
                      >
                        {isInCart ? '✓ Added' : 'Add to Cart'}
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="empty-state">Bu brendda hozircha mahsulot yo'q</div>
            )}
          </div>

          {cart.length > 0 && (
            <button className="floating-cart-btn" onClick={() => setIsCartOpen(true)}>
              🛒 View Cart ({cart.length})
            </button>
          )}
        </>
      )}

      {/* 2. SAVAT SAHIFASI */}
      {isCartOpen && (
        <div className="cart-page">
          <div className="cart-header-row">
             <button className="back-btn-local" onClick={() => setIsCartOpen(false)}>← Orqaga</button>
             <h2 className="cart-title">Your Cart</h2>
          </div>

          <div className="cart-list">
            {cart.map((item, index) => (
              <div key={item.cartItemId || index} className="cart-item">
                <img src={item.image} alt={item.name} className="cart-item-img" />
                <div className="cart-item-info">
                  <p className="cart-item-brand">{item.brand}</p>
                  <p className="cart-item-name">{item.name}</p>
                  <p className="cart-item-size">Size: {item.selectedSize}</p>
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

          <button className="floating-cart-btn confirm-btn" onClick={() => {
            alert(`Buyurtma qabul qilindi!\nJami: €${calculateTotal()}`);
            setCart([]);
            setIsCartOpen(false);
          }}>
            CONFIRM ORDER - €{calculateTotal()}
          </button>
        </div>
      )}

      {/* 3. MODAL OYNA (Details va Razmerlar) */}
      {detailsModal && (
        <div className="modal-overlay" onClick={() => setDetailsModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setDetailsModal(null)}>✕</button>
            <img src={detailsModal.image} alt={detailsModal.name} className="modal-img" />
            <div className="modal-body">
              <h2 className="modal-brand">{detailsModal.brand}</h2>
              <p className="modal-name">{detailsModal.name}</p>
              <div className="modal-price-box">
                <span className="modal-price">{detailsModal.price}</span>
                {detailsModal.isDeal && <span className="modal-discount">{detailsModal.discount} OFF</span>}
              </div>
              <div className="modal-divider"></div>

              {/* === RAZMER TANLASH QISMI === */}
              <div className="modal-sizes">
                <p className="sizes-title">O'lchamni tanlang:</p>
                <div className="sizes-list">
                  {detailsModal.sizes.map(size => (
                    <button
                      key={size}
                      className={`size-btn ${selectedSize === size ? 'selected' : ''}`}
                      onClick={() => setSelectedSize(size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <p className="modal-description">{detailsModal.description}</p>

              {/* Razmerga qarab Savatga qo'shish tugmasi mantiqi */}
              <button
                className="add-to-cart-btn large"
                onClick={() => {
                  if (selectedSize) {
                    addToCart(detailsModal, selectedSize, null);
                    setDetailsModal(null);
                  }
                }}
                disabled={!selectedSize || cart.some(item => item.id === detailsModal.id && item.selectedSize === selectedSize)}
              >
                {!selectedSize
                  ? "O'lchamni tanlang"
                  : cart.some(item => item.id === detailsModal.id && item.selectedSize === selectedSize)
                    ? "✓ Savatda bor"
                    : "Savatga qo'shish"
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. FILTR PASTKI OYNASI (BOTTOM SHEET) */}
      {activeFilter && (
        <div className="filter-overlay" onClick={() => setActiveFilter(null)}>
          <div className="filter-bottom-sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-header">
              <h3>{activeFilter}</h3>
              <button className="sheet-close" onClick={() => setActiveFilter(null)}>✕</button>
            </div>
            <div className="sheet-options">
              {activeFilter === "Brand" && BRANDS.map(brand => (
                <button
                  key={brand}
                  className={`sheet-option-btn ${selectedBrand === brand ? 'selected' : ''}`}
                  onClick={() => { setSelectedBrand(brand); setActiveFilter(null); }}
                >
                  {brand}
                </button>
              ))}
              {activeFilter === "Sort by" && SORT_OPTIONS.map(option => (
                <button
                  key={option}
                  className={`sheet-option-btn ${sortOrder === option ? 'selected' : ''}`}
                  onClick={() => { setSortOrder(option); setActiveFilter(null); }}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App