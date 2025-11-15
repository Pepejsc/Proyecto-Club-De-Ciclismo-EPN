import React from 'react';
import PublicLayout from '../../components/Main/PublicLayout';
import ProductosCarrusel from '../../components/Main/ProductosCarrusel';
import '../../assets/Styles/Main/VerProducto.css';

import productoPrincipal from '../../assets/Images/Productos/producto5.png';

const VerProducto = () => {
  return (
    <PublicLayout>
      <div className="producto-page">
        {/* Sección principal del producto */}
        <div className="producto-main">
          <div className="producto-imagen">
            <img src={productoPrincipal} alt="Medias Team EPN" />
          </div>

          <div className="producto-info">
            <h1>MEDIAS</h1>
            <p>
              Encarnando la pasión y resistencia del Club de Ciclismo de la EPN,
              estas medias son más que un simple accesorio con un estandarte del
              espíritu de equipo. Su diseño fusiona el estilo atlético clásico con
              una identidad audaz, donde las dos franjas rojas sobre el azul marino
              profundo simbolizan la energía y la determinación en la carretera.
              Confeccionadas para ofrecer comodidad y soporte en cada pedaleo, la
              inscripción "TEAM EPN" se convierte en una declaración de orgullo y
              pertenencia, uniendo a cada ciclista bajo los mismos colores en cada
              ruta y competencia.
            </p>

            <div className="producto-precio-talla">
              <span className="precio">$10.00</span>
              <span className="talla">Tallas 10-13</span>
              <span className="guia-tallas">Guía de Tallas</span>
            </div>

            <button className="btn-comprar">COMPRAR</button>
          </div>
        </div>

        <div className="auspiciantes-header">
          <div className="ausp-title-bar">
            <div className="line line-left"></div>
            <h3 className="ausp-title">
              <span className="black">MÁS</span>{" "}
              <span className="blue">PRODUCTOS</span>
            </h3>
            <div className="line line-right"></div>
          </div>
        </div>
        <ProductosCarrusel />
      </div>
    </PublicLayout>
  );
};

export default VerProducto;