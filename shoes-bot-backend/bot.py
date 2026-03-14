import asyncio
import json
from aiogram import Bot, Dispatcher, F
from aiogram.filters import CommandStart
from aiogram.types import Message

# O'zingizning tokningizni shu yerga yozing
TOKEN = "8667557940:AAFWZOlFd0PO_acVHRyV3BCFqYGRTA59r_Y"

bot = Bot(token=TOKEN)
dp = Dispatcher()


# /start buyrug'iga javob
@dp.message(CommandStart())
async def command_start_handler(message: Message) -> None:
    await message.answer(
        f"Assalomu alaykum, {message.from_user.first_name}! 👋\n\n"
        f"Pastdagi <b>Katalog</b> tugmasini bosib, poyabzallarimiz bilan tanishing."
        , parse_mode="HTML")


# Mini App dan kelgan ma'lumotlarni qabul qilish
@dp.message(F.web_app_data)
async def web_app_data_handler(message: Message):
    # Front-end'dan yuborilgan JSON ma'lumotni o'qib olamiz
    data = json.loads(message.web_app_data.data)

    # Ma'lumotlarni o'zgaruvchilarga ajratamiz
    brand = data.get('brand', 'Noma\'lum brend')
    name = data.get('name', 'Noma\'lum model')
    price = data.get('price', 'Noma\'lum narx')

    # Foydalanuvchiga chiroyli tasdiq xabarini jo'natamiz
    text = (
        f"🎉 <b>Yangi buyurtma qabul qilindi!</b>\n\n"
        f"👟 <b>Brend:</b> {brand}\n"
        f"📝 <b>Model:</b> {name}\n"
        f"💰 <b>Narxi:</b> {price}\n\n"
        f"<i>Tez orada menejerlarimiz siz bilan bog'lanishadi. Xaridingiz uchun rahmat!</i>"
    )

    await message.answer(text, parse_mode="HTML")

    async def main():
        print("Bot ishga tushdi...")
        # Botni doimiy ishlab turishiga ishga tushiramiz
        await dp.start_polling(bot)

    if __name__ == "__main__":
        asyncio.run(main())