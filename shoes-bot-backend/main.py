from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
import psycopg2  # SQLite o'rniga endi shundan foydalanamiz
import requests
import base64
import os

app = FastAPI()

# === SIZNING MA'LUMOTLARINGIZ ===
DATABASE_URL = "postgresql://neondb_owner:npg_nxpYqO7IMuf4@ep-flat-feather-adypfd7f-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
IMGBB_API_KEY = "8cc14f9c559efa0c3a02287ebd1c4d6f"

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Postgres bazasini tayyorlash
def init_db():
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()
    # Postgres'da AUTOINCREMENT o'rniga SERIAL ishlatiladi
    cursor.execute('''
                   CREATE TABLE IF NOT EXISTS products
                   (
                       id
                       SERIAL
                       PRIMARY
                       KEY,
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


init_db()


# === 1. MAHSULOT QO'SHISH (POST) ===
@app.post("/api/products")
async def add_product(
        brand: str = Form(...),
        name: str = Form(...),
        price: str = Form(...),
        description: str = Form(...),
        sizes: str = Form(...),
        isDeal: str = Form("false"),
        oldPrice: str = Form(""),
        discount: str = Form(""),
        image: UploadFile = File(...)
):
    # ImgBB ga yuklash
    image_bytes = await image.read()
    encoded_image = base64.b64encode(image_bytes).decode('utf-8')

    imgbb_url = f"https://api.imgbb.com/1/upload?key={IMGBB_API_KEY}"
    response = requests.post(imgbb_url, data={"image": encoded_image})

    if response.status_code == 200:
        img_data = response.json()
        image_url = img_data["data"]["url"]
    else:
        return {"status": "error", "message": "Rasmni ImgBB ga yuklashda xatolik yuz berdi!"}

    # Ma'lumotlarni Neon.tech (Postgres) ga yozish
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()
    # Postgres'da ma'lumot qabul qilish uchun ? o'rniga %s ishlatiladi
    cursor.execute('''
                   INSERT INTO products (brand, name, price, image_url, description, sizes, isDeal, oldPrice, discount)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                   ''', (brand, name, price, image_url, description, sizes, isDeal == "true", oldPrice, discount))
    conn.commit()
    conn.close()

    return {"status": "success", "message": "Mahsulot muvaffaqiyatli onlayn bazaga qo'shildi!"}


# === 2. BARCHA MAHSULOTLARNI OLISH (GET) ===
@app.get("/api/products")
async def get_products():
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM products ORDER BY id DESC")  # Yangilari birinchi chiqadi
    rows = cursor.fetchall()
    conn.close()

    products = []
    for row in rows:
        sizes_str = row[6] if row[6] else ""
        products.append({
            "id": row[0],
            "brand": row[1],
            "name": row[2],
            "price": row[3],
            "image": row[4],
            "description": row[5],
            "sizes": [int(s.strip()) for s in sizes_str.split(",") if s.strip().isdigit()],
            "isDeal": bool(row[7]),
            "oldPrice": row[8],
            "discount": row[9]
        })

    return products