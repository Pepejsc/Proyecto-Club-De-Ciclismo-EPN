import React from 'react';
import ReactDOM from 'react-dom/client';
import App from "./App";
import GoogleMapsProvider from './GoogleMapsProvider';
import 'react-phone-input-2/lib/style.css';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <GoogleMapsProvider>
      <App />
    </GoogleMapsProvider>
  </React.StrictMode>
);
