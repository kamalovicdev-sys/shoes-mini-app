import { useState, useEffect, useMemo } from 'react';
import './App.css';
import Checkout from './Checkout';

const WebApp = window.Telegram.WebApp;

// 1. "Rang" olib tashlandi, faqat kerakli filtrlar qoldi
const FILTERS = ["Saralash", "Brend", "O'lcham"];
const SORT_OPTIONS = ["Standart", "Arzondan qimmatga", "Qimmatdan arzonga"];

const BRAND_LOGOS = [
  { name: 'Nike', logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg' },
  { name: 'New Balance', logo: 'https://logolook.net/wp-content/uploads/2023/04/New-Balance-Emblem.png' },
  { name: 'Adidas', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/20/Adidas_Logo.svg' },
  { name: 'Puma', logo: 'https://logoeps.com/wp-content/uploads/2013/04/puma-se-eps-vector-logo.png' },
  { name: 'Jordan', logo: 'https://upload.wikimedia.org/wikipedia/en/3/37/Jumpman_logo.svg' }
];


const API_URL = "https://competent-mastodon-lfshoes-751b6276.koyeb.app";

// === RASM SLAYDERI KOMPONENTI ===
const ProductImageSlider = ({ images, name, onImageClick }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="image-container empty-image" onClick={onImageClick}>
        <span>Rasm yo'q</span>
      </div>
    );
  }

  if (images.length === 1) {
    return (
      <div className="image-container" onClick={onImageClick}>
        <img src={images[0]} alt={name} />
      </div>
    );
  }

  const nextImage = (event) => {
    event.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1 === images.length ? 0 : prev + 1));
  };

  const prevImage = (event) => {
    event.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  return (
    <div className="image-container product-slider" onClick={onImageClick}>
      <button className="slider-btn prev-btn" onClick={prevImage}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>

      <img src={images[currentImageIndex]} alt={`${name} - ${currentImageIndex + 1}`} className="slider-img" />

      <button className="slider-btn next-btn" onClick={nextImage}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </button>

      <div className="slider-dots">
        {images.map((_, index) => (
          <span
            key={index}
            className={`dot ${index === currentImageIndex ? 'active' : ''}`}
          />
        ))}
      </div>
    </div>
  );
};

