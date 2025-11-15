import React, { useEffect, useState } from "react";
import { fetchEvents, fetchParticipantsByEvent } from "../../services/eventService";
import "../../assets/Styles/Admin/ListaParticipantes.css";

const ListaParticipantes = () => {
    const [events, setEvents] = useState([]);
    const [selectedEventId, setSelectedEventId] = useState("");
    const [participants, setParticipants] = useState([]);

    useEffect(() => {
        const loadEvents = async () => {
            try {
                const data = await fetchEvents();
                setEvents(data);

                if (data.length > 0) {
                    setSelectedEventId(data[0].id);
                }
            } catch (error) {
                console.error("Error al cargar eventos:", error);
            }
        };

        loadEvents();
    }, []);


    useEffect(() => {
        const loadParticipants = async () => {
            if (!selectedEventId) {
                setParticipants([]);
                return;
            }

            try {
                const data = await fetchParticipantsByEvent(selectedEventId);
                setParticipants(data);
            } catch (error) {
                console.error("Error al cargar participantes:", error);
            }
        };

        loadParticipants();
    }, [selectedEventId]);


    return (
        <div className="participantes-container">
            <h2>Lista de participantes</h2>

            <div className="event-select">
                <label>Selecciona un evento:</label>
                <select
                    className={`custom-select ${selectedEventId ? 'selected' : ''}`}
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                >
                    {events.map((event) => (
                        <option key={event.id} value={event.id}>
                            {event.event_type} - {event.route_name}
                        </option>
                    ))}
                </select>

            </div>

            {participants.length > 0 && (
                <table className="participantes-table">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Teléfono</th>
                            <th>Barrio</th>
                            <th>Tipo de Sangre</th>
                            <th>Habilidad</th>
                            <th>Fecha Registro</th>
                        </tr>
                    </thead>
                    <tbody>
                        {participants.map((p) => (
                            <tr key={p.id}>
                                <td data-label="Nombre">{p.user.person.first_name} {p.user.person.last_name}</td>
                                <td data-label="Teléfono">{p.user.person.phone_number}</td>
                                <td data-label="Barrio">{p.user.person.neighborhood}</td>
                                <td data-label="Tipo de Sangre">{p.user.person.blood_type}</td>
                                <td data-label="Habilidad">{p.user.person.skill_level}</td>
                                <td data-label="Fecha Registro">
                                    {new Date(p.registered_at).toLocaleString('es-EC', {
                                        dateStyle: 'long',
                                        timeStyle: 'short',
                                        hour12: false
                                    })}
                                </td>
                            </tr>
                        ))}
                    </tbody>

                </table>
            )}

            {selectedEventId && participants.length === 0 && (
                <div className="mensaje-sin-participantes">
                    No hay participantes registrados para este evento aún.
                </div>
            )}

        </div>
    );
};

export default ListaParticipantes;
