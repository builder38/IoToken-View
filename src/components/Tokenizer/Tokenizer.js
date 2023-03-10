import React, { useState } from 'react';
import ClipLoader from "react-spinners/ClipLoader";
import './Tokenizer.css';
import  sourceCloud from '../smart_sensors.js';
import theDefault, * as XRPL from 'xrpl';
import L from "leaflet";
import { Buffer } from 'buffer';
import { CeramicClient } from '@ceramicnetwork/http-client';
import { DataModel } from '@glazed/datamodel';
import { DIDDataStore } from '@glazed/did-datastore';
import { DID } from 'dids';
import { Ed25519Provider } from 'key-did-provider-ed25519';
import { getResolver } from 'key-did-resolver';

 //INITIALIZE/CONNECT XRPL
 //smart account
 const wallet = XRPL.Wallet.fromSeed("sEdSCrn3syiUhRp1M2ahegCw6ULBRXF");
 const client = new XRPL.Client("wss://s.altnet.rippletest.net:51233");

 //INITIALIZE/CONNECT CERAMIC
 //set up and authorize a DID (decentralized identifier)
 const privateKey = 'e89b10e72176dd6514470465c2ce3929b1ed55f40e0b3c8383098deb032dc1e7'
 const mySeed = Buffer.from(privateKey, 'hex');
 
 // Create and authenticate the DID specific to the privateKey
 const did = new DID({
     provider: new Ed25519Provider(mySeed), 
     resolver: getResolver(), 
 })
 did.authenticate()
 
 // Connect to the Ceramic node - testnet
 const ceramic = new CeramicClient('https://ceramic-clay.3boxlabs.com')
 ceramic.did = did
 
 //set up datamodel
const aliases = {
    schemas: {
        PointGeometrySchema: 'ceramic://k3y52l7qbv1fryldsjcyyjrk06kluq578mb094jmerucvxt1eyv6nuqfkjb8kt8g0',
    },
    definitions: {
        PointGeometryDefinition: 'kjzl6cwe1jw145e8u4ppw961mb3ppq7fq2cvqz4okynga10fvhmbv5vbvin7tqo',
    },
    tiles: {},
}
const dataStore = new DIDDataStore({ ceramic, model: aliases })

