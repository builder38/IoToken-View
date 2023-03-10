import  smartCloud from './smart_sensors.js';
export default function smartLoad() {
   //convert loaded cloud module gateway point to a poly for 3d display
   let gtArray = [];
   let gateArray = []
   let yming = smartCloud.properties.gateway_coordinate[1] - 0.00005485957047150704;    //20 feet
   let ymaxg = smartCloud.properties.gateway_coordinate[1] + 0.00005485957047150704;
   let xming = smartCloud.properties.gateway_coordinate[0] + 0.00005485957047150704;
   let xmaxg = smartCloud.properties.gateway_coordinate[0] - 0.00005485957047150704;
   gateArray.push([xming, yming]);
   gateArray.push([xmaxg, yming]);
   gateArray.push([xmaxg, ymaxg]);
   gateArray.push([xming, ymaxg]);
   gtArray.push(gateArray);

   //convert loaded cloud module sensor points to polys for 3d display
   let ptArray = [];
   let baseArray = [];
   for (var j = 0; j < smartCloud.geometry.coordinates.length; j++) {
       let nodeArray = []
       let ymin = smartCloud.geometry.coordinates[j][1] - 0.00001371489261787676 //0.00002742978523575352;   //10 feet
       let ymax = smartCloud.geometry.coordinates[j][1] + 0.00001371489261787676 //0.00002742978523575352; decimal degrees = feet / 364,567.2
       let xmin = smartCloud.geometry.coordinates[j][0] + 0.00001371489261787676 //0.00002742978523575352;
       let xmax = smartCloud.geometry.coordinates[j][0] - 0.00001371489261787676 //0.00002742978523575352;
       nodeArray.push([xmin, ymin]);
       nodeArray.push([xmax, ymin]);
       nodeArray.push([xmax, ymax]);
       nodeArray.push([xmin, ymax]);
       ptArray.push(nodeArray);
                       
       baseArray.push(smartCloud.geometry.coordinates[j][2])
  
}
   return [gtArray, ptArray, baseArray];
}
    