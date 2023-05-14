# Základný obraz
FROM node:16

# Nastavenie pracovného adresára v kontajneri
WORKDIR /usr/src/app

# Kopírovanie package.json a package-lock.json
COPY package*.json ./

# Inštalácia závislostí
RUN npm install

# Kopírovanie zdrojových súborov do kontajnera
COPY . .

# Exponovanie portu 3000
EXPOSE 3000

# Spustenie aplikácie
CMD [ "node", "index.js" ]
