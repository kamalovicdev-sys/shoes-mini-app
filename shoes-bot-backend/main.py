from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import sqlite3
import shutil
import os
import json

app = FastAPI()

# React (Frontend) va Python (Backend) turli xil portlarda bo'lgani uchun
# ular bir-biri bilan gaplasha olishi uchun CORS ruxsatini beramiz
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Barcha saytlardan keladigan so'rovlarga ruxsat (Netlify uchun ham kerak)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rasmlarni saqlash uchun "uploads" degan papka yaratamiz
UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

# "uploads" papkasidagi rasmlarni internetda ko'rish imkonini beramiz
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


# Ma'lumotlar bazasini (SQLite) sozlash
def init_db():
    conn = sqlite3.connect("shop.db")
    cursor = conn.cursor()
    # Mahsulotlar jadvalini yaratish
    cursor.execute('''
                   CREATE TABLE IF NOT EXISTS products
                   (
                       id
                       INTEGER
                       PRIMARY
                       KEY
                       AUTOINCREMENT,
                       brand
                       TEXT,
                       name
                       TEXT,
                       price
                       TEXT,
                       image_url
                       TEXT,
                       description
                       TEXT,
                       sizes
                       TEXT,
                       isDeal
                       BOOLEAN,
                       oldPrice
                       TEXT,
                       discount
                       TEXT
                   )
                   ''')
    conn.commit()
    conn.close()


# Dastur ishga tushganda bazani tayyorlab qo'yadi
init_db()


# === 1. MAHSULOT QO'SHISH (POST) API ===
@app.post("/api/products")
async def add_product(
        brand: str = Form(...),
        name: str = Form(...),
        price: str = Form(...),
        description: str = Form(...),
        sizes: str = Form(...),  # "39, 40, 41" ko'rinishida keladi
        isDeal: str = Form("false"),
        oldPrice: str = Form(""),
        discount: str = Form(""),
        image: UploadFile = File(...)  # Rasm fayli shu yerga keladi
):
    # 1. Rasmni kompyuterga (serverga) saqlash
    image_filename = f"{image.filename}"
    file_path = os.path.join(UPLOAD_DIR, image_filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)

    # Rasmning internetdagi manzili (masalan: http://localhost:8000/uploads/rasm.jpg)
    image_url = f"/uploads/{image_filename}"

    # 2. Ma'lumotlarni bazaga (SQLite) yozish
    conn = sqlite3.connect("shop.db")
    cursor = conn.cursor()

    cursor.execute('''
                   INSERT INTO products (brand, name, price, image_url, description, sizes, isDeal, oldPrice, discount)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                   ''', (brand, name, price, image_url, description, sizes, isDeal == "true", oldPrice, discount))

    conn.commit()
    conn.close()

    return {"status": "success", "message": "Mahsulot bazaga muvaffaqiyatli qo'shildi!"}


@app.get("/api/products")
async def get_products():
    conn = sqlite3.connect("shop.db")
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM products")
    rows = cursor.fetchall()
    conn.close()

    products = []
    for row in rows:
        # Agar sizes bo'sh bo'lsa xato bermasligi uchun tekshiramiz
        sizes_str = row[6] if row[6] else ""

        products.append({
            "id": row[0],
            "brand": row[1],
            "name": row[2],
            "price": row[3],
            "image": row[4],
            "description": row[5],
            # XATOLIK SHU YERDA EDI: trim() o'rniga strip() yozildi
            "sizes": [int(s.strip()) for s in sizes_str.split(",") if s.strip().isdigit()],
            "isDeal": bool(row[7]),
            "oldPrice": row[8],
            "discount": row[9]
        })

    return products