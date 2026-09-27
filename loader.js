console.log("\n%c  Welcome to ❤ BetterNemo - " + BetterNemoVersion + " ❤ for Nemo o(*￣▽￣*)ブ  %c \n\n", "border-radius: 5px; padding: 2px; font-weight: bold;" + "background-color: #20A5C4; font-size: 16px; color: white;", "");
function hook(id, name, getThis = false) {
    var ready = false;
    var map = new Map();
    var proxy = {
        configurable: true,
        get: function () {
            return map.get(this);
        },
        set: function (value) {
            map.set(this, value);
            if (!getThis) window[name] = value;
            else window[name] = this;
            ready = true;
            return void 0;
        },
    };
    Object.defineProperty(Object.prototype, id, proxy);
}
hook("./src/webview/runtime/index.ts", "HookRuntime");
hook("./src/common/redux/index.ts", "HookRedux");
hook("./node_modules/@crc/stage/build/core/actors/brush.js", "HookBrush");
hook("./node_modules/@crc/stage/build/core/utils/index.js", "HookUtils");
hook("./node_modules/@crc/blink/dist/core/di/index.js", "HookDi");
hook("./node_modules/@crc/blink/dist/blocks/defs.js", "HookBlocksDefs");
hook("./node_modules/@crc/stage/build/core/scenes/scene.js", "HookScene");
hook("./src/i18n/zh_CN.ts", "HookMsgZhCN");
hook("./src/webview/bridge/index.ts", "HookBridge");
hook("./src/webview/bridge/messages.ts", "HookBridgeMsg");
hook("./node_modules/@crc/heart/build/opti/compiler.js", "HookOptiCompiler");
hook("./node_modules/@crc/stage/build/core/physics/actor_body.js", "HookActorBody");
hook("./node_modules/dsbridge/index.js", "HookDsbridge");
hook("./node_modules/@crc/blink/dist/core/singletons/theme.js", "HookTheme");
hook("./src/i18n/index.ts", "HookI18n");

window.BN_CUEL_BRIDGE = {
    WORK_EXT_DATA: null,
    _callbacks: {
        workExtDataLoaded: [],
    },
    _eventType: {
        workExtDataLoaded: "switch",
    },
    on: function (event, callback) {
        this._callbacks[event].push(callback);
    },
    emit: function (event) {
        for (const callback of this._callbacks[event]) {
            callback();
        }
    },
};

// --------------- Player检测 & 加载动画 ---------------
const PLAYER = new URLSearchParams(window.location.search).get("player");
const IS_BN_APP = new URLSearchParams(window.location.search).get("is_bn_app");
if (PLAYER)
    (async function () {
        while (!document["body"]) await new Promise(resolve => setTimeout(resolve, 100));
        document.body.insertAdjacentHTML("afterbegin", `<div class="loader-mask"><div class="loader">${'<div class="text"><span>Better Nemo</span></div>'.repeat(9)}<div class="line"></div></div></div>`);
    })();
function hideLoader() {
    if (!document.querySelector(".loader-mask")) return;
    document.querySelector(".loader-mask").style.display = "none";
}
function setLoaderInfo(info, id = 1) {
    if (id == 1) document.title = info;
    if (!document.querySelector(".loader")) return;
    if (!document.querySelector(`.loader > .info.info-${id}`)) document.querySelector(".loader").insertAdjacentHTML("beforeend", `<div class="info info-${id}" style="top:calc(50% + ${20 + id * 20}px)"><span>${info}</span></div>`);
    document.querySelector(`.loader > .info.info-${id}`).innerHTML = `<span>${info}</span>`;
}

