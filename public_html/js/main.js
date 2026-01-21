// --- STATE GLOBAL ---
let currentLoadedName = null; // Para saber se estamos a editar um existente

// --- SISTEMA DE MODAIS (Promises) ---
const Modal = {
    overlay: document.getElementById('custom-modal'),
    title: document.getElementById('modal-title'),
    msg: document.getElementById('modal-msg'),
    inputContainer: document.getElementById('modal-input-container'),
    input: document.getElementById('modal-input'),
    btnConfirm: document.getElementById('modal-btn-confirm'),
    btnCancel: document.getElementById('modal-btn-cancel'),

    // Função interna para resetar e mostrar
    _show: function(title, text, hasInput = false, placeholder = '') {
        return new Promise((resolve) => {
            this.title.textContent = title;
            this.msg.textContent = text;
            this.msg.style.display = text ? 'block' : 'none';
            
            if (hasInput) {
                this.inputContainer.style.display = 'block';
                this.input.value = placeholder;
            } else {
                this.inputContainer.style.display = 'none';
            }

            // Handlers temporários
            const handleConfirm = () => {
                cleanup();
                resolve(hasInput ? this.input.value : true);
            };
            
            const handleCancel = () => {
                cleanup();
                resolve(false); // Retorna false se cancelar
            };

            const cleanup = () => {
                this.overlay.classList.remove('open');
                this.btnConfirm.removeEventListener('click', handleConfirm);
                this.btnCancel.removeEventListener('click', handleCancel);
                // Remover handler de Enter no input
                this.input.onkeydown = null; 
            };

            // Bind Events
            this.btnConfirm.onclick = handleConfirm;
            this.btnCancel.onclick = handleCancel;
            
            // Atalho tecla Enter no input
            if(hasInput) {
                this.input.onkeydown = (e) => { if(e.key === 'Enter') handleConfirm(); };
            }

            this.overlay.classList.add('open');
            if(hasInput) setTimeout(() => this.input.focus(), 100);
        });
    },

    alert: async function(title, msg) {
        this.btnCancel.style.display = 'none'; // Esconde cancelar
        await this._show(title, msg);
        this.btnCancel.style.display = 'inline-block';
    },

    confirm: function(title, msg) {
        return this._show(title, msg);
    },

    prompt: function(title, defaultValue = '') {
        return this._show(title, '', true, defaultValue);
    }
};

// --- SISTEMA DE TABS ---
function toggleActiveTab(clickedTab, allTabsSelector, contentId, allContentSelector) {
    document.querySelectorAll(allContentSelector).forEach(el => el.style.display = 'none');
    document.getElementById(contentId).style.display = 'block';
    clickedTab.parentElement.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    clickedTab.classList.add('active');
}

function switchInputTab(element, id) { toggleActiveTab(element, '.tab', id, '.tab-content-input'); }
function switchResTab(element, id) { toggleActiveTab(element, '.tab', id, '.res-content'); }

// --- GESTÃO DE LINHAS ---
function addHeader() { createRow('headers-container'); }
function addParam() { createRow('params-container'); }

function createRow(containerId) {
    const div = document.createElement('div');
    div.className = 'kv-row';
    div.innerHTML = `
        <input type="text" class="key-input" placeholder="Key">
        <input type="text" class="val-input" placeholder="Value">
        <button class="btn-small" onclick="this.parentElement.remove()" style="background:#d9534f">x</button>
    `;
    document.getElementById(containerId).appendChild(div);
}

// Helper com valores
function createRowWithVal(containerId, key, val) {
    const div = document.createElement('div');
    div.className = 'kv-row';
    div.innerHTML = `
        <input type="text" class="key-input" placeholder="Key" value="${key}">
        <input type="text" class="val-input" placeholder="Value" value="${val}">
        <button class="btn-small" onclick="this.parentElement.remove()" style="background:#d9534f">x</button>
    `;
    document.getElementById(containerId).appendChild(div);
}

function getKVData(containerId) {
    const rows = document.querySelectorAll(`#${containerId} .kv-row`);
    let data = {};
    rows.forEach(row => {
        const k = row.querySelector('.key-input').value;
        const v = row.querySelector('.val-input').value;
        if(k) data[k] = v;
    });
    return data;
}

// --- STORAGE & COLLECTIONS ---
const STORAGE_KEY = 'poorman_collections';

function loadCollections() {
    const container = document.getElementById('collections-container');
    const saved = localStorage.getItem(STORAGE_KEY);
    const collections = saved ? JSON.parse(saved) : [];

    if (collections.length === 0) {
        container.innerHTML = '<p style="font-size: 0.8rem; color: #555; font-style: italic; padding: 5px;">No saved requests.</p>';
        return;
    }

    container.innerHTML = '';
    collections.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'collection-item';
        // Se este for o item carregado, destaca-o visualmente (opcional)
        if (item.name === currentLoadedName) {
            div.style.background = 'rgba(255,255,255,0.1)';
            div.style.borderColor = '#555';
        }

        div.onclick = (e) => {
            if(e.target.classList.contains('collection-del-btn')) return;
            restoreRequest(index);
        };

        div.innerHTML = `
            <span class="collection-method method-${item.method}">${item.method}</span>
            <span class="collection-name" title="${item.name}">${item.name}</span>
            <button class="collection-del-btn" onclick="deleteRequest(${index})">✕</button>
        `;
        container.appendChild(div);
    });
}

// LÓGICA DE GUARDAR (ATUALIZADA)
async function saveRequest() {
    // 1. Define nome sugerido (o atual carregado ou genérico)
    let suggestedName = currentLoadedName || "My Request";
    
    // 2. Abre Modal Prompt Customizado
    const name = await Modal.prompt("Save Request", suggestedName);
    if (!name || name.trim() === '') return; // User cancelou ou vazio

    // 3. Recolher dados
    const reqData = {
        name: name.trim(),
        url: document.getElementById('url').value,
        method: document.getElementById('method').value,
        headers: getKVData('headers-container'),
        params: getKVData('params-container'),
        bodyRaw: document.getElementById('request-body-raw').value,
        verifySSL: document.getElementById('verify-ssl').checked,
        savedAt: new Date().toISOString()
    };

    // 4. Ler DB local
    const saved = localStorage.getItem(STORAGE_KEY);
    let collections = saved ? JSON.parse(saved) : [];

    // 5. Verificar duplicados (pelo Nome)
    const existingIndex = collections.findIndex(c => c.name === reqData.name);

    if (existingIndex !== -1) {
        // JÁ EXISTE: Perguntar se substitui
        const overwrite = await Modal.confirm(
            "Request already exists", 
            `A request named "${reqData.name}" already exists. Do you want to overwrite it?`
        );
        
        if (overwrite) {
            collections[existingIndex] = reqData; // Atualiza
            await Modal.alert("Success", "Request updated successfully!");
        } else {
            return; // Cancelou a sobreposição
        }
    } else {
        // NOVO
        collections.unshift(reqData); // Adiciona no início
    }
    
    // 6. Persistir e Atualizar UI
    localStorage.setItem(STORAGE_KEY, JSON.stringify(collections));
    currentLoadedName = reqData.name; // Define como atual
    loadCollections();
}

async function deleteRequest(index) {
    // Modal Confirm Customizado
    const confirmDel = await Modal.confirm("Delete Request", "Are you sure you want to delete this saved request?");
    if(!confirmDel) return;
    
    const saved = localStorage.getItem(STORAGE_KEY);
    let collections = saved ? JSON.parse(saved) : [];
    
    // Se apagarmos o que está carregado, resetamos o tracking
    if(collections[index].name === currentLoadedName) {
        currentLoadedName = null;
    }

    collections.splice(index, 1);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(collections));
    loadCollections();
}

