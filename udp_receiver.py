
import socket

# Network settings
UDP_IP = "0.0.0.0"
UDP_PORT = 20777

# Create a UDP socket
sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

# Bind the socket to our chosen port
sock.bind((UDP_IP, UDP_PORT))

print(f"Listening for F1 25 telemetry on UDP port {UDP_PORT}...")

# Continuously receive telemetry packets
while True:
    data, address = sock.recvfrom(2048)

    print(f"Received {len(data)} bytes from {address}")
