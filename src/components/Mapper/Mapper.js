import React, { useState, useEffect } from 'react';
import 'mapbox-gl/dist/mapbox-gl.css';
import './Mapper.css';
import initialLoad from '../load_module.js';
import mintLoad from '../mint_module.js';
import mintLoad2 from '../mint_module2.js';
import theDefault, * as XRPL from 'xrpl';
import { CeramicClient } from '@ceramicnetwork/http-client';
import { DataModel } from '@glazed/datamodel';
import { DIDDataStore } from '@glazed/did-datastore'; 
import { DID } from 'dids';
import { Ed25519Provider } from 'key-did-provider-ed25519';
import { getResolver } from 'key-did-resolver'; 
import { Buffer } from 'buffer';

const Mapper = () => { 
    const mapboxgl = require('mapbox-gl');
    mapboxgl.accessToken = 'pk.eyJ1IjoiZGNzbWFwczEiLCJhIjoiY2wzdWl2a2d1MmNoYzNjcGFzbDN4eGdsNSJ9.Dwz8RgGELznP_-aQSjV_-w'; 

    let sensorCoords = [];
    let loadCoords = [];
    let gateCoords = [];
    let loadHeight = [];
    let sensorHeight = [];
    let gateHeight = [];
    let sensorHash = [];
    let gateHash = [];
    let sensorToken = [];
    let gateToken = [];
    let smartCoords = [];
    let smartHeight = [];

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
    
    async function getXRPL(myWallet){
        await client.connect();
        const txs = await client.request({
            method: "account_tx",
            account: myWallet.classicAddress
        })
        return txs;
    }

    async function loadSensors(){
        document.getElementById('acct').innerHTML = "";
       //run initialLoad function which will
        let stat = initialLoad();  
        loadCoords = []; gateCoords = [];
        loadCoords.push(stat[1]);
        gateCoords.push(stat[0]);
        loadHeight = [];
        loadHeight.push(stat[2]);
       
        loadOblique();
    }
    
    async function loadSmart(){
        document.getElementById('acct').innerHTML = wallet.address;

        const theTx = await getXRPL(wallet);
        let myData = {};
        myData = await dataStore.get("PointGeometryDefinition");

        //need to filter theData (which is the source of the coords for mapping)
        //to skip those records that have been burned
        await client.connect();
        const nfts = await client.request({
            method: "account_nfts",
            account: wallet.classicAddress  
        })

        let filterArray = []; 
        for (var i = 0; i < nfts.result.account_nfts.length; i++) {
            for (var g = 0; g < myData.geomArray.length; g++) {
                if (myData.geomArray[g].props.tokenid === nfts.result.account_nfts[i].NFTokenID || myData.geomArray[g].props.asset === 'Gateway Device'){
                    filterArray.push(myData.geomArray[g]);
                } 
            }
        }
        //run mintLoad function
        let stat = mintLoad(filterArray, 'smart');
        sensorCoords = []; gateCoords = []; sensorHeight = []; gateHeight = []; sensorHash = []; gateHash = []; sensorToken = []; gateToken = [];
        sensorCoords.push(stat[1]);
        gateCoords.push(stat[0]);
        sensorHeight.push(stat[2]);
        gateHeight.push(stat[3]);
        sensorHash.push(stat[4]);
        gateHash.push(stat[5]);
        sensorToken.push(stat[6]);
        gateToken.push(stat[7]);

        smartOblique(theTx);
    }

    function smartOblique(txs){
        const map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/streets-v12',
            center: [-87.61694, 41.86625],
            zoom: 17.5,
            pitch: 50,
            bearing: 60,
            antialias: true,
            attributionControl: false
        });

        map.getCanvas().style.cursor = 'pointer';
        map.on('load', () => {
            let cubeArray = [];
            let gateObj = {};
            for (var j = 0; j < sensorCoords[0].length; j++) { 
                let sensorObj = {}; 
                for (var i = 0; i < txs.result.transactions.length-1; i++) {
                    if (txs.result.transactions[i].tx.hash === sensorHash[0][j]){
                        let data = txs.result.transactions[i].tx.Memos[0].Memo.MemoData;
                        sensorObj = JSON.parse(Buffer.from(data, "hex").toString("utf-8"))
                    }
                    if (txs.result.transactions[i].tx.hash === gateHash[0][j]){
                        let data2 = txs.result.transactions[i].tx.Memos[0].Memo.MemoData;
                        gateObj = JSON.parse(Buffer.from(data2, "hex").toString("utf-8"))
                    }
                }
              
                cubeArray.push(j.toString());
                map.addSource('sensor' + j, {
                    'type': 'geojson',
                    'data': {
                        'type': 'Feature',
                        'geometry': {
                            'type': 'Polygon',
                            'coordinates': [sensorCoords[0][j]]
                        },
                        'properties': {
                            'xcoord': sensorCoords[0][j][0][0],
                            'ycoord': sensorCoords[0][j][0][1],
                            'zcoord': sensorHeight[0][j],
                            'gatewayhash': gateHash[0][0],
                            'sensorhash': sensorHash[0][j],
                            "sensortoken": sensorToken[0][j],
                            'type': sensorObj.Type,
                            'mfg': sensorObj.Manufacturer,
                            'sensorid': sensorObj.ID,
                            'protocol': sensorObj.Protocol,
                        }
                    },
                    'generateId': true
                });  
                      
                map.addLayer({
                    'id': j.toString(),
                    'type': 'fill-extrusion',
                    'source': 'sensor' + j.toString(),
                    'paint': {
                        'fill-extrusion-color': ['case', ['boolean', ['feature-state', 'clicked'], false], 'yellow', 'red'], 
                        'fill-extrusion-height': sensorHeight[0][j]+2.5,
                        'fill-extrusion-base': sensorHeight[0][j],
                        'fill-extrusion-opacity': 1
                    },
                }); 
            }

            map.addSource('floorplan', {
                'type': 'geojson',
                'data': 'museum.geojson'
            });
            map.addLayer({
                'id': 'museum',
                'type': 'fill-extrusion',
                'source': 'floorplan',
                'layout': {
                    'visibility': 'none'
                },
                'paint': {
                    'fill-extrusion-color': 'grey', 
                    'fill-extrusion-height': ['get', 'height'],
                    'fill-extrusion-base': ['get', 'base_height'],
                    'fill-extrusion-opacity': 0.8
                }
            });

            map.addLayer({
                'id': 'sky',
                'type': 'sky',
                'paint': {
                'sky-type': 'atmosphere',
                'sky-atmosphere-sun': [0.0, 0.0],
                'sky-atmosphere-sun-intensity': 15
                }
            });

            map.addSource('gateway_bnd', {
                'type': 'geojson',
                'data': {
                    'type': 'Feature',
                    'geometry': {
                        'type': 'Polygon',
                        'coordinates': [gateCoords[0][0]]
                    },
                    'properties': {
                        'xcoord': gateCoords[0][0][0][0],
                        'ycoord': gateCoords[0][0][0][1],
                        'zcoord': gateHeight[0][0],
                        'type': gateObj.Type,
                        'mfg': gateObj.Manufacturer,
                        'gateid': gateObj.ID,
                        'model': gateObj.Model,
                        'gatetoken': gateHash[0][0]
                    }
                },
                'generateId': true
            });
            map.addLayer( {
                'id': 'extruded_gateway',
                'type': 'fill-extrusion',
                'source': 'gateway_bnd',
                'paint': {
                  'fill-extrusion-color': 'green',
                  'fill-extrusion-height': 10,
                  'fill-extrusion-base': 0,
                  'fill-extrusion-opacity': 1
                }
            });
            
            map.on('click', function(e) {
                let lnglat = e.lngLat;
                if (document.getElementById('invistoken').value === "xx"){
                    document.getElementById('lngsensor').value = lnglat.lng;
                    document.getElementById('latsensor').value = lnglat.lat;
                    document.getElementById('submit').hidden = false;
                }
               
                const bbox = [
                    [e.point.x - 5, e.point.y - 5],
                    [e.point.x + 5, e.point.y + 5]
                ];
                let sensors = map.queryRenderedFeatures(bbox, {layers: cubeArray});   //topmost feature = sensors[0]
                let sensors2 = map.queryRenderedFeatures({layers: cubeArray});
                for (var j = 0; j < sensors2.length; j++) {
                    map.removeFeatureState({source: sensors2[j].source, id: sensors2[j].id});
                }
               
                if (sensors[0]){
                    document.getElementById('add').hidden = false;
                    document.getElementById('submit').hidden = true;
                } 
                
                if (!sensors[0] && document.getElementById('invistoken').value != "xx"){
                    clearSensorForm();
                } else { 
                    map.setFeatureState({source: sensors[0].source, id: sensors[0].id}, {clicked: true});
              
                    document.getElementById('lngsensor').value = sensors[0].properties.xcoord;
                    document.getElementById('latsensor').value = sensors[0].properties.ycoord;
                    document.getElementById('elevsensor').value = sensors[0].properties.zcoord;
                    document.getElementById('xrplgate2').value = sensors[0].properties.gatewayhash;
                    document.getElementById('xrplsensor').value = sensors[0].properties.sensorhash;
                    document.getElementById('invistoken').value = sensors[0].properties.sensortoken;
                    document.getElementById('typesensor').value = sensors[0].properties.type;
                    document.getElementById('mfgsensor').value = sensors[0].properties.mfg;
                    document.getElementById('idsensor').value = sensors[0].properties.sensorid;
                    document.getElementById('protocolsensor').value = sensors[0].properties.protocol;
                }
                
            });              
            map.on('render', () => {
                //populate gateway elements
                let gateway = map.queryRenderedFeatures({layers: ['extruded_gateway']});
                document.getElementById('lnggate').value = gateway[0].properties.xcoord;
                document.getElementById('latgate').value = gateway[0].properties.ycoord;
                document.getElementById('elevgate').value = gateway[0].properties.zcoord;
                document.getElementById('xrplgate').value = gateway[0].properties.gatetoken;
                document.getElementById('typegate').value = gateway[0].properties.type;
                document.getElementById('mfggate').value = gateway[0].properties.mfg
                document.getElementById('idgate').value = gateway[0].properties.gateid;
                document.getElementById('modelgate').value = gateway[0].properties.model;
            });
        });
       
        // Create a link.
        let menu = document.createElement("nav")
        menu.id = 'menu';
        document.body.appendChild(menu);

        const link = document.createElement('a');
        link.id = 'museum';
        link.href = '#';
        link.textContent = 'museum';
        link.className = 'active';
       
        // Show or hide layer when the toggle is clicked.
        link.onclick = function (e) {
            const clickedLayer = this.textContent;
            e.preventDefault();
            e.stopPropagation();
                
            const visibility = map.getLayoutProperty(clickedLayer,'visibility');
                
            // Toggle layer visibility by changing the layout object's visibility property.
            if (visibility === 'visible') {
                map.setLayoutProperty(clickedLayer, 'visibility', 'none');
                this.className = '';
                document.getElementById("mapdesc").innerHTML = 'IoT sensors in a cloud within the range of a gateway.';
            } else {
                this.className = 'active';
                map.setLayoutProperty(clickedLayer,'visibility','visible');
                document.getElementById("mapdesc").innerHTML = 'Smart Building with decentralized IoT device network on blockchain.';
            }     
        }  
        const layers = document.getElementById('menu');
        layers.appendChild(link);     
    }

    function loadOblique(){
        const map = new mapboxgl.Map({
            container: 'map',
            //style: 'mapbox://styles/mapbox/satellite-v9',
            style: 'mapbox://styles/mapbox/streets-v12',
            center: [-105.538722, 37.316831],
            zoom: 16.6,
            pitch: 50,
            bearing: 105,
            antialias: true,
            attributionControl: false
        });

        map.getCanvas().style.cursor = 'pointer';
        map.on('load', () => { 
            let cubeArray = [];
            //add the sensors to the map
            for (var j = 0; j < loadCoords[0].length; j++) { 
                cubeArray.push(j.toString());
                map.addSource('sensor' + j, {
                    'type': 'geojson',
                    'data': {
                        'type': 'Feature',
                        'geometry': {
                            'type': 'Polygon',
                            'coordinates': [loadCoords[0][j]]
                        },
                        'properties': {
                            'xcoord': loadCoords[0][j][0][0],
                            'ycoord': loadCoords[0][j][0][1],
                            'zcoord': loadHeight[0][j+1],
                        }
                    },
                    'generateId': true
                });  
                      
                map.addLayer({
                    'id': j.toString(),
                    'type': 'fill-extrusion',
                    'source': 'sensor' + j,
                    'paint': {
                        'fill-extrusion-color': ['case', ['boolean', ['feature-state', 'clicked'], false], 'yellow', 'red'], 
                        'fill-extrusion-height': loadHeight[0][j]+5,
                        'fill-extrusion-base': loadHeight[0][j],
                        'fill-extrusion-opacity': 1
                    },
                }); 
            }

            //add sky layer
            map.addLayer({
                'id': 'sky',
                'type': 'sky',
                'paint': {
                'sky-type': 'atmosphere',
                'sky-atmosphere-sun': [0.0, 0.0],
                'sky-atmosphere-sun-intensity': 15
                }
            });

            //add the gateway device
            map.addSource('gateway_bnd', {
                'type': 'geojson',
                'data': {
                    'type': 'Feature',
                    'geometry': {
                        'type': 'Polygon',
                        'coordinates': [gateCoords[0][0]]
                    },
                    'properties': {
                        'xcoord': gateCoords[0][0][0][0],
                        'ycoord': gateCoords[0][0][0][1],
                        'name': 'Pointcloud Network',
                        'count': 22,
                    }
                },
                'generateId': true
            });
             map.addLayer( {
                'id': 'extruded_gateway',
                'type': 'fill-extrusion',
                'source': 'gateway_bnd',
                'paint': {
                    'fill-extrusion-color': ['case', ['boolean', ['feature-state', 'clicked'], false], 'yellow', 'green'],
                    'fill-extrusion-height': 10,
                    'fill-extrusion-base': 0,
                    'fill-extrusion-opacity': 1
                }
            });

            //add the gateway area of influence to the map
            map.addSource('gateway', {
                'type': 'geojson',
                'data': {
                    'type': 'Feature',
                    'geometry': {
                        'type': 'Polygon',
                        'coordinates': [[[-105.539611, 37.317592],[-105.538122, 37.317592],[-105.538128, 37.316236],[-105.539586, 37.316231]]]
                    },
                    'properties': {
                        'name': 'Pointcloud Sphere Network',
                        'count': 400,
                    }
                },
                'generateId': true
            });            
            map.addLayer({
                'id': 'mygateway',
                'type': 'fill-extrusion',
                'source': 'gateway',
                'paint': {
                    'fill-extrusion-color': 'green', 
                    'fill-extrusion-height': 150,
                    'fill-extrusion-base': 0,
                    'fill-extrusion-opacity': 0.4
                },
            }); 

            map.on('click', function(e) {
                const bbox = [
                    [e.point.x - 5, e.point.y - 5],
                    [e.point.x + 5, e.point.y + 5]
                ];

                let gateway = map.queryRenderedFeatures({layers: ['extruded_gateway']});
                let sensors = map.queryRenderedFeatures(bbox, {layers: cubeArray});   //topmost feature = sensors[0]
                let sensors2 = map.queryRenderedFeatures({layers: cubeArray});
                for (var j = 0; j < sensors2.length; j++) {
                    map.removeFeatureState({source: sensors2[j].source, id: sensors2[j].id});
                }
               
                new mapboxgl.Popup()
                    .setLngLat([sensors[0].properties.xcoord, sensors[0].properties.ycoord])
                    .setHTML('<div><label style="color: teal;font-weight: 700;text-decoration: underline">Pointcloud Network</label></div>' +
                    '<div><label>' + 'Xcoord: ' + sensors[0].properties.xcoord.toFixed(4) + '</label></div>' +
                    '<div><label>' + 'Ycoord: ' + sensors[0].properties.ycoord.toFixed(4) + '</label></div>' +
                    '<div><label>' +  'Elevation: ' + sensors[0].properties.zcoord + '</label></div>')

                    .addTo(map);
               
                map.setFeatureState({source: sensors[0].source, id: sensors[0].id}, {clicked: true}); 
            }); 
        });    
    }

    function clearSensorForm(){
        document.getElementById('lngsensor').value = "";
        document.getElementById('latsensor').value = "";
        document.getElementById('elevsensor').value = "";
        document.getElementById('xrplgate2').value = "";
        document.getElementById('xrplsensor').value = "";
        document.getElementById('invistoken').value = "";
        document.getElementById('typesensor').value = "";
        document.getElementById('mfgsensor').value = "";
        document.getElementById('idsensor').value = "";
        document.getElementById('protocolsensor').value = "";
    }

    function clearGatewayForm(){
        document.getElementById('lnggate').value = "";
        document.getElementById('latgate').value = "";
        document.getElementById('elevgate').value = "";
        document.getElementById('xrplgate').value = "";
        document.getElementById('typegate').value = "";
        document.getElementById('mfggate').value = "";
        document.getElementById('idgate').value = "";
        document.getElementById('modelgate').value = "";
    }

    function loadNetwork(){
        clearSensorForm();
        clearGatewayForm();
        switch (document.getElementById("network").selectedIndex) {
            case 0:
                //document.getElementById("menu").remove();
                //document.getElementById("a").remove();
                break;
            case 1:
                loadSensors();
                document.getElementById("mapdesc").innerHTML = 'Point cloud nodes governed by a master node';
                //disable and clear everything in the form
                Array.from(document.getElementById("myform").elements).forEach(formElement => formElement.disabled = true);
                document.getElementById('mapdesc').hidden = false;
                document.getElementById("single").style.visibility = 'hidden';
                document.getElementById("singlelabel").style.visibility = 'hidden';
                document.getElementById("batch").style.visibility = 'hidden';
                document.getElementById("batchlabel").style.visibility = 'hidden';
                document.getElementById("add").style.visibility = 'hidden';
                document.getElementById("tokenize").style.visibility = 'visible';
                document.getElementById("burner").style.visibility = 'hidden';
                //document.getElementById("menu").remove();
                document.getElementById("a").remove();
                break;
            case 2:
                loadSmart();
                document.getElementById("mapdesc").innerHTML = 'IoT sensors within the range of a gateway.';
                document.getElementById("myform").style.visibility = 'visible';
                document.getElementById("single").style.visibility = 'visible';
                document.getElementById("singlelabel").style.visibility = 'visible';
                document.getElementById("batch").style.visibility = 'visible';
                document.getElementById("batchlabel").style.visibility = 'visible';
                document.getElementById("add").style.visibility = 'visible';
                document.getElementById("tokenize").style.visibility = 'hidden';
                document.getElementById("submit").style.visibility = 'visible';
                document.getElementById("burner").style.visibility = 'visible';
               // document.getElementById("menu").style.visibility = 'visible';
                //document.getElementById("a").style.visibility = 'visible';
                break;
        }
    }

    function toBlockchain(){
        console.log('tokenize from here')
    }

