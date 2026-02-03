import React from "react";
import { Carousel } from "react-bootstrap";
import img1 from "../../assets/Images/Banner/bannerProductos.png";
import "../../assets/Styles/Main/Carrousel.css";

const BannerProductos = () => {
  return (
    <Carousel 
      controls={false} 
      indicators={false} 
      interval={5000} 
      fade
      pause={false}
    >
      <Carousel.Item>
        <div className="banner-container">
          <img 
            src={img1} 
            alt="Productos del Club de Ciclismo" 
            className="banner-img"
            loading="eager"
          />
          <div className="overlay" aria-hidden="true"></div>
          
          <div className="banner-text">
            {/* Usamos 'animate-fade-up' para consistencia con el CSS global */}
            <h1 className="animate-fade-up">
              Productos del Club de Ciclismo
            </h1>
          </div>
        </div>
      </Carousel.Item>
    </Carousel>
  );
};

export default BannerProductos;