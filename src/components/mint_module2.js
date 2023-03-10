export default function mintLoad2(theData, theMap) {
    //convert loaded cloud module sensor/gateway points to polys for 3d display
    let ptArray = [];
    let ptHeightArray = [];
    let gtHeightArray = [];
    let ptHashArray = [];
    let gtHashArray = [];
    let ptTokenArray = [];
    let gtTokenArray = [];
    let gtArray = [];
    let gateArray = [];
    let mapSensor = 0; let mapGate = 0;
    if (theMap === 'smart'){
        mapSensor = 0.00001371489261787676;   //5 feet
        mapGate = 0.00002742978523575352;  //10 feet
    } else if (theMap = 'load'){
        mapSensor = 0.00002742978523575352;   //10 feet
        mapGate = 0.00005485957047150704;  //20 feet
    }

    for (var j = 0; j < theData.geomArray.length; j++) {
        if (theData.geomArray[j].props.asset === 'Sensor'){
            let nodeArray = [];
            let ymin = theData.geomArray[j].geometry.coordinates[1] - mapSensor;    
            let ymax = theData.geomArray[j].geometry.coordinates[1] + mapSensor;
            let xmin = theData.geomArray[j].geometry.coordinates[0] + mapSensor;
            let xmax = theData.geomArray[j].geometry.coordinates[0] - mapSensor;
            nodeArray.push([xmin, ymin]);
            nodeArray.push([xmax, ymin]);
            nodeArray.push([xmax, ymax]);
            nodeArray.push([xmin, ymax]);
            ptArray.push(nodeArray);
            ptHashArray.push(theData.geomArray[j].props.minthash);  
            ptTokenArray.push(theData.geomArray[j].props.tokenid);  
            ptHeightArray.push(theData.geomArray[j].geometry.coordinates[2]);
        } else if (theData.geomArray[j].props.asset === 'Gateway Device') {
            let ymin = theData.geomArray[j].geometry.coordinates[1] - mapGate;     
            let ymax = theData.geomArray[j].geometry.coordinates[1] + mapGate; 
            let xmin = theData.geomArray[j].geometry.coordinates[0] + mapGate; 
            let xmax = theData.geomArray[j].geometry.coordinates[0] - mapGate; 
            gateArray.push([xmin, ymin]);
            gateArray.push([xmax, ymin]);
            gateArray.push([xmax, ymax]);
            gateArray.push([xmin, ymax]);
            gtArray.push(gateArray);
            gtHashArray.push(theData.geomArray[j].props.minthash);
            gtTokenArray.push(theData.geomArray[j].props.tokenid);
            gtHeightArray.push(theData.geomArray[j].geometry.coordinates[2]);
        }
    } 
    return [gtArray, ptArray, ptHeightArray, gtHeightArray, ptHashArray, gtHashArray, ptTokenArray, gtTokenArray];
}
    