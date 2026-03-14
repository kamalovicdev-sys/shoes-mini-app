import asyncio
import json
from aiogram import Bot, Dispatcher, F
from aiogram.types import Message
from aiogram.filters import CommandStart

# 1. BOT TOKENINI SHU YERGA YOZING
TOKEN = "8667557940:AAFWZOlFd0PO_acVHRyV3BCFqYGRTA59r_Y"

# 2. Agar buyurtmalar sizga ham kelishini xohlasangiz, o'z Telegram ID raqamingizni yozing.
# O'z ID raqamingizni @userinfobot orqali bilib olishingiz mumkin.
# Hozircha bo'sh qoldirsangiz ham ishlayveradi (faqat mijozga boradi).
ADMIN_ID = None

bot = Bot(token=TOKEN)
dp = Dispatcher()


# /start buyrug'i uchun
@dp.message(CommandStart())
async def start_cmd(message: Message):
    await message.answer(
        f"Assalomu alaykum, {message.from_user.first_name}! 👋\n\n"
        f"Bizning poyabzallar do'koniga xush kelibsiz. Pastdagi <b>Menu (yoki Katalog)</b> tugmasini bosib buyurtma berishingiz mumkin.",
        parse_mode="HTML"
    )


# Mini App dan kelgan WebApp ma'lumotlarini qabul qiluvchi funksiya
@dp.message(F.web_app_data)
async def handle_web_app_data(message: Message):
    # 1. Frontenddan kelgan JSON ma'lumotni ushlab olamiz va o'qiymiz
    raw_data = message.web_app_data.data
    data = json.loads(raw_data)

    # 2. Agar bu ma'lumot turi 'order' (buyurtma) bo'lsa
    if data.get("type") == "order":
        items = data.get("items", [])  # Savatdagi mahsulotlar ro'yxati
        total = data.get("total", "0")  # Jami narx

        # Mijozning username'ini olish (agar yo'q bo'lsa, ismi chiqadi)
        username = f"@{message.from_user.username}" if message.from_user.username else "Yo'q"

        # 3. Chiroyli xabar (Chek) matnini yig'ishni boshlaymiz
        text = f"🎉 <b>YANGI BUYURTMA QABUL QILINDI!</b>\n\n"
        text += f"👤 <b>Mijoz:</b> {message.from_user.full_name}\n"
        text += f"📞 <b>Username:</b> {username}\n\n"
        text += "🛒 <b>Savatdagi mahsulotlar:</b>\n"

        # Ro'yxatdagi har bir mahsulotni bittadan qatorga qo'shib chiqamiz
        for index, item in enumerate(items, start=1):
            text += f"{index}. {item['brand']} - {item['name']}\n"
            text += f"   <i>Narxi:</i> {item['price']}\n\n"

        text += f"💰 <b>JAMI SUMMA:</b> €{total}\n\n"
        text += "<i>✅ Buyurtmangiz tasdiqlandi. Tez orada menejerlarimiz siz bilan bog'lanishadi! Xaridingiz uchun rahmat.</i>"

        # 4. Ushbu xabarni mijozning o'ziga yuboramiz
        await message.answer(text, parse_mode="HTML")

        # 5. Agar ADMIN_ID kiritilgan bo'lsa, adminga (o'zingizga) ham nusxasini tashlaydi
        if ADMIN_ID:
            try:
                await bot.send_message(
                    chat_id=ADMIN_ID,
                    text=f"⚠️ <b>DIQQAT, YANGI BUYURTMA!</b>\n\n" + text.replace("✅ Buyurtmangiz tasdiqlandi.", ""),
                    parse_mode="HTML"
                )
            except Exception as e:
                print(f"Adminga xabar yuborishda xatolik: {e}")


async def main():
    print("Bot muvaffaqiyatli ishga tushdi va xabarlarni kutmoqda...")
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())