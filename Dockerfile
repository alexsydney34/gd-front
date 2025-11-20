# Используем официальный Node образ
FROM node:22-alpine

# Создаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем весь проект
COPY . .

# Собираем проект (если нужен)
RUN npm run build

# Экспонируем порт, который слушает Next.js (по умолчанию 3000)
EXPOSE 3000

# Команда запуска
CMD ["npm", "start"]