// --------------- 环境检测 ---------------
function isPhoneTestEnv() {
    if (PLAYER) return false;
    return !navigator.userAgent.includes("__TEST_ENV__") && BetterNemoVersion === "999999.99";
}
function isPCTestEnv() {
    return navigator.userAgent.includes("__TEST_ENV__") && BetterNemoVersion === "999999.99";
}
function isCloudflareEnv() {
    return window.location.hostname == "bn-p.pages.dev";
}
// --------------- 调试配置 ---------------
WS_DEBUG_SERVER = "ws://192.168.1.12:1234";
HTTP_DEBUG_SERVER = "http://192.168.1.12:8080";
// --------------- Webview调试服务器 ---------------
let debugServer = { send: () => {} };
if (isPhoneTestEnv()) {
    function reconnect() {
        console.log("重连");
        debugServer = new WebSocket(WS_DEBUG_SERVER);
        debugServer.onclose = reconnect;
        debugServer.onopen = () => debugServer.send('{"type":"WS","data":["已连接"]}');
    }
    reconnect();
}
// --------------- 工具函数 ---------------
function extensionMgrLog(...msg) {
    console.log(`%c BetterNemo %c %c 扩展管理 %c ${msg.join(" ")}`, "border-radius:5px;padding:2px;font-weight:bold;background: #20A5C4;color:white;", "", "border-radius:5px;padding:2px;font-weight:bold;background: #20A5C4;color:white;", "");
}
function extensionMgrError(...msg) {
    console.log(`%c BetterNemo %c %c 扩展管理 %c ${msg.join(" ")}`, "border-radius:5px;padding:2px;font-weight:bold;background: #ff0000;color:white;", "", "border-radius:5px;padding:2px;font-weight:bold;background: #ff0000;color:white;", "");
}
function get_run_mgr() {
    if (!window["HookRuntime"]) return;
    return HookRuntime.exports.get_webview_runtime().heart.runtime_manager.run_mgr;
}
function loadScript(src) {
    // if (isCloudflareEnv())
    //     src = `https://gitee.com/oldsquaw/better-nemo/raw/main/${src}`;
    if (isPhoneTestEnv()) src = `${HTTP_DEBUG_SERVER}/${src}`;
    return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}
