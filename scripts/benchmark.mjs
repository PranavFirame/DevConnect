import http from 'http';

const GRAPHQL_ENDPOINT = 'http://localhost:3000/api/graphql';
const HEALTH_ENDPOINT = 'http://localhost:3000/api/health';

async function makePostRequest(url, data) {
  const parsed = new URL(url);
  const postData = JSON.stringify(data);

  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: parsed.hostname,
        port: parsed.port,
        path: parsed.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          resolve({ status: res.statusCode, body, bytes: Buffer.byteLength(body) });
        });
      }
    );
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function runBenchmark() {
  console.log('=== DevConnect Performance & Latency Benchmark ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Testing endpoint:', GRAPHQL_ENDPOINT);

  const iterations = 10;
  const queries = [
    {
      name: 'Discussions Feed (Limit 15, sorted newest)',
      query: `
        query BenchFeed {
          discussions(limit: 15, sort: "newest") {
            totalCount
            discussions {
              id
              title
              slug
              score
              commentsCount
              author { username displayName }
              tags { name slug }
            }
          }
        }
      `,
    },
    {
      name: 'Full-text Search for "graphql"',
      query: `
        query BenchSearch {
          search(query: "graphql", limit: 10) {
            totalCount
            discussions {
              id
              title
              slug
              score
            }
          }
        }
      `,
    },
    {
      name: 'Tags Catalog Query',
      query: `
        query BenchTags {
          tags(limit: 20) {
            id
            name
            slug
            postCount
          }
        }
      `,
    },
  ];

  for (const q of queries) {
    console.log(`\n--- Benchmarking: ${q.name} ---`);
    const latencies = [];
    let responseBytes = 0;

    for (let i = 0; i < iterations; i++) {
      const start = process.hrtime.bigint();
      try {
        const res = await makePostRequest(GRAPHQL_ENDPOINT, { query: q.query });
        const end = process.hrtime.bigint();
        const durationMs = Number(end - start) / 1_000_000;
        latencies.push(durationMs);
        responseBytes = res.bytes;
      } catch (err) {
        console.error(`Request ${i + 1} failed:`, err.message);
      }
    }

    if (latencies.length > 0) {
      const avg = (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(2);
      const min = Math.min(...latencies).toFixed(2);
      const max = Math.max(...latencies).toFixed(2);
      console.log(`  Requests Completed: ${latencies.length}/${iterations}`);
      console.log(`  Payload Size:       ${responseBytes} bytes (${(responseBytes / 1024).toFixed(2)} KB)`);
      console.log(`  Average Latency:    ${avg} ms`);
      console.log(`  Min Latency:        ${min} ms`);
      console.log(`  Max Latency:        ${max} ms`);
    } else {
      console.log('  Note: Server not active at port 3000. Run during dev/prod server runtime.');
    }
  }

  console.log('\n=== Benchmark Script Ready ===');
}

runBenchmark().catch(console.error);
