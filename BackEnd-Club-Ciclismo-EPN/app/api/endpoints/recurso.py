from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

# --- Importaciones de nuestro proyecto ---
from app.db.database import get_db 
from app.models.domain.recurso import (
    Recurso, 
    InventarioComercial, 
    ActivoOperativo
)
from app.models.schema.recurso import (
    RecursoCreate, 
    RecursoRead,
    RecursoComercialCreate,
    RecursoOperativoCreate
)
# (Probablemente necesites esto para la autenticación)
# from app.core.security import get_current_user 

# --- Creación del Router ---
router = APIRouter()


# --- 1. Endpoint de CREACIÓN (El más importante) ---

@router.post(
    "/", 
    response_model=RecursoRead, 
    status_code=status.HTTP_201_CREATED
)
def crear_nuevo_recurso(
    recurso_in: RecursoCreate, 
    db: Session = Depends(get_db)
    # Descomenta esto si tu endpoint requiere autenticación (¡debería!)
    # current_user: dict = Depends(get_current_user) 
):
    """
    Crea un nuevo recurso (Comercial u Operativo).
    """
    
    print(f"Creando recurso de tipo: {type(recurso_in)}")
    recurso_data = recurso_in.dict()
    db_recurso = None

    # --- Lógica Polimórfica ---
    
    if isinstance(recurso_in, RecursoComercialCreate):
        print("Instanciando InventarioComercial")

        # !--- AQUÍ ESTÁ LA CORRECCIÓN ---!
        # 1. Sacamos el valor de 'stock_inicial' del diccionario
        stock_inicial_valor = recurso_data.pop('stock_inicial')
        
        # 2. Añadimos 'stock_actual' al diccionario con ese valor
        recurso_data['stock_actual'] = stock_inicial_valor
        # !--- FIN DE LA CORRECCIÓN ---!

        # Ahora el diccionario 'recurso_data' tiene 'stock_actual'
        # en lugar de 'stock_inicial', y SQLAlchemy será feliz.
        db_recurso = InventarioComercial(**recurso_data)
        
    elif isinstance(recurso_in, RecursoOperativoCreate):
        print("Instanciando ActivoOperativo")
        # Aquí no hay que hacer nada, los nombres ya coinciden
        db_recurso = ActivoOperativo(**recurso_data)
        
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tipo de recurso desconocido"
        )

    # --- Guardado en Base de Datos ---
    try:
        db.add(db_recurso)
        db.commit()
        db.refresh(db_recurso)
        return db_recurso
        
    except Exception as e:
        db.rollback()
        if "UNIQUE constraint failed" in str(e) or "Duplicate entry" in str(e):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Error de unicidad: Ya existe un recurso con ese SKU o Código de Activo."
            )
        print(f"❌ ERROR AL GUARDAR: {e}") # Añadido para mejor depuración
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al guardar en la base de datos: {e}"
        )


# --- 2. Endpoint de LISTAR TODOS ---

@router.get("/", response_model=List[RecursoRead])
def listar_todos_los_recursos(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
    # current_user: dict = Depends(get_current_user) # Proteger este endpoint
):
    """
    Obtiene una lista de TODOS los recursos (Comerciales y Operativos).
    """
    recursos = db.query(Recurso).offset(skip).limit(limit).all()
    return recursos


# --- 3. Endpoint de OBTENER UNO POR ID ---

@router.get("/{id_recurso}", response_model=RecursoRead)
def obtener_recurso_por_id(
    id_recurso: int,
    db: Session = Depends(get_db)
    # current_user: dict = Depends(get_current_user) # Proteger este endpoint
):
    """
    Obtiene un recurso específico por su ID.
    """
    recurso = db.query(Recurso).filter(Recurso.id_recurso == id_recurso).first()
    
    if not recurso:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recurso no encontrado"
        )
        
    return recurso


# --- 4. Endpoint de ELIMINAR ---

@router.delete("/{id_recurso}", status_code=status.HTTP_204_NO_CONTENT)
def borrar_recurso(
    id_recurso: int,
    db: Session = Depends(get_db)
    # current_user: dict = Depends(get_current_user) # Proteger este endpoint
):
    """
    Borra un recurso por su ID.
    """
    recurso = db.query(Recurso).filter(Recurso.id_recurso == id_recurso).first()
    
    if not recurso:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recurso no encontrado"
        )
    
    try:
        db.delete(recurso)
        db.commit()
        return None 
    
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al eliminar el recurso: {e}"
        )

# --- 5. (NUEVO) Endpoint de ACTUALIZACIÓN (PUT) ---

@router.put("/{id_recurso}", response_model=RecursoRead)
def actualizar_recurso(
    id_recurso: int,
    recurso_in: RecursoCreate, # Reutilizamos la Unión de 'Crear'
    db: Session = Depends(get_db)
    # current_user: dict = Depends(get_current_user) # Descomentar para proteger
):
    """
    Actualiza un recurso existente por su ID.
    El 'tipo_recurso' en el body DEBE coincidir con el de la BD.
    """
    
    # 1. Buscar el recurso existente en la BD
    db_recurso = db.query(Recurso).filter(Recurso.id_recurso == id_recurso).first()
    
    if not db_recurso:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recurso no encontrado"
        )
        
    # 2. Validar que no se intente cambiar el tipo
    if db_recurso.tipo_recurso != recurso_in.tipo_recurso:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No se puede cambiar el tipo de un recurso. (De {db_recurso.tipo_recurso} a {recurso_in.tipo_recurso})"
        )

    # 3. Obtener los datos del formulario Pydantic
    # Usamos exclude_unset=True para que funcione como un 'PATCH'
    # y solo actualice los campos que SÍ vienen en el JSON.
    update_data = recurso_in.dict(exclude_unset=True)

    print(f"🔄 Actualizando recurso {id_recurso}. Datos recibidos:", update_data)

    # 4. Manejar el renombramiento de 'stock'
    if 'stock_inicial' in update_data and isinstance(db_recurso, InventarioComercial):
        # Renombramos la clave para que coincida con la BD
        update_data['stock_actual'] = update_data.pop('stock_inicial')
    
    # 5. Aplicar las actualizaciones al objeto de la BD
    for key, value in update_data.items():
        # Validamos que el modelo de BD realmente tenga ese campo
        if hasattr(db_recurso, key):
            setattr(db_recurso, key, value)
        else:
            print(f"⚠️ Advertencia: Clave '{key}' en payload pero no en modelo BD.")

    # 6. Guardar en la Base de Datos
    try:
        db.add(db_recurso)
        db.commit()
        db.refresh(db_recurso)
        return db_recurso
        
    except Exception as e:
        db.rollback()
        if "UNIQUE constraint failed" in str(e) or "Duplicate entry" in str(e):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Error de unicidad: El SKU o Código de Activo ya existe."
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al actualizar en la base de datos: {e}"
        )