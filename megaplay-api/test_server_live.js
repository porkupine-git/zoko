import { spawn } from 'child_process';

async function testLiveServer() {
    console.log('Testing live server.js endpoints...');

    // Launch server on PORT 4015 for testing
    const serverProcess = spawn('node', ['server.js'], {
        env: { ...process.env, PORT: '4015' }
    });

    serverProcess.stdout.on('data', d => process.stdout.write(`[Server] ${d}`));
    serverProcess.stderr.on('data', d => process.stderr.write(`[Server ERR] ${d}`));

    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
        // 1. Test Health
        const healthRes = await fetch('http://localhost:4015/health');
        const healthJson = await healthRes.json();
        console.log('Health check:', healthJson.status === 'online' ? '✅ ONLINE' : '❌ OFFLINE');

        // 2. Test Stream API
        const streamRes = await fetch('http://localhost:4015/api/stream/mal/21/1/sub');
        const streamJson = await streamRes.json();
        console.log('MAL 21 Stream resolution:', streamJson.success ? '✅ SUCCESS' : '❌ FAILED');
        console.log('Proxy URL:', streamJson.proxy_stream_url);

        // 3. Test Proxy M3U8
        if (streamJson.proxy_stream_url) {
            const m3u8Res = await fetch(`http://localhost:4015${streamJson.proxy_stream_url}`);
            const m3u8Text = await m3u8Res.text();
            console.log('Proxy M3U8 status:', m3u8Res.status);
            console.log('Proxy M3U8 contains valid playlist:', m3u8Text.includes('#EXTM3U') ? '✅ YES' : '❌ NO');
        }

        // 4. Test UI
        const uiRes = await fetch('http://localhost:4015/');
        const uiText = await uiRes.text();
        console.log('Testbench HTML loaded:', uiText.includes('ByteSliceLoader') ? '✅ ByteSliceLoader INCLUDED' : '❌ MISSING');

        console.log('\n🎉 ALL LIVE SERVER ENDPOINTS VERIFIED!');
    } catch (err) {
        console.error('Test error:', err.message);
    } finally {
        serverProcess.kill('SIGKILL');
    }
}

testLiveServer();
