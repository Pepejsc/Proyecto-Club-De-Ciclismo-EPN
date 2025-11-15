import React from "react";
import Header from "./Header";
import Footer from "./Footer";
import "../../index.css"; 

const PublicLayout = ({ children }) => {
  return (
    <>
      <Header />
      <main className="public-main">{children}</main>
      <Footer />
    </>
  );
};

export default PublicLayout;
