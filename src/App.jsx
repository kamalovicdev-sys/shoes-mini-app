import { useState, useEffect } from 'react'
import './App.css'

const WebApp = window.Telegram.WebApp;

const SHOES = [
  { id: 1, brand: "New Balance", name: "MR530 UNISEX - Trainers - sea salt", price: "€129.95", isSponsored: true, image: "https://images.unsplash.com/photo-1539185441755-769473a23570?w=500&q=80" },
  { id: 2, brand: "Nike Sportswear", name: "AIR FORCE 1 - Trainers - white", price: "€89.95", oldPrice: "€99.95", discount: "-10%", isDeal: true, image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80" },
  { id: 3, brand: "Nike Sportswear", name: "AIR FORCE 1 '07 - Trainers - white", price: "€95.95", oldPrice: "€119.95", discount: "-20%", isDeal: true, image: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=500&q=80" },
  { id: 4, brand: "Puma", name: "RS-X - Trainers - dark blue", price: "€75.00", image: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=500&q=80" }
];

const FILTERS = ["Sort by", "Brand", "Size", "Colour", "Qualities", "Price", "Material"];

function App() {
  const [selectedShoe, setSelectedShoe] = useState(null);
  const [cart, setCart] = useState([]); // Savat uchun state

  useEffect(() => {
    if (WebApp) {
      WebApp.ready();
      WebApp.expand();
    }
  }, []);

  useEffect(() => {
    if (selectedShoe) {
      WebApp.MainButton.setText(`BUY NOW - ${selectedShoe.price}`);
      WebApp.MainButton.show();
    } else if (cart.length > 0) {
        WebApp.MainButton.setText(`VIEW CART (${cart.length})`);
        WebApp.MainButton.show();
    } else {
      WebApp.MainButton.hide();
    }
  }, [selectedShoe, cart]);

  useEffect(() => {
    const handleMainButtonClick = () => {
        if (selectedShoe) {
            WebApp.sendData(JSON.stringify({type: 'buy', ...selectedShoe}));
        } else if (cart.length > 0) {
            // Savatni ko'rish mantiqi
            alert("Viewing cart: " + JSON.stringify(cart));
        }
    };

    WebApp.MainButton.onClick(handleMainButtonClick);

    return () => {
      WebApp.MainButton.offClick(handleMainButtonClick);
    };
  }, [selectedShoe, cart]);

  const handleCardClick = (shoe) => {
    if (selectedShoe && selectedShoe.id === shoe.id) {
      setSelectedShoe(null);
    } else {
      setSelectedShoe(shoe);
    }
  };

  const addToCart = (shoe, event) => {
    event.stopPropagation(); // Kartochka bosilib ketmasligi uchun
    setCart([...cart, shoe]);
    alert(`${shoe.name} added to cart!`);
  };

  const viewDetails = (shoe, event) => {
    event.stopPropagation(); // Kartochka bosilib ketmasligi uchun
    alert(`Viewing details for ${shoe.name}`);
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
          <div
            key={shoe.id}
            className={`shoe-card ${selectedShoe?.id === shoe.id ? 'selected' : ''} ${cart.some(item => item.id === shoe.id) ? 'in-cart' : ''}`}
            onClick={() => handleCardClick(shoe)}
          >
            <div className="image-container">
              <img src={shoe.image} alt={shoe.name} />
              <button className="heart-btn" onClick={(e) => {
                e.stopPropagation();
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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

            {/* Tugmalar qismi (YANGI) */}
            <div className="card-actions">
              <button className="add-to-cart-btn" onClick={(e) => addToCart(shoe, e)}>Add to Cart</button>
              <button className="details-btn" onClick={(e) => viewDetails(shoe, e)}>Details</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default App