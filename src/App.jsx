import { useState, useEffect } from 'react'
import './App.css'

const WebApp = window.Telegram.WebApp;

// Ma'lumotlar bazasi (oldingi holicha qoladi)
const SHOES = [
  { id: 1, brand: "New Balance", name: "MR530 UNISEX - Trainers - sea salt", price: "€129.95", isSponsored: true, image: "https://images.unsplash.com/photo-1539185441755-769473a23570?w=500&q=80" },
  { id: 2, brand: "Nike Sportswear", name: "AIR FORCE 1 - Trainers - white", price: "€89.95", oldPrice: "€99.95", discount: "-10%", isDeal: true, image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80" },
  { id: 3, brand: "Nike Sportswear", name: "AIR FORCE 1 '07 - Trainers - white", price: "€95.95", oldPrice: "€119.95", discount: "-20%", isDeal: true, image: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=500&q=80" },
  { id: 4, brand: "Puma", name: "RS-X - Trainers - dark blue", price: "€75.00", image: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=500&q=80" }
];

const FILTERS = ["Sort by", "Brand", "Size", "Colour", "Qualities", "Price", "Material"];

function App() {
  // Tanlangan mahsulotni saqlash uchun state
  const [selectedShoe, setSelectedShoe] = useState(null);

  useEffect(() => {
    if (WebApp) {
      WebApp.ready();
      WebApp.expand();
    }
  }, []);

  // 1. Tanlangan mahsulotga qarab Telegram Asosiy tugmasini boshqarish
  useEffect(() => {
    if (selectedShoe) {
      WebApp.MainButton.setText(`SOTIB OLISH - ${selectedShoe.price}`);
      WebApp.MainButton.show();
    } else {
      WebApp.MainButton.hide();
    }
  }, [selectedShoe]);

  // 2. Asosiy tugma bosilganda botga ma'lumot jo'natish
  useEffect(() => {
    const handleBuyClick = () => {
      // Tanlangan mahsulot ma'lumotlarini matn (JSON) ko'rinishida botga yuboramiz
      WebApp.sendData(JSON.stringify(selectedShoe));
    };

    // Tugmaga bosish hodisasini qo'shamiz
    WebApp.MainButton.onClick(handleBuyClick);

    // Komponent yangilanganda xatolik bo'lmasligi uchun eskisini tozalaymiz
    return () => {
      WebApp.MainButton.offClick(handleBuyClick);
    };
  }, [selectedShoe]);

  // Kartochka bosilganda ishlaydigan funksiya
  const handleCardClick = (shoe) => {
    // Agar tanlangan mahsulot yana bosilsa, tanlovni bekor qilamiz (otmen)
    if (selectedShoe && selectedShoe.id === shoe.id) {
      setSelectedShoe(null);
    } else {
      setSelectedShoe(shoe);
    }
  };

  return (
    <div className="app-container">
      <div className="filters-scroll">
        <div className="filters-container">
          {FILTERS.map((filter, index) => (
            <button key={index} className="filter-btn">
              {filter}
              <svg className="chevron-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
          ))}
        </div>
      </div>

      <div className="shoes-grid">
        {SHOES.map((shoe) => (
          // Dinamik class qo'shamiz: agar tanlangan bo'lsa 'selected' klassi qo'shiladi
          <div
            key={shoe.id}
            className={`shoe-card ${selectedShoe?.id === shoe.id ? 'selected' : ''}`}
            onClick={() => handleCardClick(shoe)}
          >
            <div className="image-container">
              <img src={shoe.image} alt={shoe.name} />
              <button className="heart-btn" onClick={(e) => {
                e.stopPropagation(); // Yurakchani bosganda kartochka bosilib ketmasligi uchun
                // Yurakcha bosilgandagi mantiqni keyin qo'shamiz
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
              </button>
              {shoe.isDeal && <div className="deal-badge">Deal</div>}
            </div>

            <div className="card-info">
              <div className="text-group">
                {shoe.isSponsored && <div className="sponsored">Sponsored ⓘ</div>}
                <div className="brand">{shoe.brand}</div>
                <div className="name">{shoe.name}</div>
              </div>

              <div className="price-group">
                {shoe.isDeal ? (
                  <div className="price-section">
                    <span className="price deal-price">{shoe.price}</span>
                    <div className="old-price-row">
                      <span className="regular-label">Regular: </span>
                      <span className="old-price">{shoe.oldPrice}</span>
                      <span className="discount-badge">{shoe.discount}</span>
                    </div>
                  </div>
                ) : (
                  <div className="price-section">
                    <span className="price">{shoe.isSponsored ? `From ${shoe.price}` : shoe.price}</span>
                  </div>
                )}
              </div>
            </div>

          </div>
        ))}
      </div>
    </div>
  )
}

export default App