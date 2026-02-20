#include "ble.h"
#include <NimBLEDevice.h>

// initialize BLE as GATT server 
void setupBLE(){
    NimBLEDevice::init("NanoESP32");
    NimBLEServer* pServer = NimBLEDevice::createServer(); // create GATT server
}