function loadStyle(src) {
    // if (isCloudflareEnv())
    //     src = `https://gitee.com/oldsquaw/better-nemo/raw/main/${src}`;
    if (isPhoneTestEnv()) src = `${HTTP_DEBUG_SERVER}/${src}`;
    return new Promise((resolve, reject) => {
        const style = document.createElement("link");
        style.rel = "stylesheet";
        style.type = "text/css";
        style.classList.add("bn-theme");
        style.href = src;
        style.onload = resolve;
        style.onerror = reject;
        document.head.appendChild(style);
    });
}
loadStyle("style.css");
// --------------- 电脑端测试编辑器时隐藏舞台 ---------------
if (!PLAYER && isPCTestEnv()) {
    setInterval(() => {
        if (document.querySelector("#theatre_container")) {
            document.querySelector("#theatre_container").style.display = "none";
        }
    }, 100);
}
// ---------------
//prettier-ignore
class EventEmitter{constructor(){this._listeners={}}on(event,fn){(this._listeners[event]=this._listeners[event]||[]).push(fn);return this}off(event,fn){const list=this._listeners[event];if(list)this._listeners[event]=list.filter(cb=>cb!==fn);return this}emit(event,...args){(this._listeners[event]||[]).forEach(fn=>fn(...args))}}
//prettier-ignore
class DroidNetClient{constructor({baseUrl='http://127.0.0.1:1145',token}={}){this.baseUrl=baseUrl.replace(/\/+$/,'');this.token=token}async _request(method,path,body,rawResponse=false){const url=`${this.baseUrl}${path}`;const headers={};if(this.token){headers['Authorization']=`Bearer ${this.token}`}if(body!==undefined&&!(body instanceof FormData)){headers['Content-Type']='application/json'}const options={method,headers};if(body!==undefined){options.body=(body instanceof FormData)?body:JSON.stringify(body)}const res=await fetch(url,options);if(rawResponse)return res;const json=await res.json();if(!json.ok)throw new Error(json.error||'Request failed');return json.data}async ping(){return this._request('GET','/api/ping')}async auth(){return this._request('GET','/api/auth')}fs={list:async(path)=>this._request('GET',`/api/fs/list?path=${encodeURIComponent(path)}`),read:async(path)=>{const res=await this._request('GET',`/api/fs/read?path=${encodeURIComponent(path)}`,undefined,true);return res.arrayBuffer()},info:async(path)=>this._request('GET',`/api/fs/info?path=${encodeURIComponent(path)}`),write:async(path,content)=>this._request('POST','/api/fs/write',{path,content}),create:async(path,isDir)=>this._request('POST','/api/fs/create',{path,isDir}),copy:async(src,dst)=>this._request('POST','/api/fs/copy',{src,dst}),move:async(src,dst)=>this._request('POST','/api/fs/move',{src,dst}),rename:async(path,newName)=>this._request('POST','/api/fs/rename',{path,newName}),delete:async(path)=>this._request('DELETE',`/api/fs/delete?path=${encodeURIComponent(path)}`),};hw={gamepads:async()=>this._request('GET','/api/hw/gamepads'),audio:{getVolume:async(stream='music')=>this._request('GET',`/api/hw/audio/volume?stream=${stream}`),setVolume:async(stream='music',percent)=>this._request('POST','/api/hw/audio/volume',{stream,percent}),play:async(base64,{sampleRate=44100,channelConfig=12,encoding=2,leftVolume=1.0,rightVolume=1.0,}={})=>this._request('POST','/api/hw/audio/play',{base64,sampleRate,channelConfig,encoding,leftVolume,rightVolume}),stop:async()=>this._request('POST','/api/hw/audio/stop'),},cameras:async()=>this._request('GET','/api/hw/cameras'),info:async()=>this._request('GET','/api/hw/info'),apps:async()=>this._request('GET','/api/hw/apps'),};sys={status:async()=>this._request('GET','/api/sys/status'),permissions:async()=>this._request('GET','/api/sys/permissions'),requestPermission:async(type)=>this._request('POST','/api/sys/permission',{type}),intent:async(action,uri,packageName='')=>this._request('POST','/api/sys/intent',{action,uri,packageName}),launch:async(packageName)=>this._request('POST','/api/sys/launch',{packageName}),};_buildWsUrl(path){const url=new URL(path,this.baseUrl.replace(/^http/,'ws'));if(this.token)url.searchParams.set('token',this.token);return url.toString()}connectGamepad(){const ws=new WebSocket(this._buildWsUrl('/ws/gamepad'));const stream=new GamepadStream(ws);return stream}connectMic(){const ws=new WebSocket(this._buildWsUrl('/ws/mic'));ws.binaryType='arraybuffer';const stream=new BinaryStream(ws);return stream}connectCamera(){const ws=new WebSocket(this._buildWsUrl('/ws/camera'));ws.binaryType='arraybuffer';const stream=new BinaryStream(ws);return stream}}
//prettier-ignore
function selectFileFromDevice(client) {
    return new Promise((resolve, reject) => {
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:9999; display:flex; align-items:center; justify-content:center; font-family:sans-serif;';
        const panel = document.createElement('div');
        panel.style.cssText = 'width:90vw; height:85vh; max-width:600px; background: #522093; border-radius:12px; display:flex; flex-direction:column; overflow:hidden; box-shadow:0 10px 40px rgba(0,0,0,0.3);';
        overlay.appendChild(panel);
        const header = document.createElement('div');
        header.style.cssText = 'padding:12px 16px; display:flex; align-items:center; justify-content:space-between; background: #9a4cff;';
        const pathDisplay = document.createElement('div');
        pathDisplay.style.cssText = 'font-size:13px; color: #fff; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex:1; margin-right:8px;';
        const btnGroup = document.createElement('div');
        btnGroup.style.cssText = 'display:flex; gap:8px;';
        const btnUp = document.createElement('button');
        btnUp.textContent = '⬆ 上级';
        btnUp.style.cssText = 'border:none; background: #522093; padding:4px 10px; border-radius:6px; cursor:pointer; font-size:13px;';
        const btnClose = document.createElement('button');
        btnClose.textContent = '✕';
        btnClose.style.cssText = 'border:none; background: #522093; color: #fff; width:28px; height:28px; border-radius:50%; cursor:pointer; font-size:16px; line-height:1; display:flex; align-items:center; justify-content:center;';
        btnGroup.appendChild(btnUp);
        btnGroup.appendChild(btnClose);
        header.appendChild(pathDisplay);
        header.appendChild(btnGroup);
        panel.appendChild(header);
        const listContainer = document.createElement('div');
        listContainer.style.cssText = 'flex:1; overflow-y:auto; padding:8px 16px;';
        panel.appendChild(listContainer);
        const status = document.createElement('div');
        status.style.cssText = 'text-align:center; padding:20px; color: #fff; display:none;';
        listContainer.appendChild(status);
        document.body.appendChild(overlay);
        const rootPath = '/storage/emulated/0';
        let currentPath = rootPath;
        let currentItems = [];
        let resolved = false;

        function cleanup() {
            if (overlay.parentNode) overlay.parentNode.removeChild(overlay)
        }

        function cancel() {
            if (resolved) return;
            resolved = true;
            cleanup();
            resolve(null)
        }
        async function loadPath(path) {
            try {
                status.style.display = 'block';
                status.textContent = '加载中...';
                listContainer.querySelectorAll('.file-item').forEach(el => el.remove());
                const items = await client.fs.list(path);
                currentItems = items;
                currentPath = path;
                pathDisplay.textContent = path;
                renderItems(items);
                status.style.display = 'none'
            } catch (e) {
                status.textContent = '加载失败: ' + e.message + '\n请检查DroidNet运行状态';
                status.style.display = 'block';
                return false;
            }
        }

        function renderItems(items) {
            listContainer.querySelectorAll('.file-item').forEach(el => el.remove());
            if (!items || items.length === 0) {
                status.textContent = '此目录为空';
                status.style.display = 'block';
                return
            }
            status.style.display = 'none';
            const dirs = items.filter(f => f.isDir).sort((a, b) => a.name.localeCompare(b.name));
            const files = items.filter(f => f.isFile).sort((a, b) => a.name.localeCompare(b.name));
            const sorted = [...dirs, ...files];
            sorted.forEach(item => {
                const row = document.createElement('div');
                row.className = 'file-item';
                row.style.cssText = 'display:flex; align-items:center; padding:10px 4px; border-bottom:1px solid #f0f0f0; cursor:pointer; transition: background 0.1s; color: #fff;';
                const icon = document.createElement('span');
                icon.textContent = item.isDir ? '📁' : '📄';
                icon.style.cssText = 'margin-right:12px; font-size:20px;';
                const name = document.createElement('span');
                name.textContent = item.name;
                name.style.cssText = 'flex:1; font-size:14px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;';
                const size = document.createElement('span');
                size.style.cssText = 'margin-left:12px; font-size:12px; color: #fff; white-space:nowrap;';
                if (item.isFile) {
                    size.textContent = formatSize(item.size)
                }
                row.appendChild(icon);
                row.appendChild(name);
                row.appendChild(size);
                row.addEventListener('click', async () => {
                    if (item.isDir) {
                        loadPath(item.path)
                    } else {
                        if (resolved) return;
                        resolved = true;
                        status.textContent = '读取文件中...';
                        status.style.display = 'block';
                        try {
                            const content = await client.fs.read(item.path);
                            const decoder = new TextDecoder('utf-8');  // 默认就是 UTF-8，可按需指定编码
                            const text = decoder.decode(content);
                            cleanup();
                            resolve({
                                name: item.name,
                                path: item.path,
                                content: text,
                                text,
                            })
                        } catch (e) {
                            status.textContent = '读取失败: ' + e.message;
                            status.style.display = 'block';
                            resolved = false
                        }
                    }
                });
                listContainer.insertBefore(row, status)
            })
        }

        function formatSize(bytes) {
            if (!bytes) return '';
            const units = ['B', 'KB', 'MB', 'GB'];
            let i = 0;
            let size = bytes;
            while (size >= 1024 && i < units.length - 1) {
                size /= 1024;
                i++
            }
            return size.toFixed(i > 0 ? 1 : 0) + ' ' + units[i]
        }
        btnUp.addEventListener('click', async () => {
            const parts = currentPath.replace(/\/+$/, '').split('/');
            parts.pop();
            const parent = parts.join('/') || '/';
            await loadPath(parent);
            if (currentPath === rootPath)
                btnUp.style.display = 'none';
            else btnUp.style.display = 'block';
        });
        btnClose.addEventListener('click', cancel);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) cancel()
        });
        const keyHandler = (e) => {
            if (e.key === 'Escape') cancel()
        };
        document.addEventListener('keydown', keyHandler);
        const originalCleanup = cleanup;
        cleanup = () => {
            document.removeEventListener('keydown', keyHandler);
            originalCleanup()
        };
        loadPath(rootPath);
    })
}
const dnc = new DroidNetClient({ baseUrl: "http://127.0.0.1:1145" });

