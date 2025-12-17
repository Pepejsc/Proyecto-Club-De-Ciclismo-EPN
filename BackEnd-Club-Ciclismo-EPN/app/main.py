import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from fastapi.staticfiles import StaticFiles
from app.api.endpoints import auth, event, route, event_participant, notification, memberships, sponsors, documents, recurso, ventas, finanzas
from app.core.init_data import create_admin_user
from app.db.init_db import init_db
from app.services.scheduler_notifications import start_scheduler

app = FastAPI()

# --- CONFIGURACIÓN BLINDADA DE ARCHIVOS ESTÁTICOS ---
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")

os.makedirs(os.path.join(UPLOADS_DIR, "profiles"), exist_ok=True)
os.makedirs(os.path.join(UPLOADS_DIR, "recursos"), exist_ok=True)

print(f"📂 Sirviendo archivos estáticos desde: {UPLOADS_DIR}")

app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")
# ----------------------------------------------------

# 🟢 Permitir peticiones CORS
origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 📦 Incluir rutas
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(event.router, prefix="/event", tags=["event"])
app.include_router(route.router, prefix="/route", tags=["route"])
app.include_router(event_participant.router, prefix="/participants", tags=["participants"])
app.include_router(notification.router, prefix="/notifications", tags=["notifications"])
app.include_router(memberships.router, prefix="/memberships", tags=["memberships"])
app.include_router(sponsors.router, tags=["sponsors"])
app.include_router(documents.router, prefix="/api", tags=["documents"])
app.include_router(recurso.router, prefix="/recursos", tags=["recursos"])
app.include_router(finanzas.router, prefix="/finanzas", tags=["finanzas"])

# 🔥 2. REGISTRAR EL ROUTER DE VENTAS:
app.include_router(ventas.router, prefix="/ventas", tags=["ventas"])


# ⚙️ Inicializar base de datos y crear admin
@app.on_event("startup")
def on_startup():
    init_db()
    create_admin_user()
    start_scheduler()

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title="Club de Ciclismo EPN",
        version="1.0.0",
        description="**Trabajo de Titulación Aplicativo Web para el Club de Ciclismo EPN**",
        routes=app.routes,
    )
    openapi_schema["components"]["securitySchemes"] = {
        "OAuth2PasswordBearer": {
            "type": "oauth2",
            "flows": {
                "password": {
                    "tokenUrl": "/auth/token",
                    "scopes": {},
                }
            },
        }
    }
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi