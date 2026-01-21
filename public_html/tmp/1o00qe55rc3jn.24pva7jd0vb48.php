<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <title>Poorman - API Tester</title>
    <link rel="stylesheet" href="/css/main.css">
</head>
<body>

<div class="sidebar">
        <h3 class="app-title"><span class="icon-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline> <polyline points="8 6 2 12 8 18"></polyline>  <circle cx="12" cy="12" r="3"></circle>       <line x1="12" y1="9" x2="12" y2="3"></line>     <line x1="12" y1="21" x2="12" y2="15"></line></svg>
            </span>
            Poorman - API Tester</h3>

        <div class="collections bb">
            <h5 style="margin-top: 0; margin-bottom: 10px; color: #aaa;">Collections</h5>
            <div id="collections-container">
                <p style="font-size: 0.8rem; color: #555; font-style: italic;">No saved requests.</p>
            </div>
        </div>

        <div class="input-group bb">
            <h5>Request Headers</h5>
            <label>Global Headers <button type="button" class="btn-small" onclick="addHeader()">+</button></label>
            <div id="headers-container">
                <div class="kv-row">
                    <input type="text" class="key-input" placeholder="Key" value="Content-Type">
                    <input type="text" class="val-input" placeholder="Value" value="application/json">
                    <button class="btn-small" onclick="this.parentElement.remove()" style="background:#d9534f">x</button>
                </div>
            </div>
            <small style="color:#666; font-size:0.7rem">Ex: Authorization Tokens</small>
        </div>

        <div class="input-group bb mt-2 mb-4">
            <label style="display: flex; align-items: center; cursor: pointer;">
                <input type="checkbox" id="verify-ssl" checked style="width: auto; margin-right: 10px;">
                <span style="font-size: 0.9rem;">Verify SSL Certificates</span>
            </label>
            <small style="color: #666; font-size: 0.7rem; display: block; margin-top: 5px; margin-left: 24px;">
                Disable this if using self-signed certs (localhost).
            </small>
        </div>

        <footer class="app-footer">
            <div class="footer-content">
                <div>&copy; <?= (date('Y')) ?> <strong>Poorman - Api Tester</strong>.</div>
                <div class="mb-3">All rights reserved.</div>
                <div class="mb-3">Developed by <a href="https://cotonet.pt" target="_blank">Cotonet</a></div>
                <div class="version-tag">v<?= ($APP_VERSION ?? '0.0.1') ?></div>
            </div>
        </footer>

    </div>

    <div class="main">
        
        <div class="input-group" style="display: flex; gap: 10px; align-items: center;">
            <select id="method" style="width: 110px; height: 38px; font-weight: bold; background:#333;">
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
                <option value="PATCH">PATCH</option>
            </select>
            <input type="text" id="url" placeholder="https://api.exemplo.com/endpoint" value="https://jsonplaceholder.typicode.com/posts/1" style="height: 38px;">

            <button onclick="saveRequest()" style="height: 38px; background: #2d2d2d; border: 1px solid #555;" title="Save Request">SAVE</button>

            <button onclick="sendRequest()" id="send-btn" style="height: 38px; width: 100px;">SEND</button>
        </div>

        <div>
            <div class="tabs">
                <div class="tab active" onclick="switchInputTab(this, 'tab-params')">Query Params</div>
                <div class="tab" onclick="switchInputTab(this, 'tab-json')">Body (JSON)</div>
            </div>

            <div id="tab-params" class="tab-content-input active">
                <button type="button" class="btn-small" onclick="addParam()" style="margin-bottom: 10px;">+ Add Var.</button>
                <div id="params-container">
                    </div>
            </div>

            <div id="tab-json" class="tab-content-input">
                <textarea id="request-body-raw" placeholder='{ "key": "value" }' style="height: 150px; font-family: monospace; border-left: 3px solid var(--accent);"></textarea>
                <p style="color:#888; font-size:0.8rem; margin-top:5px;">JSON payload for the request body (POST/PUT).</p>
            </div>
        </div>

        <div id="response-area" style="display:none;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <h3 style="border:none; margin:0;">Response <span id="status-code" class="status-badge"></span></h3>
                <span id="time-taken" style="font-size:0.8rem; color:#888;"></span>
            </div>

            <div class="tabs">
                <div class="tab active" onclick="switchResTab(this, 'res-body-tab')">Body</div>
                <div class="tab" onclick="switchResTab(this, 'res-headers-tab')">Response Headers</div>
                <div class="tab" onclick="switchResTab(this, 'req-debug-tab')">Debug Request</div>
            </div>

            <div id="res-body-tab" class="res-content active">
                <pre id="res-body">Waiting for response...</pre>
            </div>
            
            <div id="res-headers-tab" class="res-content">
                <div id="res-headers-container"></div>
            </div>
            
            <div id="req-debug-tab" class="res-content">
                <div style="background:#333; padding:10px; margin-bottom:10px; border-left: 3px solid #d9534f; font-size:0.8rem;">
                    Headers sent by the PHP server (cURL):
                </div>
                <div id="req-headers-container"></div>
            </div>
        </div>

    </div>

    <div id="custom-modal" class="modal-overlay">
        <div class="modal-box">
            <div class="modal-header" id="modal-title">Title</div>
            <div class="modal-body">
                <p id="modal-msg"></p>
                <div id="modal-input-container" style="display:none;">
                    <input type="text" id="modal-input" autocomplete="off">
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" id="modal-btn-cancel">Cancel</button>
                <button class="btn-primary" id="modal-btn-confirm">OK</button>
            </div>
        </div>
    </div>

    <script>const CSRF_TOKEN = "<?= ($csrf_token) ?>";</script>
    <script src="/js/main.js"></script>

</body>
</html>