//the Tokenizer react component
const Tokenizer = (props) => {
    const [loading, setLoading] = useState(false);
    let geomArray = [];

    async function setCeramic(theData, theAsset, cnt) { 
        //this is the Ceramic schema
        const geomObj = {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": theData.coordinate
            },
            "props": {
                "tokenid": theData.tokenid,
                "gatewayid": theData.gatewayid,
                "minthash": theData.hash,
                "asset": theAsset,
                "date": Date. now()
            }
        }; 

        if (geomArray.length === cnt){
            geomArray.push(geomObj)
            await dataStore.set("PointGeometryDefinition", {geomArray}); 
        } else {
            geomArray.push(geomObj)
        }
       
        //setLoading(false)  //start progress spinner
        console.log('Data written to Ceramic database');
    }

    async function setSingleCeramic(theData, theAsset) { 
        const geomObj = {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": theData.coordinate
            },
            "props": {
                "tokenid": theData.tokenid,
                "gatewayid": theData.gatewayid,
                "minthash": theData.hash,
                "asset": theAsset,
                "date": Date. now()
            }
        }; 

        let myData = {};
        myData = await dataStore.get("PointGeometryDefinition");
        let geomArray = myData.geomArray
        geomArray.push(geomObj);
        await dataStore.set("PointGeometryDefinition", {geomArray}); 
       
        //setLoading(false)  //start progress spinner
        console.log('Data written to Ceramic database');
    }

    async function createGatewayNFT() { 
        await client.connect();
        console.log("Connected to XRPL test blockchain - gateway");
        const txJSON = {
            TransactionType: "NFTokenMint",
            Account: wallet.classicAddress,
            Flags: parseInt('11'),
            NFTokenTaxon: 0,
            Memos: [
                {
                Memo: {
                MemoData: Buffer.from(JSON.stringify({
                    "Type": sourceCloud.properties.type,
                    "Manufacturer": sourceCloud.properties.manufacturer,
                    "ID": sourceCloud.properties.ID,
                    "Model": sourceCloud.properties.model
                }), "utf8").toString("hex").toUpperCase()
                }
                }
            ],
        }
        const tx = await client.submitAndWait(txJSON,{wallet});
        console.log("gateway NFT created");

        //get the tokenid of the new nft
        const nfts = await client.request({
            method: "account_nfts",
            account: wallet.classicAddress  
        })
        let tokenCount = 0;
        let myTokenID = '';
        for (var i = 0; i < nfts.result.account_nfts.length; i++) {
            if (nfts.result.account_nfts[i].nft_serial > tokenCount){
                tokenCount = nfts.result.account_nfts[i].nft_serial;
                myTokenID = nfts.result.account_nfts[i].NFTokenID;
            }
        }
        return [tx.result.hash, myTokenID];
    }

    async function createBatchSensorNFT(i) { 
        await client.connect();
        console.log("Connected to XRPL test blockchain - sensor");
        const txJSON = {
            TransactionType: "NFTokenMint",
            Account: wallet.classicAddress,
            Flags: parseInt('11'),
            NFTokenTaxon: 0,
            Memos: [
                {
                Memo: {
                MemoData: Buffer.from(JSON.stringify({
                    "Type": sourceCloud.geometry.coordinates[i][3].type,
                    "Manufacturer": sourceCloud.geometry.coordinates[i][3].manufacturer,
                    "ID": sourceCloud.geometry.coordinates[i][3].ID,
                    "Protocol": sourceCloud.geometry.coordinates[i][3].protocol
                }), "utf8").toString("hex").toUpperCase()
                }
                }
            ],
        }
        const tx = await client.submitAndWait(txJSON,{wallet});
        console.log("sensor NFT created");

        //get the tokenid of the new nft
        const nfts = await client.request({
            method: "account_nfts",
            account: wallet.classicAddress  
        })
        let tokenCount = 0;
        let myTokenID = '';
        for (var ii = 0; ii < nfts.result.account_nfts.length; ii++) {
            if (nfts.result.account_nfts[ii].nft_serial > tokenCount){
                tokenCount = nfts.result.account_nfts[ii].nft_serial;
                myTokenID = nfts.result.account_nfts[ii].NFTokenID;
            }
        }
        return [tx.result.hash, myTokenID];
    }

    async function createSingleSensorNFT() { 
        await client.connect();
        console.log("Connected to XRPL test blockchain - sensor");
        const txJSON = {
            TransactionType: "NFTokenMint",
            Account: wallet.classicAddress,
            Flags: parseInt('11'),
            NFTokenTaxon: 0,
            Memos: [
                {
                Memo: {
                MemoData: Buffer.from(JSON.stringify({
                    "Type": document.getElementById('typesensor').value,
                    "Manufacturer": document.getElementById('mfgsensor').value,
                    "ID": document.getElementById('idsensor').value,
                    "Protocol": document.getElementById('protocolsensor').value
                }), "utf8").toString("hex").toUpperCase()
                }
                }
            ],
        }

        const tx = await client.submitAndWait(txJSON,{wallet});
        console.log("sensor NFT created");

        //get the tokenid of the new nft
        const nfts = await client.request({
            method: "account_nfts",
            account: wallet.classicAddress  
        })
        let tokenCount = 0;
        let myTokenID = '';
        for (var i = 0; i < nfts.result.account_nfts.length; i++) {
            if (nfts.result.account_nfts[i].nft_serial > tokenCount){
                tokenCount = nfts.result.account_nfts[i].nft_serial;
                myTokenID = nfts.result.account_nfts[i].NFTokenID;
            }
        }
        return [tx.result.hash, myTokenID];
    }

    //event handler for IoT network submit
    async function tokenize(event){
        event.stopPropagation();
        event.preventDefault();
     
        //clear all sensor form elements
        document.getElementById('lngsensor').value = "";
        document.getElementById('latsensor').value = "";
        document.getElementById('elevsensor').value = "";
        document.getElementById('xrplgate2').value = "";
        document.getElementById('xrplsensor').value = "";
        document.getElementById('typesensor').selectedIndex = "-1";
        document.getElementById('mfgsensor').selectedIndex = "-1";
        document.getElementById('idsensor').value = "";
        document.getElementById('protocolsensor').selectedIndex = "-1";

        alert("Click a location on the map and then enter the Z value")
        document.getElementById('invistoken').value = "xx";

       //let myData = {};
       // myData = await dataStore.get("PointGeometryDefinition");
        //console.log(JSON.stringify(myData, null, 2))
       // return 

        //setLoading(true)  //start progress spinner
    }

    async function addGo(){
        //RUN IN BATCH MODE FROM A SOURCE FILE
        //create an object containing the specs (properties) of the gateway network
        const gatewayData = {
            "hash": "x",
            "tokenid": "y",
            "coordinate": sourceCloud.properties.gateway_coordinate
        };

       //create initial gateway NFT -  write gateway specs to memos on-chain - and write coordinate to ceramic stream    
       let NFTgate = createGatewayNFT();
       let count = sourceCloud.geometry.coordinates.length
       NFTgate.then(async function(result) {
           gatewayData.hash = result[0];
           gatewayData.tokenid = result[1];
           setCeramic(gatewayData, 'Gateway Device', count);
       
           //create each sensor NFT - write sensor specs to memos on-chain - and write coordinate to ceramic stream  
           for (var i = 0; i < sourceCloud.geometry.coordinates.length; i++) {
               let tArray = [];
               tArray.push(sourceCloud.geometry.coordinates[i][0]);
               tArray.push(sourceCloud.geometry.coordinates[i][1]);
               tArray.push(sourceCloud.geometry.coordinates[i][2]);
               let sensorData = {
                   "hash": "x",
                   "tokenid": "y",
                   "gatewayid": result[1],
                   "coordinate": tArray
               };

               let NFTsensor = await createBatchSensorNFT(i);
               sensorData.hash = NFTsensor[0];
               sensorData.tokenid = NFTsensor[1];
               setCeramic(sensorData, 'Sensor', count);
           }
       });   
       
        //Validate the new location (in the bldg?   within range of gateway device?)
        const ptX = parseFloat(document.getElementById('lngsensor').value);
        const ptY = parseFloat(document.getElementById('latsensor').value);
        const ptZ = parseFloat(document.getElementById('elevsensor').value);
        const llX = -87.618327; const llY = 41.865737;
        const urX = -87.615687; const urY = 41.866685;
        if (ptX < llX || ptX > urX){alert('The selected location is not within the building perimeter'); return;}
        if (ptY < llY || ptY > urY){alert('The selected location is not within the building perimeter'); return;}
        if (ptZ > 40){alert('The selected location is not within the building perimeter'); return;}

       //TOKENIZE A SINGLE NEW SENSOR = FOR EVAL PURPOSES ONLY
    //    let tArray = [];
    //    tArray.push(ptX);
    //    tArray.push(ptY);
    //    tArray.push(ptZ);
    //    let sensorData = {
    //        "hash": "x",
    //        "tokenid": "y",
    //        "gatewayid": document.getElementById('xrplgate').value,
    //        "coordinate": tArray
    //    };
               
    //    let NFTsensor = await createSingleSensorNFT();
    //    sensorData.hash = NFTsensor[0];   
    //    sensorData.tokenid = NFTsensor[1];    
    //    setSingleCeramic(sensorData, 'Sensor');

    //    alert("The sensor has been added to the IoT blockchain network.")
    }

    async function burner(){
        await client.connect();
        const txJSON = {
            TransactionType: "NFTokenBurn",
            Account: wallet.classicAddress,
            NFTokenID: document.getElementById('invistoken').value
        } 
        let isExecuted = window.confirm("Are you sure to execute this action?");
        if (isExecuted === true){
            const tx = await client.submitAndWait(txJSON,{wallet});
        } else {return;}
        alert("The sensor has been removed from the IoT blockchain network.")
    }

    return ( 
    <>
    <div>
        <input type="radio" id="single" name="single" style={{ position: "absolute", top: "661px", right: "385px"}}defaultChecked></input>
        <label htmlFor="single" id="singlelabel" style={{ position: "absolute", top: "657px", right: "402px", fontSize: "13px"}}>Single</label>
        <input type="radio" id="batch" name="batch" style={{ position: "absolute", top: "661px", right: "325px"}}></input>
        <label htmlFor="batch" id="batchlabel" style={{ position: "absolute", top: "658px", right: "342px", fontSize: "13px"}}>Batch</label>
        <button id="add" onClick={tokenize} style={{ position: "absolute", top: "655px", height: "25px", width: "80px", left: "965px"}}>Add</button>
        <button id="submit" onClick={addGo} style={{ position: "absolute", top: "655px", height: "25px", width: "80px", left: "970px"}}hidden>Submit</button>
        <button id="burner" onClick={burner} style={{ position: "absolute", top: "655px", height: "25px", width: "80px", left: "1200px"}}>Delete</button>
    </div>
    </>
    );
} 
export default Tokenizer; 
