import React, { useState } from 'react';
import'./Navbar.css';
import "bootstrap/dist/css/bootstrap.min.css";
import Button from 'react-bootstrap/Button';

function Navbar(props) {
  const [modalShowManual, setModalShowManual] = useState(false);
  const [modalShowJSON, setModalShowJSON] = useState(false);
    
  return (
    <>
    <div id="container">
      <div >
   

      <img src="FieldBoss_logo.png" alt="logo" style={{position: "relative", top: "7px", width: "35px", left: "12px"}}/>
      <p><span style={{position: "relative", fontSize: 30, fontFamily: "serif", top: "-33px", left: "56px"}}>IoToken View</span></p>
      <p><span style={{position: "absolute", fontSize: 20, fontFamily: "serif", top: "12px", left: "260px"}}>Tokenized Devices in a Smart Building IoT Sensor Network</span></p>
      </div>
    </div>
   
    </>
  );
}

export default Navbar;