(function () {
    "use strict";

    // 防止重复注入
    if (window.__consoleForwarded) return;
    window.__consoleForwarded = true;

    // 保存原始方法（防止递归）
    const originals = {};
    ["log", "info", "debug", "warn", "error", "trace"].forEach(function (level) {
        originals[level] = console[level] ? console[level].bind(console) : null;
    });

    // 模拟场景用的原始引用，避免 send 内部调用 console 造成递归
    window.__originConsoleLog = originals.log;

    let sending = false; // 防止 debugServer.send 内部打印导致无限递归

    // 安全序列化，处理循环引用 / Error / BigInt / Function
    function serialize(value) {
        const seen = new WeakSet();
        try {
            return JSON.stringify(value, function (key, val) {
                if (typeof val === "object" && val !== null) {
                    if (seen.has(val)) return "[Circular]";
                    seen.add(val);
                }
                if (typeof val === "function") return "[Function " + (val.name || "anonymous") + "]";
                if (typeof val === "bigint") return val.toString() + "n";
                if (val instanceof Error) {
                    return { name: val.name, message: val.message, stack: val.stack };
                }
                return val;
            });
        } catch (e) {
            try {
                return String(value);
            } catch (_) {
                return "[Unserializable]";
            }
        }
    }

    // 把参数数组转成字符串数组
    function format(args) {
        return Array.prototype.map.call(args, function (a) {
            if (typeof a === "string") return a;
            if (a instanceof Error) return a.stack || a.name + ": " + a.message;
            return serialize(a);
        });
    }

    // 核心转发
    function forward(type, args) {
        if (sending) return;
        let payload;
        try {
            payload = JSON.stringify({ type: type, data: format(args) });
        } catch (e) {
            payload = JSON.stringify({ type: type, data: ["[序列化失败]"] });
        }
        sending = true;
        try {
            if (typeof debugServer !== "undefined" && debugServer && typeof debugServer.send === "function") {
                debugServer.send(payload);
            }
        } catch (e) {
            // 静默失败，避免影响业务
        } finally {
            sending = false;
        }
    }

    // 劫持各日志方法
    ["log", "info", "debug", "warn", "error", "trace"].forEach(function (level) {
        if (!originals[level]) return;
        console[level] = function () {
            forward(level, arguments);
            return originals[level].apply(null, arguments);
        };
    });

    // 额外捕获：全局错误 & 未处理的 Promise rejection
    window.addEventListener("error", function (e) {
        forward("error", [e.message, e.filename + ":" + e.lineno + ":" + e.colno, e.error]);
    });

    window.addEventListener("unhandledrejection", function (e) {
        forward("error", ["Unhandled Promise Rejection", e.reason]);
    });
})();

// --------------- 加载页面 ---------------
(async () => {
    window.__DEBUG__ = false;
    setLoaderInfo("加载BN核心");
    await loadScript("better-nemo/utils.js");
    setLoaderInfo("加载CUELoader...");
    await loadScript("better-nemo/CUELoader-preview.user.js");
    setLoaderInfo("加载Nemo核心...");
    if (isCloudflareEnv()) loadScript("https://db0l8fnn8oqtof.database.nocode.cn/storage/v1/object/public/wenjian/anonymous/1776601566193_aowalndxrwh.js");
    else loadScript("assets/workspace.bundle.79d6432e01ccdecb492a.js");
    setLoaderInfo("资源加载完成！");
    document.title = "BN Player";
})();
function getBrowserVersion() {
    return parseInt(new UAParser().getResult().browser.version);
}
