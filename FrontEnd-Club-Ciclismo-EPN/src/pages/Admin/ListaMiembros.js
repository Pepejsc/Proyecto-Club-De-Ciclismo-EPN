import React, { useEffect, useState } from "react";
import { deleteUser, fetchUsers, updateUserRole } from "../../services/userService";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import "../../assets/Styles/Admin/ListaUsuarios.css";
import { logout, getUserData } from "../../services/authService";
import { useNavigate } from 'react-router-dom';
import { useUser } from "../../context/Auth/UserContext";

const ListaMiembros = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState("Normal");
  const navigate = useNavigate();
  const { setUserData } = useUser();


  useEffect(() => {
    fetchUsers()
      .then((data) => setUsuarios(data))
      .catch((error) => console.error("Error al cargar usuarios:", error));
  }, []);

  const handleDelete = async (userId) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: "Se borrará de forma permanente",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, borrar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await deleteUser(userId);
        toast.success("Usuario eliminado correctamente");
        setUsuarios(prev => prev.filter(u => u.id !== userId));
      } catch (error) {
        toast.error("Error al eliminar el usuario");
      }
    }
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setModalVisible(true);
  };

  const handleRoleUpdate = async () => {
    try {
      const currentUser = getUserData(); 
  
      const esMismoUsuario = selectedUser.id === currentUser?.id;
      const rolCambiado = newRole !== currentUser?.role;
  
      await updateUserRole(selectedUser.id, newRole);
      toast.success("Rol actualizado correctamente");
  
      setModalVisible(false);
  
      if (esMismoUsuario && rolCambiado) {
        toast.info("Tu rol ha cambiado. Cerrando sesión...");
        logout();
        setUserData(null);
        navigate("/login");
        return; 
      }
  
      const updated = await fetchUsers();
      setUsuarios(updated);
  
    } catch (error) {
      console.error("Error al actualizar el rol:", error);
      toast.error("Error al actualizar el rol");
    }
  };
  


  return (
    <div className="usuarios-container">
      <h2>Lista de Miembros</h2>
      <table className="tabla-usuarios">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Cédula</th>
            <th>Fecha de nacimiento</th>
            <th>Correo electrónico</th>
            <th>Teléfono</th>
            <th>Fecha de inscripción</th>
            <th>Dirección</th>
            <th>Estado inscripción</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((u) => (
            <tr key={u.id}>
              <td data-label="Nombre">{u.person.first_name}</td>
              <td data-label="Apellido">{u.person.last_name}</td>
              <td data-label="Teléfono">{u.person.phone_number}</td>
              <td data-label="Ciudad">{u.person.city}</td>
              <td data-label="Barrio">{u.person.neighborhood}</td>
              <td data-label="Tipo de Sangre">{u.person.blood_type}</td>
              <td data-label="Nivel">{u.person.skill_level}</td>
              <td data-label="Rol">{u.role}</td>
              <td data-label="Acciones">
                <button
                  className="btn-action editar"
                  title="Editar usuario"
                  onClick={() => handleEdit(u)}
                >
                  <i className="fas fa-pen-to-square"></i>
                </button>
                <button
                  className="btn-action eliminar"
                  title="Eliminar usuario"
                  onClick={() => handleDelete(u.id)}
                >
                  <i className="fas fa-trash"></i>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {modalVisible && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Actualizar Rol</h3>
            <p><strong>{selectedUser.person.first_name} {selectedUser.person.last_name}</strong></p>

            <select value={newRole} onChange={(e) => setNewRole(e.target.value)}>
              <option value="Admin">Admin</option>
              <option value="Normal">Normal</option>
            </select>

            <div className="modal-buttons">
              <button onClick={handleRoleUpdate} className="btn-action editar">Guardar</button>
              <button onClick={() => setModalVisible(false)} className="btn-action eliminar">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListaMiembros;