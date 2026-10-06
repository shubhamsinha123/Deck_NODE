/* eslint-disable no-console */
const http = require('http');

const PORT = process.env.PORT || 5000;
const URL = `http://localhost:${PORT}/api/v1/airports`;
const TOTAL_REQUESTS = 65;

function makeRequest(index) {
  return new Promise((resolve) => {
    http
      .get(URL, (res) => {
        let rawData = '';
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          const remaining = res.headers['ratelimit-remaining'] || 'N/A';
          resolve({
            index,
            status: res.statusCode,
            remaining,
            body: rawData,
          });
        });
      })
      .on('error', (err) => {
        resolve({
          index,
          status: 'ERROR',
          error: err.message,
        });
      });
  });
}

async function runStressTest() {
  console.log(`\n🚀 Starting Real-Time Rate Limiter Test against ${URL}`);
  console.log(`Sending ${TOTAL_REQUESTS} requests in rapid succession...\n`);

  let allowedCount = 0;
  let blockedCount = 0;

  for (let i = 1; i <= TOTAL_REQUESTS; i += 1) {
    const res = await makeRequest(i);
    if (res.status === 200) {
      allowedCount += 1;
      console.log(`[Req #${i.toString().padStart(2, '0')}] Status: 200 OK | Remaining: ${res.remaining}`);
    } else if (res.status === 429) {
      blockedCount += 1;
      console.log(`[Req #${i.toString().padStart(2, '0')}] Status: 429 TOO_MANY_REQUESTS | BLOCKED by Gateway Middleware!`);
    } else {
      console.log(`[Req #${i.toString().padStart(2, '0')}] Status: ${res.status} | Error: ${res.error || 'Unknown'}`);
    }
  }

  console.log('\n================ TEST SUMMARY ================');
  console.log(`Total Requests Sent : ${TOTAL_REQUESTS}`);
  console.log(`Allowed (200 OK)    : ${allowedCount}`);
  console.log(`Blocked (429 Error) : ${blockedCount}`);
  console.log('==============================================\n');

  if (blockedCount > 0 && allowedCount > 0) {
    console.log('✅ Rate Limiter is WORKING as expected in Real Time!');
  } else {
    console.log('❌ Verify your server is running on port ' + PORT);
  }
}

runStressTest();
