import asyncio
import json
from aiogram import Bot, Dispatcher, F
from aiogram.types import Message, ReplyKeyboardMarkup, KeyboardButton
from aiogram.types.web_app_info import WebAppInfo
from aiogram.filters import CommandStart

# 1. BOT TOKENINI SHU YERGA YOZING
TOKEN = "8667557940:AAFWZOlFd0PO_acVHRyV3BCFqYGRTA59r_Y"

# 2. O'ZINGIZNING (ADMIN) TELEGRAM ID RAQAMINGIZNI YOZING
ADMIN_ID = 692138272

# 3. NETLIFY BERGAN HAVOLANI SHU YERGA YOZING (oxirida / belgisi bo'lmasin)
WEB_APP_URL = "https://lfshoes.netlify.app/"

bot = Bot(token=TOKEN)
dp = Dispatcher()


@dp.message(CommandStart())
async def start_cmd(message: Message):
    # Telegram klaviaturasida Web App tugmasini yaratamiz
    kb = ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="🛍 Do'konni ochish", web_app=WebAppInfo(url=WEB_APP_URL))]
        ],
        resize_keyboard=True
    )

    await message.answer(
        f"Assalomu alaykum, {message.from_user.first_name}! 👋\n\n"
        f"Pastdagi <b>🛍 Do'konni ochish</b> tugmasini bosib xaridni boshlang.",
        reply_markup=kb,  # Klaviaturani xabarga ulaymiz
        parse_mode="HTML"
    )


@dp.message(F.web_app_data)
async def handle_web_app_data(message: Message, bot: Bot):
    raw_data = message.web_app_data.data
    data = json.loads(raw_data)

    if data.get("type") == "order":
        items = data.get("items", [])
        total = data.get("total", "0")

        items_text = ""
        for index, item in enumerate(items, start=1):
            items_text += f"{index}. {item['brand']} {item['name']}\n   └ <i>Narxi:</i> {item['price']}\n"

        # Mijozga yuboriladigan chek
        user_receipt = (
            f"🧾 <b>Sizning buyurtma chekingiz</b>\n\n"
            f"🛒 <b>Xarid qilingan mahsulotlar:</b>\n"
            f"{items_text}\n"
            f"💰 <b>Jami to'lov:</b> €{total}\n\n"
            f"<i>✅ Buyurtmangiz muvaffaqiyatli qabul qilindi! Tez orada menejerlarimiz siz bilan bog'lanishadi. Xaridingiz uchun rahmat.</i>"
        )
        await message.answer(user_receipt, parse_mode="HTML")

        # Adminga yuboriladigan xabarnoma
        if ADMIN_ID:
            username = f"@{message.from_user.username}" if message.from_user.username else "Username yo'q"
            admin_notification = (
                f"🚨 <b>YANGI BUYURTMA QABUL QILINDI!</b>\n\n"
                f"👤 <b>Mijoz:</b> {message.from_user.full_name}\n"
                f"🔗 <b>Username:</b> {username}\n"
                f"🆔 <b>ID:</b> <code>{message.from_user.id}</code>\n\n"
                f"📦 <b>Buyurtma tarkibi:</b>\n"
                f"{items_text}\n"
                f"💵 <b>JAMI SUMMA:</b> €{total}"
            )
            try:
                await bot.send_message(chat_id=ADMIN_ID, text=admin_notification, parse_mode="HTML")
            except Exception as e:
                print(f"Adminga xabar yuborishda xatolik: {e}")


async def main():
    print("Bot ishga tushdi...")
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())