#include <String>
#include "queues.h"
#include "ble.h"

volatile bool connected = false;
class ServerCallbacks : public NimBLEServerCallbacks{
    void onConnect(NimBLEServer* pServer) {
        connected = true;
        Serial.println("Client connected!!");
    }

    void onDisconnect(NimBLEServer* pServer){
        connected = false;
        Serial.println("Client disconnected!! Start advertising..");

        vTaskDelay(pdMS_TO_TICKS(25)); // wait a little bit
        NimBLEDevice::startAdvertising();
    }
} serverCallbacks;

class CharacteristicCallbacks : public NimBLECharacteristicCallbacks{
    void onSubscribe(NimBLECharacteristic* pCharacteristic, NimBLEConnInfo& connInfo){
        std::string str = "Client ID: ";
        str += connInfo.getConnHandle();
        str += "Address: ";
        str += connInfo.getAddress().toString();
        Serial.printf("%s\n", str);
    }
} characteristicCallbacks;

// initialize BLE as GATT server 
void setupBLE(){
    
    NimBLEDevice::init("ESP32 NimBLE");
    NimBLEServer* pServer = NimBLEDevice::createServer(); // create GATT server
    pServer->setCallbacks(&serverCallbacks); // set callbacks for the server (disconnected and connected)

    // create your service with the generated UUID
    NimBLEService* pService = pServer->createService(SERVICE_UUID);
    
    // create set your characteristic
    pCharacteristic = pService->createCharacteristic(
        CHARACTERISTIC_UUID,
        NIMBLE_PROPERTY::READ | NIMBLE_PROPERTY::NOTIFY // read and notify (notify is updating unsolicited when data changes)
    );
    pCharacteristic->setCallbacks(&characteristicCallbacks); // set callbacks for the characteristic

    // start services when finished creating characteristics
    pService -> start();

    // create an advertising instance and set the name
    NimBLEAdvertising* pAdvertising = NimBLEDevice::getAdvertising();
    pAdvertising->setName("ESP32-Device");

    // add the service to the advertising instance and start advertising
    pAdvertising->addServiceUUID(pService->getUUID());
    pAdvertising->enableScanResponse(true);
    pAdvertising-> start();

    Serial.printf("Advertising started...\n");
}

void bleTask(void *pvParameters){
    setupBLE();
    
    char buffer[BLE_MSG_SIZE];

    while (1){
        if(xQueueReceive(bleQueue, buffer, portMAX_DELAY)){
            
            // 
            if(connected){
                pCharacteristic->setValue(buffer);
                pCharacteristic->notify();
                vTaskDelay(pdMS_TO_TICKS(25)); // notify delay
            }
            Serial.print("Data sent: ");
            Serial.println(buffer);

            vTaskDelay(pdMS_TO_TICKS(2000));
        }
    }
}