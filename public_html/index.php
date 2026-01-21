<?php
require '../vendor/autoload.php';

$f3 = \Base::instance();

$f3->set('APP_VERSION', '1.1.0');

// Configuração de Segurança e Debug
$f3->set('DEBUG', 3);
$f3->set('UI', '../app/views/');

// Rota Principal: Renderiza a Interface
$f3->route('GET /', function($f3) {
    // Gerar Token CSRF e guardar na sessão
    if (!$f3->exists('SESSION.csrf')) {
        $f3->set('SESSION.csrf', $f3->hash($f3->get('ip') . microtime()));
    }
    // Passar token para a view
    $f3->set('csrf_token', $f3->get('SESSION.csrf'));
    echo \Template::instance()->render('main.html');
});

// Rota da API (Proxy): Recebe o pedido do JS e executa o cURL
$f3->route('POST /api/send', function($f3) {
    header('Content-Type: application/json');
    
    $input = json_decode($f3->get('BODY'), true);

    // 1. Validação CSRF
    if (empty($input['csrf']) || $input['csrf'] !== $f3->get('SESSION.csrf')) {
        http_response_code(403);
        echo json_encode(['error' => 'Security Violation (CSRF Token mismatch)']);
        return;
    }

    // 2. Validação de Inputs
    $url = filter_var($input['url'], FILTER_VALIDATE_URL);
    $method = strtoupper($input['method'] ?? 'GET');
    $headers = $input['headers'] ?? [];
    $body = $input['body'] ?? '';
    $verifySSL = $input['verify_ssl'] ?? true;

    if (!$url) {
        echo json_encode(['error' => 'Invalid URL']);
        return;
    }

    // 3. Execução do Pedido (cURL)
    // Usamos cURL nativo para ter controlo total sobre headers e resposta
    $ch = curl_init();
    
    // Preparar Headers para o cURL (formato: ["Key: Value"])
    $formattedHeaders = [];
    foreach ($headers as $key => $val) {
        $formattedHeaders[] = "$key: $val";
    }

    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $formattedHeaders);
    curl_setopt($ch, CURLOPT_HEADER, true); // Queremos ver os headers da resposta
    
    // Timeout de segurança (evitar que o servidor fique preso)
    curl_setopt($ch, CURLOPT_TIMEOUT, 10); 

    if (!empty($body) && in_array($method, ['POST', 'PUT', 'PATCH'])) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    }

    if ($verifySSL) {
        // Modo Seguro (Default)
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);
    } else {
        // Modo "Perigoso" (Para Localhost/Self-Signed)
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
    }

    curl_setopt($ch, CURLINFO_HEADER_OUT, true);

    // Se publicar na web, aqui adicionaria verificação para bloquear 
    // IPs locais (127.0.0.1, 192.168.x.x) para mitigar SSRF.

    $responseRaw = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);

    // [NOVO] Capturar os headers REAIS enviados pelo servidor
    $requestHeaders = curl_getinfo($ch, CURLINFO_HEADER_OUT);

    curl_close($ch);

    if ($curlError) {
        echo json_encode(['error' => "cURL Error: $curlError"]);
        return;
    }

    // Separar Headers do Body na resposta
    $resHeaders = substr($responseRaw, 0, $headerSize);
    $resBody = substr($responseRaw, $headerSize);

    echo json_encode([
        'status' => $httpCode,
        'req_headers' => $requestHeaders, // Enviamos isto para o JS
        'res_headers' => $resHeaders,
        'body' => $resBody,
        'time' => date('Y-m-d H:i:s')
    ]);
});

$f3->run();