# Kitchen Rush

A fast-paced co-op cooking game for the browser. Chop, grill, fry, plate and serve before the orders expire.

- Two players can join on one keyboard.
- Phones on the same Wi-Fi can act as additional controllers (up to six phone controllers).
- Canvas-based graphics, timed orders, combos, burning food and dirty dishes.
- No third-party runtime dependencies; uses Node.js built-ins.

## Run locally

1. Install Node.js 18 or newer.
2. Open a terminal in this folder.
3. Run:

   ```bash
   node server.js
   ```

4. On the laptop, open `http://localhost:3000`.
5. Connect phones to the same Wi-Fi and open the controller address printed in the terminal, such as `http://192.168.1.10:3000/pad`.
6. On the laptop, press a movement key or Space to join/start. On phones, use the on-screen controls.

If your computer firewall asks whether Node.js can accept local network connections, allow it on private networks. Do not expose the server to the public internet.

## Keyboard controls

| Player | Move | Pick up / drop | Chop / wash | Dash |
|---|---|---|---|---|
| P1 | W A S D | E | F | Q |
| P2 | Arrow keys | Enter | `/` | Right Shift |

## Tech stack

- HTML, CSS and JavaScript
- HTML5 Canvas
- Node.js built-in HTTP server
- Server-Sent Events for controller input delivery

## Notes

This project is designed for local play on a trusted Wi-Fi network. The server has no accounts or authentication; do not port-forward it or expose it to untrusted networks.
