import React, { useEffect, useState } from "react";
import { fetchEvents, deleteEvent } from "../../services/eventService";
import { getRoutes } from "../../services/routeService";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import "../../assets/Styles/Admin/ListaEventos.css";
import EditarEvento from "./EditarEvento";
import MapaPopup from "../../components/Normal/MapaPoup";

const ListaEventos = () => {
    const [eventos, setEventos] = useState([]);
    const [routes, setRoutes] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [mostrarMapa, setMostrarMapa] = useState(false);
    const [coordenadasPunto, setCoordenadasPunto] = useState(null);


    useEffect(() => {
        cargarEventos();
        cargarRutas();
    }, []);

    const cargarEventos = async () => {
        try {
            const data = await fetchEvents();
            setEventos(data);
        } catch (error) {
            console.error("Error al cargar eventos:", error);
            toast.error(error.message || "Error al cargar los eventos");
        }
    };

    const cargarRutas = async () => {
        try {
            const data = await getRoutes();
            setRoutes(data);
        } catch (error) {
            console.error("Error al cargar rutas:", error);
            toast.error(error.message || "Error al cargar las rutas");
        }
    };

    const handleDelete = async (eventId) => {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: "Se borrará este evento permanentemente",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, borrar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await deleteEvent(eventId);
                toast.success("Evento eliminado correctamente");
                setEventos(prev => prev.filter(e => e.id !== eventId));
            } catch (error) {
                toast.error("Error al eliminar el evento");
            }
        }
    };

    const handleEdit = (evento) => {
        setSelectedEvent(evento);
        setModalVisible(true);
    };

    const handleVerPunto = async (direccion) => {
        try {
            const geocoder = new window.google.maps.Geocoder();
            geocoder.geocode({ address: direccion }, (results, status) => {
                if (status === "OK" && results[0]) {
                    const location = results[0].geometry.location;
                    setCoordenadasPunto({
                        lat: location.lat(),
                        lng: location.lng()
                    });
                    setMostrarMapa(true);
                } else {
                    toast.error("No se pudo encontrar la ubicación.");
                }
            });
        } catch (error) {
            console.error("Error al geocodificar dirección:", error);
            toast.error("Error al geolocalizar el punto.");
        }
    };

    return (
        <div className="eventos-container">
            <h2>Lista de Eventos</h2>
            <table className="tabla-eventos">
                <thead>
                    <tr>
                        <th>Tipo de Evento</th>
                        <th>Ruta Asociada</th>
                        <th>Fecha del Evento</th>
                        <th>Nivel</th>
                        <th>Modalidad</th>
                        <th>Disponibilidad</th>
                        <th className="punto-encuentro">Punto de Encuentro</th>

                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {eventos.map((evento) => (
                        <tr key={evento.id}>
                            <td data-label="Tipo">{evento.event_type}</td>
                            <td data-label="Ruta">
                                {evento.route_name || "Sin ruta"}
                            </td>

                            <td data-label="Fecha">
                                {new Date(evento.creation_date).toLocaleString("es-EC", {
                                    dateStyle: "long",
                                    timeStyle: "short",
                                    hour12: false
                                })}
                            </td>


                            <td data-label="Nivel">{evento.event_level}</td>
                            <td data-label="Modalidad">{evento.event_mode}</td>
                            <td data-label="Disponibilidad">
                                {evento.is_available === true && <span className="disponible">Disponible</span>}
                                {evento.is_available === false && <span className="no-disponible">No disponible</span>}
                            </td>
                            <td className="punto-encuentro" data-label="Encuentro">
                                <button className="btn-ver-punto" onClick={() => handleVerPunto(evento.meeting_point)}>
                                    <i className="fa-solid fa-location-dot"></i>&nbsp;Ver punto de encuentro
                                </button>


                            </td>
                            <td data-label="Acciones">
                                <button
                                    className="btn-action editar"
                                    title="Editar evento"
                                    onClick={() => handleEdit(evento)}
                                >
                                    <i className="fas fa-pen-to-square"></i>
                                </button>
                                <button
                                    className="btn-action eliminar"
                                    title="Eliminar evento"
                                    onClick={() => handleDelete(evento.id)}
                                >
                                    <i className="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {modalVisible && selectedEvent && (
                <EditarEvento
                    isOpen={modalVisible}
                    onClose={() => setModalVisible(false)}
                    eventData={selectedEvent}
                    onEventUpdated={cargarEventos}
                    routes={routes}
                />

            )}
            {mostrarMapa && coordenadasPunto && (
                <MapaPopup
                    marker={coordenadasPunto}
                    onClose={() => setMostrarMapa(false)}
                />
            )}

        </div>
    );
};

export default ListaEventos;