function restoreRequest(index) {
    const saved = localStorage.getItem(STORAGE_KEY);
    const collections = saved ? JSON.parse(saved) : [];
    const item = collections[index];

    if (!item) return;

    // TRACKING: Definir este como o atual
    currentLoadedName = item.name;

    // Restaurar campos
    document.getElementById('url').value = item.url;
    document.getElementById('method').value = item.method;
    document.getElementById('request-body-raw').value = item.bodyRaw || '';

    const shouldVerify = (item.verifySSL !== undefined) ? item.verifySSL : true;
    document.getElementById('verify-ssl').checked = shouldVerify;
    
    // Restaurar Headers
    const headerContainer = document.getElementById('headers-container');
    headerContainer.innerHTML = ''; 
    if (item.headers && Object.keys(item.headers).length > 0) {
        Object.entries(item.headers).forEach(([k, v]) => createRowWithVal('headers-container', k, v));
    } else {
        createRow('headers-container'); 
    }

    // Restaurar Params
    const paramsContainer = document.getElementById('params-container');
    paramsContainer.innerHTML = '';
    if (item.params && Object.keys(item.params).length > 0) {
        Object.entries(item.params).forEach(([k, v]) => createRowWithVal('params-container', k, v));
    }

    // Atualizar visual da lista para mostrar qual está selecionado
    loadCollections();
}

// --- ENVIO DO PEDIDO (SEND) ---
async function sendRequest() {
    const btn = document.getElementById('send-btn');
    const originalText = btn.textContent;
    btn.textContent = '...'; btn.disabled = true;
    document.getElementById('response-area').style.display = 'none';

    try {
        const urlRaw = document.getElementById('url').value;
        const method = document.getElementById('method').value;
        const headers = getKVData('headers-container');
        const params = getKVData('params-container');
        
        let urlObj;
        try { urlObj = new URL(urlRaw); } catch(e) { throw new Error("Invalid URL. Please include http:// or https://"); }
        
        Object.keys(params).forEach(k => urlObj.searchParams.append(k, params[k]));

        let bodyContent = '';
        const rawJson = document.getElementById('request-body-raw').value;
        if (!['GET', 'HEAD'].includes(method) && rawJson.trim() !== '') {
            bodyContent = rawJson;
            if(!Object.keys(headers).some(k => k.toLowerCase() === 'content-type')) {
                headers['Content-Type'] = 'application/json';
            }
        }

        const verifySSL = document.getElementById('verify-ssl').checked;

        const payload = {
            url: urlObj.toString(),
            method: method,
            headers: headers,
            body: bodyContent,
            verify_ssl: verifySSL,
            csrf: CSRF_TOKEN
        };

        const start = performance.now();
        const res = await fetch('/api/send', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });
        const end = performance.now();
        const data = await res.json();

        const resArea = document.getElementById('response-area');
        resArea.style.display = 'block';
        
        const statusEl = document.getElementById('status-code');
        statusEl.textContent = data.status || 'ERR';
        statusEl.className = 'status-badge ' + (data.status >= 200 && data.status < 300 ? 'status-200' : 'status-error');
        document.getElementById('time-taken').textContent = ((end - start).toFixed(0)) + 'ms';

        if (data.error) {
            document.getElementById('res-body').textContent = data.error;
        } else {
            try {
                const json = JSON.parse(data.body);
                document.getElementById('res-body').textContent = JSON.stringify(json, null, 2);
            } catch(e) {
                document.getElementById('res-body').textContent = data.body || "(No content)";
            }
            document.getElementById('res-headers-container').innerHTML = parseHeadersToHtml(data.res_headers);
            document.getElementById('req-headers-container').innerHTML = parseHeadersToHtml(data.req_headers);
        }
        resArea.scrollIntoView({behavior: "smooth"});

    } catch (err) {
        await Modal.alert("Error", err.message); // Usar modal bonito para erros também
    } finally {
        btn.textContent = originalText; btn.disabled = false;
    }
}

function parseHeadersToHtml(str) {
    if(!str) return '<p style="color:#666">No headers captured.</p>';
    let html = '<table class="header-table">';
    str.trim().split(/[\r\n]+/).forEach(line => {
        if(line.includes(':')) {
            const parts = line.split(':');
            const k = parts.shift().trim();
            const v = parts.join(':').trim();
            html += `<tr><td class="key">${k}</td><td class="val">${v}</td></tr>`;
        } else {
            if(line.trim()) html += `<tr><td colspan="2" style="color:#888; border-bottom:1px solid #444;"><i>${line}</i></td></tr>`;
        }
    });
    return html + '</table>';
}

// INIT
document.addEventListener('DOMContentLoaded', () => {
    loadCollections();
});