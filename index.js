"use strict";
require('heapdump');
const memwatch = require('memwatch-next');

var leakyData = [];
var nonLeakyData = [];

class SimpleClass {
  constructor(text){
    this.text = text;
  }
}

function cleanUpData(dataStore, randomObject){
  var objectIndex = dataStore.indexOf(randomObject);
  dataStore.splice(objectIndex, 1);
}

function getAndStoreRandomData(){
  var randomData = Math.random().toString();
  var randomObject = new SimpleClass(randomData);

  leakyData.push(randomObject);
  nonLeakyData.push(randomObject);

  // cleanUpData(leakyData, randomObject); //<-- Forgot to clean up
  cleanUpData(nonLeakyData, randomObject);
}

function generateHeapDumpAndStats(){
  //1. Force garbage collection every time this function is called
  try {
    global.gc();
  } catch (e) {
    console.log("You must run program with 'node --expose-gc index.js' or 'npm start'");
    process.exit();
  }

  //2. Output Heap stats
  var heapUsed = process.memoryUsage().heapUsed;
  console.log("Program is using " + heapUsed + " bytes of Heap.")

  //It can also do this...
  const hd = new memwatch.HeapDiff();
  // Do something that might leak memory
  const diff = hd.end();
  const { change: { freed_nodes, allocated_nodes }} = diff;
  if (freed_nodes > 0 || allocated_nodes> 0) {
    console.log(JSON.stringify(diff));
  }

  //3. Get Heap dump
  process.kill(process.pid, 'SIGUSR2');
}

memwatch.gc();

memwatch.on('leak', function(info) {
  /*Log memory leak info, runs when memory leak is detected */
  console.log('leak', JSON.stringify(info));
 });

memwatch.on('stats', function(stats) {
  /*Log memory stats, runs when V8 does Garbage Collection*/
  // console.log('stats', JSON.stringify(stats));
});

//Kick off the program
setInterval(getAndStoreRandomData, 5); //Add random data every 5 milliseconds
setInterval(generateHeapDumpAndStats, 2000); //Do garbage collection and heap dump every 2 seconds
