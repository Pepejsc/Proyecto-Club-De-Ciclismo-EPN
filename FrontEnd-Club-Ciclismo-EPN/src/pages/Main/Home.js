import React from 'react';
import PublicLayout from '../../components/Main/PublicLayout';
import BannerHome from "../../components/Main/BannerHome";
import AuspiciantesCarrusel from '../../components/Main/AuspiciantesCarrusel';
import '../../assets/Styles/Main/Bienvenida.css';
import NuestrosLogrosCarrusel from '../../components/Main/Logros';

const Home = () => {
  return (
    <PublicLayout>
      <BannerHome />
      <div className="auspiciantes-header">
        <div className="ausp-title-bar">
          <div className="line line-left"></div>
          <h3 className="ausp-title">
            <span className="black">NUESTROS</span>{" "}
            <span className="blue">LOGROS</span>
          </h3>
          <div className="line line-right"></div>
        </div>
      </div>
      <NuestrosLogrosCarrusel/>
      <div className="auspiciantes-header">
        <div className="ausp-title-bar">
          <div className="line line-left"></div>
          <h3 className="ausp-title">
            <span className="black">NUESTROS</span>{" "}
            <span className="blue">AUSPICIANTES</span>
          </h3>
          <div className="line line-right"></div>
        </div>
      </div>
      <AuspiciantesCarrusel />
    </PublicLayout>
  );
};

export default Home;
