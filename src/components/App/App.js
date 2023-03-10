import React from "react";
import Mapper from '../Mapper/Mapper';
import Navbar from '../Navbar/Navbar';
import Tokenizer from '../Tokenizer/Tokenizer';
import "./App.css";

function App() {
    return (
        <>
            <Mapper />
            <Tokenizer />
            <Navbar />
        </>
    );
}

export default App;
