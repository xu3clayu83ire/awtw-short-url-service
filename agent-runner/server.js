const http = require('http');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = 3001;

// 只接受本機來源（n8n 容器透過 host.docker.internal 連入）
function parseBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    // 多位元組字元（如中文）可能被切在兩個 chunk 邊界中間，
    // 逐一 chunk toString() 會產生替換字元，必須先 concat 成完整 Buffer 再一次解碼
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch (e) {
        reject(new Error('無法解析 JSON body：' + e.message));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

// POST /run：在指定目錄執行 shell 指令
function handleRun(req, res, body) {
  const { command, cwd } = body;
  if (!command) {
    return sendJson(res, 400, { error: '缺少必要欄位：command' });
  }

  const options = { timeout: 60000, maxBuffer: 1024 * 1024 };
  if (cwd) options.cwd = cwd;

  exec(command, options, (error, stdout, stderr) => {
    sendJson(res, 200, {
      stdout: stdout || '',
      stderr: stderr || '',
      exitCode: error ? (error.code ?? 1) : 0,
    });
  });
}

// POST /read-file：讀取檔案內容回傳字串
function handleReadFile(req, res, body) {
  const { filePath } = body;
  if (!filePath) {
    return sendJson(res, 400, { error: '缺少必要欄位：filePath' });
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    sendJson(res, 200, { success: true, filePath, content });
  } catch (e) {
    sendJson(res, 500, { error: '讀取檔案失敗：' + e.message });
  }
}

// POST /write-file：將 content 寫入 filePath
function handleWriteFile(req, res, body) {
  const { filePath, content } = body;
  if (!filePath || content === undefined) {
    return sendJson(res, 400, { error: '缺少必要欄位：filePath 或 content' });
  }

  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, 'utf8');
    sendJson(res, 200, { success: true, filePath });
  } catch (e) {
    sendJson(res, 500, { error: '寫入檔案失敗：' + e.message });
  }
}

const server = http.createServer(async (req, res) => {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: '只接受 POST 請求' });
  }

  let body;
  try {
    body = await parseBody(req);
  } catch (e) {
    return sendJson(res, 400, { error: e.message });
  }

  if (req.url === '/run') {
    handleRun(req, res, body);
  } else if (req.url === '/read-file') {
    handleReadFile(req, res, body);
  } else if (req.url === '/write-file') {
    handleWriteFile(req, res, body);
  } else {
    sendJson(res, 404, { error: '未知路徑：' + req.url });
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Agent Runner 已啟動，監聽 port ${PORT}`);
  console.log('可用端點：');
  console.log('  POST /run        { command, cwd? }');
  console.log('  POST /read-file  { filePath }');
  console.log('  POST /write-file { filePath, content }');
});
