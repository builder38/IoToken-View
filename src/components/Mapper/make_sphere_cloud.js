
let mySphereCloud = [];
let mySphereCloud2 = [];
function randomSpherePoint(x0,y0,z0,radius){
    var u = Math.random();
    var v = Math.random();
    var theta = 2 * Math.PI * u;
    var phi = Math.acos(2 * v - 1);
    var x = x0 + (radius * Math.sin(phi) * Math.cos(theta));
    var y = y0 + (radius * Math.sin(phi) * Math.sin(theta));
    var z = z0 + (radius * Math.cos(phi));
    return [x,y,z];
}

function makeSphereCloud() {
    let min = 101;   let max = 98; let diff = 0;
    for (var j = 0; j < 400; j++) {
        mySphereCloud.push(randomSpherePoint(0.1,0.1,100,0.3))
    }

    //get max/min of myCloud z values
    for (var k = 0; k < mySphereCloud.length; k++) {
        if( mySphereCloud[k][2] < min){
            min =  mySphereCloud[k][2]
           }
    }
    for (var m = 0; m < mySphereCloud.length; m++) {
        if( mySphereCloud[m][2] > max){
            max =  mySphereCloud[m][2];
        }
    }

    diff = max - min;
    for (var x = 0; x < mySphereCloud.length; x++) {
        let p = mySphereCloud[x][2] - min;
        let b = p/diff;
        let elev = b * 60000;
         mySphereCloud2.push([mySphereCloud[x][1], mySphereCloud[x][0], elev]);
    }
}