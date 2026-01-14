import React from 'react';
import "@fortawesome/fontawesome-free/css/all.min.css";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ResetPasswordRequest from './pages/Auth/SendEmail';
import Home from './pages/Main/Home';
import Register from './pages/Auth/Register';
import VerifyCode from './pages/Auth/VerifyCode';
import Login from './pages/Auth/Login';
import ResetPasswordForm from './pages/Auth/ResetPassword';
import Unauthorized from './pages/Auth/Unauthorized';
import './index.css';
import AdminRoutes from './routes/AdminRoutes';
import AboutUs from "./pages/Main/QuienesSomos"
import PrivateRoute from './routes/PrivateRoute';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { SidebarProvider } from "./context/Admin/SidebarContext";
import { UserProvider } from './context/Auth/UserContext';
import UserRoutes from './routes/UserRoutes';
import Events from './pages/Main/Eventos';
import Products from './pages/Main/Productos';
import Contacto from './pages/Main/Contacto';
import Auspiciantes from './pages/Main/Auspiciantes';
import VerProducto from './pages/Main/VerProducto';
import VerifyStudentEmail from './pages/Auth/VerifyStudentEmail';
import { CartProvider } from './pages/Main/CarContext';


const App = () => {
  return (
    <Router>
      <ToastContainer position="top-center" autoClose={3000} theme="colored" toastClassName="custom-toast" />

      <SidebarProvider>
        <UserProvider>
          
          {/* Envolvemos las rutas con el CartProvider */}
          <CartProvider> 
            <Routes>
              {/* Rutas públicas */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/send-email" element={<ResetPasswordRequest />} />
              <Route path="/verify-code" element={<VerifyCode />} />
              <Route path="/reset-password" element={<ResetPasswordForm />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route path="/quienes-somos" element={<AboutUs/>}/>
              <Route path="/eventos" element={<Events/>}/>
              <Route path="/productos" element={<Products/>}/>
              <Route path="/auspiciantes" element={<Auspiciantes/>}/>
              <Route path="/contacto" element={<Contacto/>}/>
              <Route path="/verify-student-email" element={<VerifyStudentEmail />} />
              
              {/* Ruta dinámica de producto */}
              <Route path="/producto/:id" element={<VerProducto />} />
              
              {/* Rutas protegidas */}
              <Route
                path="/admin/*"
                element={
                  <PrivateRoute allowedRoles={["admin"]}>
                    <AdminRoutes />
                  </PrivateRoute>
                }
              />

              <Route
                path="/user/*"
                element={
                  <PrivateRoute allowedRoles={["normal"]}>
                    <UserRoutes />
                  </PrivateRoute>
                }
              />
            </Routes>
          </CartProvider>
          
        </UserProvider>
      </SidebarProvider>
    </Router>
  );
};

export default App;