import React from "react";
import PublicLayout from "../../components/Main/PublicLayout";
import BannerProductos from "../../components/Main/BannerProducts";
import ProductosCarrusel from "../../components/Main/ProductosCarrusel";
import MembresiasEstaticas from "../../components/Main/Membresías";

const Products = () => {
  return (
    <PublicLayout>
      <BannerProductos />
      <div className="auspiciantes-header">
        <div className="ausp-title-bar">
          <div className="line line-left"></div>
          <h3 className="ausp-title">
            <span className="black">NUESTROS</span>{" "}
            <span className="blue">PRODUCTOS</span>
          </h3>
          <div className="line line-right"></div>
        </div>
      </div>
      <ProductosCarrusel />
      <div className="auspiciantes-header">
        <div className="ausp-title-bar">
          <div className="line line-left"></div>
          <h3 className="ausp-title">
            <span className="black">NUESTRAS</span>{" "}
            <span className="blue">MEMBRESÍAS</span>
          </h3>
          <div className="line line-right"></div>
        </div>
      </div>
      <MembresiasEstaticas />
    </PublicLayout>
  );
};

export default Products;
