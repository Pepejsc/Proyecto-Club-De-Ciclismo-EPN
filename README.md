<p align="center">
  <img src="https://github.com/Pepejsc/Proyecto-Club-De-Ciclismo-EPN/blob/main/FrontEnd-Club-Ciclismo-EPN/src/assets/Images/Icons/ClubCiclismo.png" alt="Logo Club Ciclismo EPN" width="150">
</p>

#  Sistema Web de Gestión para el Club de Ciclismo EPN 
Plataforma integral desarrollada para administrar las operaciones financieras, operativas y administrativas del Club de Ciclismo de la Escuela Politécnica Nacional (EPN). 

Este sistema centraliza la información y facilita la toma de decisiones estratégicas a través de módulos especializados.

## Características y Módulos Principales

* **Módulo Financiero:** Registro y monitoreo de ingresos y egresos, reportes en tiempo real y balances de caja.
* **Gestión de Ventas:** Control histórico del flujo de caja por venta de productos o servicios del club.
* **Gestión de Membresías (Carnet Digital):** Administración del estado de los miembros, cálculo automático de trayectoria (niveles) y generación de credenciales digitales con validación rápida.
* **Inventario y Recursos:** Trazabilidad de bicicletas, herramientas y equipos asignados a miembros y entrenadores.
* **Planificación de Eventos:** Organización de rutas, entrenamientos y competencias con control de asistencia.

## Tecnologías Utilizadas

**Frontend:**
* React.js
* Node.js (v22.17.1)
* CSS Modules

**Backend:**
* Python (v3.13.12)
* FastAPI
* SQLAlchemy (ORM)

**Base de Datos & Infraestructura:**
* MySQL
* Google Maps API (Geolocalización de rutas)
* Telegram Bot API (Notificaciones)

## Estructura del Proyecto

El proyecto está dividido en dos repositorios/carpetas principales:

```bash
PROYECTO-CLUB-CICLISMO-EPN/
├── BackEnd-Club-Ciclismo-EPN/   # API RESTful con FastAPI
├── FrontEnd-Club-Ciclismo-EPN/  # Interfaz de usuario con React
├── LICENSE
└── README.md
```
### Requisitos Previos
Asegúrate de tener instalado en tu máquina local:

Python 3.13+

Node.js 22+

MySQL Server (ejecutándose en el puerto 3306)

## Instalación y Ejecución Local
### 1. Configuración de la Base de Datos
Crea una base de datos en tu servidor MySQL local llamada app_ciclismo_epn.

### 2. Configuración del Backend (FastAPI)
Abre una terminal y navega a la carpeta del backend:

```Bash
cd BackEnd-Club-Ciclismo-EPN
```
Crea y activa el entorno virtual:

```Bash
python -m venv venv

# En Windows:
venv\Scripts\activate

# En Mac/Linux:
source venv/bin/activate
```
Instala las dependencias (asegúrate de tener un archivo requirements.txt):

```Bash
pip install -r requirements.txt
```
Crea un archivo .env en la raíz del backend usando el .env.example proporcionado (ver sección de Variables de Entorno) y ejecuta el servidor:

```Bash
uvicorn app.main:app --reload
```
El servidor backend estará disponible en http://localhost:8000

### 3. Configuración del Frontend (React)
Abre otra terminal y navega a la carpeta del frontend:

```Bash
cd FrontEnd-Club-Ciclismo-EPN
```
Instala las dependencias de Node:

```Bash
npm install
```
Configura tus variables de entorno en el frontend y arranca la aplicación:

```Bash
npm start
```
La aplicación web estará disponible en http://localhost:3000

Variables de Entorno (.env.example)
Para que el sistema funcione correctamente, debes crear un archivo .env en el backend y otro en el frontend. Nunca subas tus claves reales al repositorio.

Backend (BackEnd-Club-Ciclismo-EPN/.env):

```bash
# Seguridad
SECRET_KEY=tu_secret_key_generado_aqui
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
AES_KEY=tu_clave_aes_aqui

# Base de Datos
DATABASE_USER=root
DATABASE_PASSWORD=tu_password_mysql
DATABASE_HOST=localhost:3306
DATABASE_NAME=app_ciclismo_epn

# Correo (SMTP)
MAIL_USERNAME=tu_correo@gmail.com
MAIL_PASSWORD=tu_contraseña_de_aplicacion
MAIL_ADMIN=correo_admin@gmail.com

# Notificaciones (Telegram)
TELEGRAM_BOT_TOKEN="tu_token_de_telegram"
TELEGRAM_CHAT_ID="tu_chat_id"
Frontend (FrontEnd-Club-Ciclismo-EPN/.env):

REACT_APP_API_URL=http://localhost:8000
REACT_APP_GOOGLE_MAPS_API_KEY=tu_api_key_de_google_maps_aqui
```
