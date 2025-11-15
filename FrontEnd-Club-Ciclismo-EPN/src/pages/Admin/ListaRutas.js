import React, { useEffect, useState } from "react";
import { getRoutes, deleteRoute } from "../../services/routeService";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import "../../assets/Styles/Admin/ListaRutas.css";
import MapaRutaEvento from "../../components/Main/MapaRutaEvento";


const ListaRutas = () => {
  const [rutas, setRutas] = useState([]);
  const [mostrarMapa, setMostrarMapa] = useState(false);
  const [puntoInicio, setPuntoInicio] = useState(null);
  const [puntoFin, setPuntoFin] = useState(null);

  useEffect(() => {
    cargarRutas();
  }, []);

  const cargarRutas = async () => {
    try {
      const data = await getRoutes();
      setRutas(data);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (routeId) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: "Se borrará esta ruta permanentemente",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, borrar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await deleteRoute(routeId);
        toast.success("Ruta eliminada correctamente");
        setRutas(prev => prev.filter(r => r.id !== routeId));
      } catch (error) {
        toast.error("No se puede eliminar la ruta porque está asociada a uno o más eventos.");
      }
    }
  };
  const geocodeAddress = (address) => {
    const geocoder = new window.google.maps.Geocoder();

    return new Promise((resolve, reject) => {
      geocoder.geocode({ address }, (results, status) => {
        if (status === "OK" && results[0]) {
          const location = results[0].geometry.location;
          resolve({ lat: location.lat(), lng: location.lng() });
        } else {
          reject("No se pudo obtener coordenadas de: " + address);
        }
      });
    });
  };

  const handleVerRuta = async (start, end) => {
    try {
      const startCoords = await geocodeAddress(start);
      const endCoords = await geocodeAddress(end);
      setPuntoInicio(startCoords);
      setPuntoFin(endCoords);
      setMostrarMapa(true);
    } catch (error) {
      toast.error(error);
    }
  };




  return (
    <div className="rutas-container">
      <h2>Lista de Rutas</h2>
      <table className="tabla-rutas">
        <thead>
          <tr>
            <th>Nombre de la ruta</th>
            <th>Punto de Inicio</th>
            <th>Punto de Fin</th>
            <th>Duración (min)</th>
            <th>Ruta del evento </th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {rutas.map((ruta) => (
            <tr key={ruta.id}>
              <td data-label="Nombre de la ruta">{ruta.name}</td>
              <td className="puntos" data-label="Punto de Inicio">{ruta.start_point}</td>
              <td className="puntos" data-label="Punto de Fin">{ruta.end_point}</td>
              <td data-label="Duración (min)">{ruta.duration}</td>
              <td data-label="Ruta del evento">
                <button
                  className="btn-ver-ruta-admin"
                  onClick={() => handleVerRuta(ruta.start_point, ruta.end_point)}
                >
                  <i className="fas fa-route"></i> Ver ruta
                </button>
              </td>

              <td data-label="Acciones">
                <button
                  className="btn-action eliminar"
                  title="Eliminar ruta"
                  onClick={() => handleDelete(ruta.id)}
                >
                  <i className="fas fa-trash"></i>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {mostrarMapa && (
        <MapaRutaEvento
          startPoint={puntoInicio}
          endPoint={puntoFin}
          visible={mostrarMapa}
          onClose={() => setMostrarMapa(false)}
        />
      )}

    </div>
  );

};

export default ListaRutas;
