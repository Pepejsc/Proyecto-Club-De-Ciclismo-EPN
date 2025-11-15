# Etapa 1: Construcción de la aplicación
FROM node:18-alpine AS builder

# Establece el directorio de trabajo en el contenedor
WORKDIR /app

# Copia los archivos necesarios para instalar las dependencias
COPY package.json package-lock.json ./

# Instala las dependencias
RUN npm install

# Copia el resto de los archivos al contenedor
COPY . .

# Construye la aplicación para producción
RUN npm run build

# Etapa 2: Servidor Nginx para producción
FROM nginx:alpine

# Copia los archivos de construcción al directorio predeterminado de Nginx
COPY --from=builder /app/build /usr/share/nginx/html

# Copia la configuración personalizada de Nginx desde la carpeta docker
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Expone el puerto para servir la aplicación
EXPOSE 80

# Comando por defecto para iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]
