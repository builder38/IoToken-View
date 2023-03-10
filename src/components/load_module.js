import  sensorCloud from './load_sensors.js';
export default function initialLoad() {
   //convert loaded cloud module gateway point to a poly for 3d display
   let gtArray = [];
   let gateArray = []
   let yming = sensorCloud.properties.gateway_coordinate[1] - 0.00005485957047150704;    //20 feet
   let ymaxg = sensorCloud.properties.gateway_coordinate[1] + 0.00005485957047150704;
   let xming = sensorCloud.properties.gateway_coordinate[0] + 0.00005485957047150704;
   let xmaxg = sensorCloud.properties.gateway_coordinate[0] - 0.00005485957047150704;
   gateArray.push([xming, yming]);
   gateArray.push([xmaxg, yming]);
   gateArray.push([xmaxg, ymaxg]);
   gateArray.push([xming, ymaxg]);
   gtArray.push(gateArray);

   //convert loaded cloud module sensor points to polys for 3d display
   let ptArray = [];
   let baseArray = [];
   for (var j = 0; j < sensorCloud.geometry.coordinates.length; j++) {
       let nodeArray = []
       let ymin = sensorCloud.geometry.coordinates[j][1] - 0.00002742978523575352;    //10 feet
       let ymax = sensorCloud.geometry.coordinates[j][1] + 0.00002742978523575352;
       let xmin = sensorCloud.geometry.coordinates[j][0] + 0.00002742978523575352;
       let xmax = sensorCloud.geometry.coordinates[j][0] - 0.00002742978523575352;
       nodeArray.push([xmin, ymin]);
       nodeArray.push([xmax, ymin]);
       nodeArray.push([xmax, ymax]);
       nodeArray.push([xmin, ymax]);
       ptArray.push(nodeArray);
                       
       baseArray.push(sensorCloud.geometry.coordinates[j][2])
  
}
   return [gtArray, ptArray, baseArray];
}
    