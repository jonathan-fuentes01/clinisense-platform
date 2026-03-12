#include "queues.h"
#include "ble.h"
#include <NimBLEDevice.h>

class ServerCallbacks : public NimBLEServerCallbacks{
    void onConnect(NimBLEServer* pServer) {
        connected = true;
        Serial.println("Client connected!!");
    }

    void onDisconnect(NimBLEServer* pServer){
        connected = false;
        Serial.println("Client disconnected!!");
        
    }
};

// initialize BLE as GATT server 
void setupBLE(){
    
    NimBLEDevice::init("ESP32 NimBLE");
    NimBLEServer* pServer = NimBLEDevice::createServer(); // create GATT server
    pServer->setCallbacks( new ServerCallbacks());

    // create your service
    NimBLEService* pService = pServer->createService(SERVICE_UUID);
    
    // create set your characteristic
    pCharacteristic = pService->createCharacteristic(
        CHARACTERISTIC_UUID,
        NIMBLE_PROPERTY::READ | NIMBLE_PROPERTY::NOTIFY // read and notify (notify is updating unsolicited when data changes)
    );
}

void bleTask(void *pvParameters){
    setupBLE();
    
    char buffer[BLE_MSG_SIZE];

    while (1){
        if(xQueueReceive(bleQueue, &buffer, portMAX_DELAY)){
            pCharacteristic->setValue(buffer);
            pCharacteristic->notify();

            Serial.print("Notified: ");
            Serial.println(buffer);
        }
    }
}