// === ASOSIY Ilova KOMPONENTI ===
function App() {
  const [SHOES, setSHOES] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [cart, setCart] = useState([]);
  const [detailsModal, setDetailsModal] = useState(null);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const [selectedSize, setSelectedSize] = useState(null);
  const [activeFilter, setActiveFilter] = useState(null);

  // === FILTRLAR UCHUN STATE ===
  const [selectedBrand, setSelectedBrand] = useState("Barchasi");
  const [sortOrder, setSortOrder] = useState("Standart");
  const [selectedSizeFilter, setSelectedSizeFilter] = useState("Barchasi"); // YANGI: O'lcham filtri

  useEffect(() => {
    fetch(`${API_URL}/api/products`)
      .then(res => res.json())
      .then(data => {
        setSHOES(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Bazadan ma'lumot olishda xatolik:", err);
        setIsLoading(false);
      });
  }, []);

  // Bor brendlarni aniqlash
  const BRANDS = useMemo(() => {
    const uniqueBrands = new Set(SHOES.map(shoe => shoe.brand ? shoe.brand.trim() : ""));
    return ["Barchasi", ...Array.from(uniqueBrands).filter(b => b !== "")];
  }, [SHOES]);

  // YANGI: Bor o'lchamlarni bazadan yig'ib, o'sish tartibida taxlash
  const SIZES = useMemo(() => {
    const allSizes = new Set();
    SHOES.forEach(shoe => {
      if (shoe.sizes && Array.isArray(shoe.sizes)) {
        shoe.sizes.forEach(size => allSizes.add(size));
      }
    });
    // Razmerlarni raqam bo'yicha o'sish tartibida joylaymiz (masalan: 39, 40, 41)
    return ["Barchasi", ...Array.from(allSizes).sort((a, b) => a - b)];
  }, [SHOES]);

  useEffect(() => {
    if (WebApp) {
      WebApp.ready();
      WebApp.expand();
      WebApp.setHeaderColor('bg_color');
    }
  }, []);

  useEffect(() => {
    if (detailsModal) {
      setSelectedSize(null);
    }
  }, [detailsModal]);

  const calculateTotal = () => {
    const total = cart.reduce((sum, item) => {
      const priceStr = String(item.price);
      const numericPrice = parseFloat(priceStr.replace(/[^\d]/g, ''));
      return isNaN(numericPrice) ? sum : sum + numericPrice;
    }, 0);
    return total.toLocaleString('ru-RU');
  };

  useEffect(() => {
    if (isCheckoutOpen) return;

    if (isCartOpen) {
      WebApp.MainButton.setText(`RASMIYLASHTIRISH - ${calculateTotal()} so'm`);
      WebApp.MainButton.show();
      WebApp.BackButton.show();
    } else if (cart.length > 0) {
      WebApp.MainButton.setText(`SAVATNI KO'RISH (${cart.length})`);
      WebApp.MainButton.show();
      WebApp.BackButton.hide();
    } else {
      WebApp.MainButton.hide();
      WebApp.BackButton.hide();
    }
  }, [cart, isCartOpen, isCheckoutOpen]);

  useEffect(() => {
    if (isCheckoutOpen) return;

    const handleMainButtonClick = () => {
      if (isCartOpen) {
        setIsCheckoutOpen(true);
      } else if (cart.length > 0) {
        setIsCartOpen(true);
      }
    };

    const handleBackButtonClick = () => {
      setIsCartOpen(false);
    };

    WebApp.MainButton.onClick(handleMainButtonClick);
    WebApp.BackButton.onClick(handleBackButtonClick);

    return () => {
      WebApp.MainButton.offClick(handleMainButtonClick);
      WebApp.BackButton.offClick(handleBackButtonClick);
    };
  }, [isCartOpen, cart, isCheckoutOpen]);

  const addToCart = (shoe, size, event) => {
    if (event) {
      event.stopPropagation();
    }
    const sizeToAdd = size || shoe.sizes[0];

    if (!cart.some(item => item.id === shoe.id && item.selectedSize === sizeToAdd)) {
      setCart([...cart, {
        ...shoe,
        selectedSize: sizeToAdd,
        cartItemId: Date.now(),
        cartItemImage: shoe.images && shoe.images.length > 0 ? shoe.images[0] : ''
      }]);
      if (WebApp.HapticFeedback) {
        WebApp.HapticFeedback.impactOccurred('light');
      }
    }
  };

  const removeFromCart = (indexToRemove) => {
    setCart(cart.filter((_, index) => index !== indexToRemove));
    if (WebApp.HapticFeedback) {
      WebApp.HapticFeedback.impactOccurred('medium');
    }
    if (cart.length === 1) {
      setIsCartOpen(false);
    }
  };

  // === MAHSULOTLARNI 2 TA RO'YXATGA BO'LISH VA SARALASH ===
  const { bestSellers, newArrivals } = useMemo(() => {
    let result = [...SHOES];

    // 1. Brend bo'yicha filtr
    if (selectedBrand !== "Barchasi") {
      result = result.filter(shoe =>
        shoe.brand && shoe.brand.trim().toLowerCase() === selectedBrand.trim().toLowerCase()
      );
    }

    // YANGI: 2. O'lcham bo'yicha filtr (Agar barchasi bo'lmasa)
    if (selectedSizeFilter !== "Barchasi") {
      result = result.filter(shoe => shoe.sizes && shoe.sizes.includes(Number(selectedSizeFilter)));
    }

    // 3. Narx bo'yicha saralash
    const priceReplace = (price) => parseFloat(String(price).replace(/[^\d]/g, ''));
    if (sortOrder === "Arzondan qimmatga") {
      result.sort((a, b) => priceReplace(a.price) - priceReplace(b.price));
    } else if (sortOrder === "Qimmatdan arzonga") {
      result.sort((a, b) => priceReplace(b.price) - priceReplace(a.price));
    }

    // Eng ko'p sotilganlar (Chegirmasi borlar)
    const deals = result.filter(s => s.isDeal);
    const bests = deals.length > 0 ? deals : result.slice(0, 5);

    // Yangi mahsulotlar (Eng oxirgi qo'shilganlar)
    const news = [...result].sort((a, b) => b.id - a.id);

    return { bestSellers: bests, newArrivals: news };
  }, [SHOES, selectedBrand, sortOrder, selectedSizeFilter]);

  // YANGILANDI: O'lcham tugmasi ham ishlashi uchun
  const handleFilterClick = (filterName) => {
    if (filterName === "Brend" || filterName === "Saralash" || filterName === "O'lcham") {
      setActiveFilter(filterName);
    } else {
      if(WebApp.showAlert) {
        WebApp.showAlert("Bu filtr tez orada ishga tushadi!");
      } else {
        alert("Bu filtr tez orada ishga tushadi!");
      }
    }
  };

  return (
    <div className="app-container">

      {/* 1. ASOSIY SAHIFA */}
      {!isCartOpen && !isCheckoutOpen && (
        <>
          <div className="filters-scroll">
            <div className="filters-container">
              {FILTERS.map((filter, index) => {
                // Filtr aktivligini tekshirish
                const isActive = (filter === "Brend" && selectedBrand !== "Barchasi") ||
                                 (filter === "Saralash" && sortOrder !== "Standart") ||
                                 (filter === "O'lcham" && selectedSizeFilter !== "Barchasi"); // YANGI

                // Tugmada nima yozuv chiqishi
                const buttonText = filter === "Brend" && selectedBrand !== "Barchasi" ? selectedBrand :
                                   filter === "O'lcham" && selectedSizeFilter !== "Barchasi" ? selectedSizeFilter : filter;

                return (
                  <button
                    key={index}
                    className={`filter-btn ${isActive ? 'active-filter' : ''}`}
                    onClick={() => handleFilterClick(filter)}
                  >
                    {buttonText}
                    <svg className="chevron-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="brands-section">
            <div className="brands-header">
              <h3>Brendlar</h3>
              <button className="brands-all-btn" onClick={() => setSelectedBrand("Barchasi")}>
                Barchasi
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>

            <div className="brands-list">
              {BRAND_LOGOS.map((brand, index) => (
                <div
                  key={index}
                  className={`brand-card-wrapper ${selectedBrand.toLowerCase() === brand.name.toLowerCase() ? 'active' : ''}`}
                  onClick={() => setSelectedBrand(brand.name)}
                >
                  <div className="brand-icon-box">
                    <img src={brand.logo} alt={brand.name} />
                  </div>
                  <span className="brand-name">{brand.name}</span>
                </div>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="empty-state">Ma'lumotlar yuklanmoqda...</div>
          ) : (bestSellers.length > 0 || newArrivals.length > 0) ? (
            <>
              {bestSellers.length > 0 && (
                <>
                  <div className="section-header">
                    <h3>Eng ko'p sotilganlar</h3>
                    <button className="section-all-btn">
                      Barchasi
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6"></polyline>
                      </svg>
                    </button>
                  </div>

                  <div className="horizontal-shoes-list">
                    {bestSellers.map((shoe) => {
                      const isInCart = cart.some(item => item.id === shoe.id);
                      return (
                        <div key={shoe.id} className={`shoe-card ${isInCart ? 'in-cart' : ''}`}>
                          <ProductImageSlider
                            images={shoe.images}
                            name={shoe.name}
                            onImageClick={() => setDetailsModal(shoe)}
                          />
                          {shoe.isDeal && <div className="deal-badge">Chegirma</div>}
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
                              {isInCart ? '✓ Savatda' : 'Savatga'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {newArrivals.length > 0 && (
                <>
                  <div className="section-header">
                    <h3>Yangi mahsulotlar</h3>
                    <button className="section-all-btn">
                      Barchasi
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6"></polyline>
                      </svg>
                    </button>
                  </div>

                  <div className="shoes-grid">
                    {newArrivals.map((shoe) => {
                      const isInCart = cart.some(item => item.id === shoe.id);
                      return (
                        <div key={shoe.id} className={`shoe-card ${isInCart ? 'in-cart' : ''}`}>
                          <ProductImageSlider
                            images={shoe.images}
                            name={shoe.name}
                            onImageClick={() => setDetailsModal(shoe)}
                          />
                          {shoe.isDeal && <div className="deal-badge">Chegirma</div>}
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
                              {isInCart ? '✓ Savatda' : 'Savatga'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="empty-state">Hozircha mahsulot topilmadi</div>
          )}

          {cart.length > 0 && (
            <button className="floating-cart-btn" onClick={() => setIsCartOpen(true)}>
              🛒 Savat ({cart.length})
            </button>
          )}
        </>
      )}

      {/* 2. SAVAT SAHIFASI */}
      {isCartOpen && !isCheckoutOpen && (
        <div className="cart-page">
          <div className="cart-header-row">
             <button className="back-btn-local" onClick={() => setIsCartOpen(false)}>← Orqaga</button>
             <h2 className="cart-title">Savat</h2>
          </div>

          <div className="cart-list">
            {cart.map((item, index) => (
              <div key={item.cartItemId || index} className="cart-item">
                <img src={item.cartItemImage} alt={item.name} className="cart-item-img" />
                <div className="cart-item-info">
                  <p className="cart-item-brand">{item.brand}</p>
                  <p className="cart-item-name">{item.name}</p>
                  <p className="cart-item-size">O'lcham: {item.selectedSize}</p>
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
            <span>Jami:</span>
            <span>{calculateTotal()} so'm</span>
          </div>

          <button className="floating-cart-btn confirm-btn" onClick={() => setIsCheckoutOpen(true)}>
            RASMIYLASHTIRISH - {calculateTotal()} so'm
          </button>
        </div>
      )}

      {/* 3. BUYURTMANI RASMIYLASHTIRISH SAHIFASI */}
      {isCheckoutOpen && (
        <Checkout
          cart={cart}
          total={calculateTotal()}
          onBack={() => setIsCheckoutOpen(false)}
          onComplete={() => {
            setCart([]);
            setIsCheckoutOpen(false);
            setIsCartOpen(false);
          }}
        />
      )}

      {/* 4. MODAL OYNA (Mahsulot tafsilotlari) */}
      {detailsModal && (
        <div className="modal-overlay" onClick={() => setDetailsModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setDetailsModal(null)}>✕</button>

            <div className="modal-slider-container" style={{ margin: '0 auto 24px auto', width: '100%', height: '260px' }}>
                <ProductImageSlider
                  images={detailsModal.images}
                  name={detailsModal.name}
                  onImageClick={null}
                />
            </div>

            <div className="modal-body">
              <h2 className="modal-brand">{detailsModal.brand}</h2>
              <p className="modal-name">{detailsModal.name}</p>
              <div className="modal-price-box">
                <span className="modal-price">{detailsModal.price}</span>
                {detailsModal.isDeal && <span className="modal-discount">{detailsModal.discount} CHEGIRMA</span>}
              </div>
              <div className="modal-divider"></div>

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
                {!selectedSize ? "O'lchamni tanlang" : cart.some(item => item.id === detailsModal.id && item.selectedSize === selectedSize) ? "✓ Savatda bor" : "Savatga qo'shish" }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. FILTR PASTKI OYNASI (BOTTOM SHEET) */}
      {activeFilter && (
        <div className="filter-overlay" onClick={() => setActiveFilter(null)}>
          <div className="filter-bottom-sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-header">
              <h3>{activeFilter}</h3>
              <button className="sheet-close" onClick={() => setActiveFilter(null)}>✕</button>
            </div>
            <div className="sheet-options">
              {/* Brend Filtr */}
              {activeFilter === "Brend" && BRANDS.map(brand => (
                <button
                  key={brand}
                  className={`sheet-option-btn ${selectedBrand === brand ? 'selected' : ''}`}
                  onClick={() => { setSelectedBrand(brand); setActiveFilter(null); }}
                >
                  {brand}
                </button>
              ))}
              {/* Saralash Filtr */}
              {activeFilter === "Saralash" && SORT_OPTIONS.map(option => (
                <button
                  key={option}
                  className={`sheet-option-btn ${sortOrder === option ? 'selected' : ''}`}
                  onClick={() => { setSortOrder(option); setActiveFilter(null); }}
                >
                  {option}
                </button>
              ))}
              {/* YANGI: O'lcham Filtr */}
              {activeFilter === "O'lcham" && SIZES.map(size => (
                <button
                  key={size}
                  className={`sheet-option-btn ${selectedSizeFilter === size ? 'selected' : ''}`}
                  onClick={() => { setSelectedSizeFilter(size); setActiveFilter(null); }}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App;