return (
    <>
    <div className="map" id="map"></div>
    <form className="sensor_form2" id="myform2">
        <div>
            <label style={{ position: "relative", top: "16px", width: "120px", left: "-112px", fontWeight: "bold" }}>IoT Network:</label>
            <select id="network" required onChange={loadNetwork} style={{ position: "relative", width: "215px", height: "25px", left: "50px", top: "-5px", color: "blue", fontSize: "17px", fontWeight: "bold" }}>
                <option value=""></option>
                <option value="Point Cloud IoT">Point Cloud Nodes</option>
                <option value="Smart Building IoT">Smart Building Sensors</option>
            </select>
            <label style={{ position: "relative", width: "120px", top: "3px", left: "-55px", fontSize: "14px"}}>XRPL acct:</label>
            <label id="acct" onClick={(e) => {window.open('https://testnet.xrpl.org/accounts/' + document.getElementById('acct').innerHTML);}} style={{ position: "relative", textDecoration: "underline", width: "135px", top: "3px", left: "-77px", color: "blue", fontSize: "13px"}}>a</label>
            <button id="tokenize" onClick={toBlockchain} style={{ position: "relative", top: "-17px", height: "25px", width: "210px", left: "58px", borderRadius: "5px"}}>Tokenize to XRPL Blockchain</button>
        </div>
        <div>
            <label id="mapdesc" style={{ position: "absolute", width: "225px", top: "25px", right: "395px"}} hidden></label>
        </div>
    </form>
    <form className="sensor_form" id="myform">
        <div>
            <label style={{ position: "relative", width: "135px", top: "2px", left: "-119px", color: "blue", fontSize: "17px", fontWeight: "bold"}}>Gateway</label>
            <button style={{ position: "relative", top: "8px", height: "25px", width: "25px", left: -"135", borderRadius: "3px", backgroundColor: "green"}}></button>
        </div>
        <div>
            <label style={{ position: "relative", width: "135px", top: "8px", left: "-49px", fontSize: "14px"}}>Location:</label>
            <label style={{ position: "relative", width: "50px", top: "8px", left: "-80px", fontSize: "14px"}}>Lng:</label>
            <input type="text" id="lnggate" style={{ position: "relative", top: "8px", height: "20px", width: "60px", left: "-89px", color: "blue", fontSize: "14px"}}readOnly></input>
            <label style={{ position: "relative", width: "50px", top: "8px", left: "-90px", fontSize: "14px"}}>Lat:</label>
            <input type="text" id="latgate" style={{ position: "relative", top: "-17px", height: "20px", width: "60px", left: "102px", color: "blue", fontSize: "14px"}}readOnly></input>
            <label style={{ position: "relative", width: "20px", top: "-16px", left: "109px", fontSize: "14px"}}>Z:</label>
            <input type="text" id="elevgate" style={{ position: "relative", top: "-17px", height: "20px", width: "30px", left: "110px", color: "blue", fontSize: "14px"}}readOnly></input>
        </div>
        <div>
            <label style={{ position: "relative", width: "135px", top: "-8px", left: "-120px", fontSize: "14px"}}>Gateway ID:</label>
            <input type="text" id="xrplgate" style={{ position: "relative", top: "-33px", height: "20px", width: "225px", left: "43px", color: "blue", fontSize: "14px"}}readOnly></input>
            <button type="button" onClick={(e) => {window.open('https://testnet.xrpl.org/nft/' + document.getElementById('xrplgate').value);}} style={{ position: "relative", top: "-29px", height: "20px", width: "20px", left: "44px", borderRadius: "5px"}}></button>
        </div>
        <div>
            <label style={{ position: "relative", width: "135px", top: "-27px", left: "-141px", fontSize: "14px"}}>Type:</label>
            <input type="text" id="typegate" style={{ position: "relative", top: "-50px", height: "20px", width: "245px", left: "44px", color: "blue", fontSize: "14px"}}readOnly></input>
        </div>
        <div>
            <label style={{ position: "relative", width: "135px", top: "-43px", left: "-124px", fontSize: "14px"}}>Fabricator:</label>
            <input type="text" id="mfggate" style={{ position: "relative", top: "-67px", height: "20px", width: "245px", left: "44px", color: "blue", fontSize: "14px"}}readOnly></input>
        </div>
        <div>
            <label style={{ position: "relative", width: "135px", top: "-58px", left: "-127px", fontSize: "14px"}}>Serial No:</label>
            <input type="text" id="idgate" style={{ position: "relative", top: "-82px", height: "20px", width: "245px", left: "44px", color: "blue", fontSize: "14px"}}readOnly></input>
        </div>
        <div>
            <label style={{ position: "relative", width: "135px", top: "-74px", left: "-135px", fontSize: "14px"}}>Model:</label>
            <input type="text" id="modelgate" style={{ position: "relative", top: "-98px", height: "20px", width: "245px", left: "44px", color: "blue", fontSize: "14px"}}readOnly></input>
        </div>
        <div>
            <label style={{ position: "relative", width: "135px", top: "-77px", left: "-48px", color: "blue", fontSize: "17px", fontWeight: "bold"}}>Sensors</label>
            <button style={{ position: "relative", top: "-72px", height: "25px", width: "25px", left: -"64", borderRadius: "3px", backgroundColor: "red"}}></button>
            <label style={{ position: "relative", width: "135px", top: "-77px", left: "-106px"}}>(22)</label>
        </div>
        <div>
            <label style={{ position: "relative", width: "135px", bottom: "70px", right: "48px", fontSize: "14px"}}>Location:</label>
            <label style={{ position: "relative", width: "50px", bottom: "70px", right: "75px", fontSize: "14px"}}>Lng:</label>
            <input type="text" id="lngsensor" style={{ position: "relative", bottom: "69px", height: "20px", width: "60px", right: "84px", color: "blue", fontSize: "14px"}}></input>
            <label style={{ position: "relative", width: "50px", bottom: "69px", right: "87px", fontSize: "14px"}}>Lat:</label>
            <input type="text" id="latsensor" style={{ position: "relative", bottom: "92px", height: "20px", width: "60px", left: "120px", color: "blue", fontSize: "14px"}}readOnly></input>
            <label style={{ position: "relative", width: "50px", bottom: "92px", left: "110px", fontSize: "14px"}}>Z:</label>
            <input type="text" id="elevsensor" style={{ position: "relative", bottom: "92px", height: "20px", width: "30px", left: "94px", color: "blue", fontSize: "14px"}}></input>
        </div>
        <div>
            <label style={{ position: "relative", width: "135px", bottom: "85px", right: "121px", fontSize: "14px"}}>Gateway ID:</label>
            <input type="text" id="xrplgate2" style={{ position: "relative", bottom: "108px", height: "20px", width: "240px", left: "45px", color: "blue", fontSize: "14px"}}readOnly></input>
        </div>
        <div>
            <label style={{ position: "relative", width: "135px", top: "-100px", right: "126px", fontSize: "14px"}}>Sensor ID:</label>
            <input type="text" id="xrplsensor" style={{ position: "relative", bottom: "123px", height: "20px", width: "217px", left: "35px", color: "blue", fontSize: "14px"}}readOnly></input>
            <button type="button" onClick={(e) => {window.open('https://testnet.xrpl.org/nft/' + document.getElementById('xrplsensor').value);}}style={{ position: "absolute", bottom: "191px", height: "20px", width: "20px", right: "16px", borderRadius: "5px"}}></button>
        </div>
        <div>
            <label style={{ position: "relative", width: "135px", bottom: "114px", right: "141px", fontSize: "14px"}}>Type:</label>
            <select id="typesensor" required style={{ position: "relative", width: "239px", height: "20px", left: "46px", bottom: "136px", color: "blue", fontsize: "14px"}}>
                <option value="Motion">Motion</option>
                <option value="Air Quality">Air Quality</option>
                <option value="Temperature">Temperature</option>
            </select>
        </div>
        <div>
            <label style={{ position: "relative", width: "135px", bottom: "131px", right: "125px", fontSize: "14px"}}>Fabricator:</label>
            <select id="mfgsensor" required style={{ position: "relative", width: "239px", height: "20px", left: "46px", bottom: "152px", color: "blue", fontsize: "14px", fontweight: "bold" }} >
                <option value="WellAware">WellAware</option>
                <option value="Yokogawa">Yokogawa</option>
                <option value="Ametek">Ametek</option>
                <option value="WIKA">WIKA</option>
                <option value="Eaton">Eaton</option>
            </select>   
        </div>
        <div>
            <label style={{ position: "relative", width: "135px", bottom: "146px", right: "127px", fontSize: "14px"}}>Serial No:</label>
            <input type="text" id="idsensor" style={{ position: "relative", bottom: "170px", height: "20px", width: "239px", left: "46px", color: "blue", fontSize: "14px"}}required></input>
        </div>
        <div>
            <label style={{ position: "relative", width: "135px", bottom: "161px", right: "129px", fontSize: "14px"}}>Protocol:</label>
            <select id="protocolsensor" required style={{ position: "relative", width: "239px", height: "20px", left: "46px", bottom: "183px", color: "blue", fontsize: "14px", fontweight: "bold" }} >
                <option value="ZigBee">ZigBee</option>
                <option value="LPWAN">LPWAN</option>
                <option value="Bluetooth">Bluetooth</option>
            </select>
        </div>
        <div>
            <input type="text" id="invistoken" style={{ position: "relative", top: "-130px", height: "20px", width: "30px", left: "150px", visibility: "hidden"}}></input>
        </div>
    </form>
    </>
);
}
export default Mapper; 