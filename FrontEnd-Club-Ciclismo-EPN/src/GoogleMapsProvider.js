import React from "react";
import { useLoadScript } from "@react-google-maps/api";

const LIBRARIES = ["places"];

const GoogleMapsProvider = ({ children }) => {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  });

  if (!isLoaded) return <p>Cargando mapas...</p>;

  return <>{children}</>;
};

export default GoogleMapsProvider;
