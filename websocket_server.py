import asyncio
import json
import logging
from pathlib import Path

from websockets.asyncio.server import serve
from race_analysis import RaceAnalysis

# Server configuration
HOST = "127.0.0.1"
PORT = 8765
UPDATE_INTERVAL = 0.2

# Resolve the telemetry file relative to this script.
TELEMETRY_FILE = (
    Path(__file__).resolve().parent / "telemetry_latest.json"
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s"
)

logger = logging.getLogger("f1-websocket")
analysis = RaceAnalysis()
analysis_lock = asyncio.Lock()


async def telemetry_handler(websocket):
    """Stream the latest telemetry to a connected dashboard."""

    logger.info("Dashboard connected")

    last_snapshot = None

    try:
        while True:
            try:
                if TELEMETRY_FILE.exists():
                    with TELEMETRY_FILE.open(
                        "r", encoding="utf-8"
                    ) as file:
                        telemetry = json.load(file)

                    # Process once per unique telemetry timestamp across all clients.
                    async with analysis_lock:
                        if telemetry.get("timestamp") != analysis.last_timestamp:
                            analysis.process(telemetry)
                        telemetry["race_analysis"] = analysis.payload()
                    snapshot = json.dumps(telemetry, allow_nan=False)

                    if snapshot != last_snapshot:
                        await websocket.send(snapshot)
                        last_snapshot = snapshot

            except (OSError, json.JSONDecodeError) as error:
                logger.warning(
                    "Unable to read telemetry: %s", error
                )

            await asyncio.sleep(UPDATE_INTERVAL)

    except asyncio.CancelledError:
        raise

    except Exception:
        logger.exception("Dashboard connection ended")

    finally:
        logger.info("Dashboard disconnected")


async def main():
    logger.info(
        "Starting F1 WebSocket server at ws://%s:%s",
        HOST,
        PORT
    )

    async with serve(
        telemetry_handler,
        HOST,
        PORT,
        origins=["http://localhost:5173",
                 "http://localhost:5174",
                 "http://127.0.0.1:5173",
                 "http://127.0.0.1:5174"],
        max_size=2**20,
    ):
        await asyncio.Future()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("WebSocket server stopped")