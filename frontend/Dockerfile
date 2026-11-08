# Этап 1: Сборка React-приложения
FROM node:20-alpine AS builder

WORKDIR /app

# Копируем зависимости и устанавливаем их
COPY package*.json ./
RUN npm ci

# Копируем исходный код
COPY . .

# Передаем базовый URL для API (относительный путь для Nginx)
ARG VITE_API_URL=/api/v1
ENV VITE_API_URL=$VITE_API_URL

# Собираем проект
RUN npm run build

# Этап 2: Раздача статики через Nginx
FROM nginx:alpine

# Копируем собранные файлы из первого этапа
COPY --from=builder /app/dist /usr/share/nginx/html

# Копируем конфиг Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
