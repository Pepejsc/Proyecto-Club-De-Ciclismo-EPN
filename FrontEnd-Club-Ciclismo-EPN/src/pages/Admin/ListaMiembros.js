import React, { useEffect, useState } from "react";
import { fetchUsers } from "../../services/userService";
import { getFullImageUrl, getToken } from "../../services/authService";
import { toast } from "react-toastify";
import "../../assets/Styles/Admin/ListaMiembros.css";
import defaultProfile from "../../assets/Images/Icons/defaultProfile.png";

const API_URL = "http://127.0.0.1:8000";

const ListaMiembros = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    try {
      const data = await fetchUsers();
      const members = data.filter(u => u.role === 'Normal' || u.role === 'NORMAL');
      setUsuarios(members);
    } catch (error) {
      console.error("Error cargando usuarios:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/memberships/${userId}/toggle-status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error("Error al cambiar estado");
      
      toast.success("Estado actualizado");
      loadUsers(); 
    } catch (error) {
      toast.error("No se pudo cambiar el estado");
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div className="miembros-container">
      <div className="miembros-header">
        <h2>Lista de Miembros</h2>
      </div>

      <table className="tabla-miembros">
        <thead>
          <tr>
            <th>Usuario</th>
            <th>Contacto</th>
            <th>Tipo Membresía</th>
            <th>Estado</th>
            <th>Vigencia</th>
            <th style={{textAlign: 'center'}}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
             <tr><td colSpan="6" style={{textAlign:'center', padding:'30px', color:'#666'}}>Cargando miembros...</td></tr>
          ) : usuarios.map((u) => {
            const mem = u.membership;
            const hasMembership = !!mem;
            const isActive = mem?.status === 'ACTIVE';

            return (
              <tr key={u.id}>
                {/* 1. Usuario */}
                <td data-label="Usuario">
                  <div className="user-cell">
                    <img 
                      src={u.person?.profile_picture ? getFullImageUrl(u.person.profile_picture) : defaultProfile} 
                      alt="Avatar" className="user-thumb"
                      onError={(e) => e.target.src = defaultProfile}
                    />
                    <div className="user-info-text">
                      <strong>{u.person?.first_name} {u.person?.last_name}</strong>
                      <small>{u.person?.city}</small>
                    </div>
                  </div>
                </td>

                {/* 2. Contacto */}
                <td data-label="Contacto">
                   <div className="user-info-text">
                      <span>{u.person?.phone_number}</span>
                      <small>{u.email}</small>
                   </div>
                </td>

                {/* 3. Tipo Membresía */}
                <td data-label="Membresía">
                   {hasMembership ? 
                      <span style={{fontWeight:'700', color:'#238CBC', fontSize:'0.9rem'}}>{mem.membership_type}</span> 
                      : <span style={{fontStyle:'italic', color:'#aaa'}}>--</span>
                   }
                </td>

                {/* 4. Estado Badge */}
                <td data-label="Estado">
                  {hasMembership ? (
                    <span className={`status-badge status-${mem.status.toLowerCase()}`}>
                      {mem.status}
                    </span>
                  ) : (
                    <span className="status-badge status-none">N/A</span>
                  )}
                </td>

                {/* 5. Vigencia */}
                <td data-label="Vigencia">
                  {hasMembership ? (
                    <div className="user-info-text">
                      <small>Inicio: {formatDate(mem.start_date)}</small>
                      <strong style={{fontSize:'0.85rem', color: isActive ? '#065f46' : '#991b1b'}}>
                        Fin: {formatDate(mem.end_date)}
                      </strong>
                    </div>
                  ) : "-"}
                </td>

                {/* 6. Switch */}
                <td data-label="Acción" style={{textAlign: 'center'}}>
                  {hasMembership ? (
                    <div className="switch-container">
                        <label className="switch">
                          <input 
                            type="checkbox" 
                            checked={isActive} 
                            onChange={() => handleToggleStatus(u.id, mem.status)}
                          />
                          <span className="slider"></span>
                        </label>
                        <span className="switch-label" style={{color: isActive ? '#238CBC' : '#999'}}>
                            {isActive ? 'Activo' : 'Inactivo'}
                        </span>
                    </div>
                  ) : (
                    <small style={{color:'#aaa'}}>Sin Acción</small>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ListaMiembros;