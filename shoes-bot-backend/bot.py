import asyncio
import json
from aiogram import Bot, Dispatcher, F
from aiogram.types import Message
from aiogram.filters import CommandStart

# 1. BOT TOKENINI SHU YERGA YOZING
TOKEN = "8667557940:AAFWZOlFd0PO_acVHRyV3BCFqYGRTA59r_Y"

# 2. O'ZINGIZNING (ADMIN) TELEGRAM ID RAQAMINGIZNI SHU YERGA YOZING (Qo'shtirnoqsiz, faqat raqam!)
ADMIN_ID = 692138272

bot = Bot(token=TOKEN)
dp = Dispatcher()


@dp.message(CommandStart())
async def start_cmd(message: Message):
    await message.answer(
        f"Assalomu alaykum, {message.from_user.first_name}! 👋\n\n"
        f"Bizning poyabzallar do'koniga xush kelibsiz. Pastdagi <b>Katalog</b> tugmasini bosib xaridni boshlashingiz mumkin.",
        parse_mode="HTML"
    )


@dp.message(F.web_app_data)
async def handle_web_app_data(message: Message, bot: Bot):
    # Frontenddan kelgan JSON ma'lumotni o'qiymiz
    raw_data = message.web_app_data.data
    data = json.loads(raw_data)

    if data.get("type") == "order":
        items = data.get("items", [])
        total = data.get("total", "0")

        # Mahsulotlar ro'yxatini matn ko'rinishiga keltiramiz
        items_text = ""
        for index, item in enumerate(items, start=1):
            items_text += f"{index}. {item['brand']} {item['name']}\n   └ <i>Narxi:</i> {item['price']}\n"

        # ==========================================
        # 1. MIJOZGA YUBORILADIGAN CHEK (RECEIPT)
        # ==========================================
        user_receipt = (
            f"🧾 <b>Sizning buyurtma chekingiz</b>\n\n"
            f"🛒 <b>Xarid qilingan mahsulotlar:</b>\n"
            f"{items_text}\n"
            f"💰 <b>Jami to'lov:</b> €{total}\n\n"
            f"<i>✅ Buyurtmangiz muvaffaqiyatli qabul qilindi! Tez orada menejerlarimiz siz bilan bog'lanishadi. Xaridingiz uchun rahmat.</i>"
        )

        # Mijozga javob yozish
        await message.answer(user_receipt, parse_mode="HTML")

        # ==========================================
        # 2. ADMINGA YUBORILADIGAN XABARNOMA
        # ==========================================
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
                # Adminga (sizga) xabar jo'natish
                await bot.send_message(chat_id=ADMIN_ID, text=admin_notification, parse_mode="HTML")
            except Exception as e:
                print(f"Adminga xabar yuborishda xatolik yuz berdi (ID noto'g'ri bo'lishi mumkin): {e}")


async def main():
    print("Bot ishga tushdi va xabarlarni kutmoqda...")
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
