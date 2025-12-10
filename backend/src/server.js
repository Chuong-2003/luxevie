import http from 'node:http';
import app from './app.js';
import { connectDB } from './config/db.js';


const port = process.env.PORT || 5000;

async function start() {
  try {
    await connectDB();
    const server = http.createServer(app);

    server.listen(port, () => {
      console.log(`[server] http://localhost:${port}`);
    });
  } catch (err) {
    console.error('[server] Failed:', err);
    process.exit(1);
  }
}
start();
