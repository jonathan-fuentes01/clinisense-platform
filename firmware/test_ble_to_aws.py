"""
Firmware BLE → AWS end-to-end test script.

Simulates what the phone app does:
  1. Scans for ESP32-Device over BLE
  2. Connects and subscribes to the pH characteristic
  3. On each notification, parses the JSON and POSTs to AWS

Usage:
  pip install bleak httpx
  python test_ble_to_aws.py                        # auto-scan for ESP32-Device
  python test_ble_to_aws.py --address AA:BB:CC:DD:EE:FF  # connect by address directly
  python test_ble_to_aws.py --no-upload            # BLE only, skip AWS upload
  python test_ble_to_aws.py --mock                 # skip BLE, just test AWS upload
"""

import asyncio
import argparse
import json
import sys
from datetime import datetime, timezone

# ── CONFIG ────────────────────────────────────────────────────────────────────
DEVICE_NAME       = "ESP32-Device"
SERVICE_UUID      = "cdbe9e3f-2839-4d61-a1d9-4043e0e0eaeb"
CHARACTERISTIC_UUID = "00a81b7a-1fc2-467a-aabc-8bf7a71bbf5c"

API_ENDPOINT = "https://ttwf6zzrv7.execute-api.us-east-2.amazonaws.com/dev/readings"
PATIENT_ID   = "P-1773953757098"   # change to whichever patient you're testing
# ─────────────────────────────────────────────────────────────────────────────


def parse_notification(data: bytearray) -> dict | None:
    """Parse the JSON payload the ESP32 sends: {"Voltage": x, "pH Value": y}"""
    try:
        text = data.decode("utf-8").strip()
        parsed = json.loads(text)
        ph      = parsed.get("pH Value") or parsed.get("ph") or parsed.get("pH")
        voltage = parsed.get("Voltage") or parsed.get("voltage")
        if ph is None:
            print(f"  [WARN] No pH field found in: {text}")
            return None
        return {"pH": float(ph), "voltage": float(voltage) if voltage is not None else None}
    except Exception as e:
        print(f"  [ERROR] Failed to parse notification: {data!r} — {e}")
        return None


async def post_to_aws(session, pH: float, voltage: float | None):
    """POST reading to the AWS Lambda endpoint."""
    payload = {
        "patientId": PATIENT_ID,
        "pH": pH,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    if voltage is not None:
        payload["voltage"] = voltage

    resp = await session.post(API_ENDPOINT, json=payload)
    if resp.status_code == 200:
        print(f"  [AWS] ✓ Stored — {resp.json()['stored']['SK']}")
    else:
        print(f"  [AWS] ✗ Failed {resp.status_code}: {resp.text}")


# ── BLE MODE ──────────────────────────────────────────────────────────────────
async def run_ble(address: str | None, upload: bool):
    from bleak import BleakClient, BleakScanner

    if address is None:
        print(f"Scanning for '{DEVICE_NAME}'...")
        device = await BleakScanner.find_device_by_name(DEVICE_NAME, timeout=10)
        if device is None:
            print(f"[ERROR] Could not find '{DEVICE_NAME}'. Is the ESP32 powered on and advertising?")
            sys.exit(1)
        address = device.address
        print(f"Found: {device.name}  address={address}\n")

    http_session = None
    if upload:
        import httpx
        http_session = httpx.AsyncClient()

    notification_count = 0

    def notification_handler(characteristic, data: bytearray):
        nonlocal notification_count
        notification_count += 1
        now = datetime.now().strftime("%H:%M:%S")
        print(f"[{now}] Notification #{notification_count}: {data.decode('utf-8', errors='replace')}")

        parsed = parse_notification(data)
        if parsed is None:
            return

        print(f"         pH={parsed['pH']}  voltage={parsed['voltage']}")

        if upload and http_session:
            asyncio.ensure_future(
                post_to_aws(http_session, parsed["pH"], parsed["voltage"])
            )

    async with BleakClient(address) as client:
        print(f"Connected to {address}")
        print(f"Subscribing to characteristic {CHARACTERISTIC_UUID}...\n")
        await client.start_notify(CHARACTERISTIC_UUID, notification_handler)

        print("Receiving notifications. Press Ctrl+C to stop.\n")
        try:
            while True:
                await asyncio.sleep(1)
        except KeyboardInterrupt:
            print(f"\nStopped. Received {notification_count} notifications.")
        finally:
            await client.stop_notify(CHARACTERISTIC_UUID)
            if http_session:
                await http_session.aclose()


# ── MOCK MODE (no BLE, just test AWS) ────────────────────────────────────────
async def run_mock():
    import httpx
    print("Mock mode — sending 3 test readings to AWS (no BLE needed)\n")
    test_values = [
        {"pH": 6.3, "voltage": 2.05, "label": "critical low"},
        {"pH": 6.9, "voltage": 2.21, "label": "warning"},
        {"pH": 7.2, "voltage": 2.35, "label": "normal"},
    ]
    async with httpx.AsyncClient() as session:
        for t in test_values:
            print(f"Sending pH={t['pH']} ({t['label']})...")
            await post_to_aws(session, t["pH"], t["voltage"])
            await asyncio.sleep(1)
    print("\nDone. Check your patient dashboard or run:")
    print(f"  curl {API_ENDPOINT.replace('/readings', f'/patients/{PATIENT_ID}/readings')}")


# ── MAIN ──────────────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description="ESP32 BLE → AWS test")
    parser.add_argument("--address",   help="BLE device address (skip scan)")
    parser.add_argument("--no-upload", action="store_true", help="BLE only, skip AWS")
    parser.add_argument("--mock",      action="store_true", help="Skip BLE, test AWS only")
    args = parser.parse_args()

    if args.mock:
        asyncio.run(run_mock())
    else:
        asyncio.run(run_ble(args.address, upload=not args.no_upload))


if __name__ == "__main__":
    main()
