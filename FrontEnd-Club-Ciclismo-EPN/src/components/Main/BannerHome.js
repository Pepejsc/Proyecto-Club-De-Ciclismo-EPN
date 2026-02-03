import React from "react";
import { Carousel } from "react-bootstrap";
import "../../assets/Styles/Main/Carrousel.css";
import img1 from "../../assets/Images/Banner/bannerHome.jpeg";

const BannerHome = () => {
  return (
    <Carousel controls={false} indicators={false} interval={5000} fade>
      <Carousel.Item>
        <div className="banner-container">
          <img src={img1} alt="Banner" className="banner-img" />
          <div className="overlay"></div>
          <div className="banner-text">
            <h1 className="fade-in">Bienvenidos al Club de Ciclismo EPN</h1>
          </div>
        </div>
      </Carousel.Item>
    </Carousel>
  );
};

export default BannerHome;