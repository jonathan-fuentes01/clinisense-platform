#ifndef BLE_SERVER_CLIENT
#define BLE_SERVER_CLIENT

// define 128-bit UUID values using (https://www.uuidgenerator.net/)
#define SERVICE_UUID "cdbe9e3f-2839-4d61-a1d9-4043e0e0eaeb"
#define CHARACTERISTIC_UUID "00a81b7a-1fc2-467a-aabc-8bf7a71bbf5c"

QueueHandle_t bleQueue;

void bleTask(void *pvParameters);
void setupBLE();

#endif