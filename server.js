const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const dgram = require('dgram');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = 8000;

// Middleware untuk static files
app.use(express.static('public'));

// Endpoint utama
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Fungsi untuk mendapatkan waktu dari server NTP
function getNetworkTime(host, port, callback) {
    const client = dgram.createSocket('udp4');
    const ntpData = Buffer.alloc(48);
    ntpData[0] = 0b11100011; // NTP request header

    client.send(ntpData, 0, ntpData.length, port, host, (err) => {
        if (err) {
            client.close();
            return callback(err);
        }
    });

    client.on('message', (msg) => {
        client.close();
        const secondsSince1900 = msg.readUIntBE(40, 4) - 2208988800; // Convert NTP time to Unix time
        const date = new Date(secondsSince1900 * 1000);
        callback(null, date);
    });

    client.on('error', (err) => {
        client.close();
        callback(err);
    });
}

// Socket.io untuk komunikasi real-time
io.on('connection', (socket) => {
    console.log('Client connected');

    socket.on('get-ntp-time', ({ host, port }) => {
        getNetworkTime(host, port, (err, date) => {
            if (err) {
                console.error('NTP Error:', err.message);
                socket.emit('ntp-error', { message: err.message });
            } else {
                console.log(`Time from ${host}:${port} - ${date}`);
                socket.emit('ntp-time', { time: date.toString() });
            }
        });
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Menjalankan server
server.listen(PORT, () => {
    console.log(`NTP Client running at http://localhost:${PORT}`);
});
