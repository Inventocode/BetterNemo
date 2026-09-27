window['blockObjects'] = [];
window['rootBlockChecks'] = [];
/**
 * 异步获取Blockly
 * @returns Blockly
 */
const isBlocklyLoaded = async () => {
    while (!window['Blockly']) {
        await new Promise((resolve) => requestAnimationFrame(resolve));
    }
    return Blockly;
};
/**
 * 异步获取Workspace
 * @returns WorkspaceSvg
 */
const isBlocklyMainworkspaceLoaded = async () => {
    await isBlocklyLoaded();
    while (!Blockly.mainWorkspace) {
        await new Promise((resolve) => requestAnimationFrame(resolve));
    }
    return Blockly.mainWorkspace;
};
/**
 * 异步获取Toolbox
 * @returns Toolbox
 */
const isToolboxLoaded = async () => {
    while (!Blockly.mainWorkspace.get_toolbox()) {
        await new Promise((resolve) => requestAnimationFrame(resolve));
    }
    return Blockly.mainWorkspace.get_toolbox();
};
const isElementLoaded = async (element) => {
    while (!document.querySelector(element)) {
        await new Promise((resolve) => requestAnimationFrame(resolve));
    }
    return document.querySelector(element);
};
/**
 * 异步获取RunMgr
 * @returns RunMgr
 */
const isRunmgrHooked = async () => {
    while (!get_run_mgr()) {
        await new Promise((resolve) => requestAnimationFrame(resolve));
    }
    return get_run_mgr();
};
/**
 * 异步获取某个模块
 * @param {string} name 在hook部分中定义的模块别名
 * @returns Module
 */
const waitHook = async (name) => {
    while (!window['Hook' + name]) {
        await new Promise((resolve) => requestAnimationFrame(resolve));
    }
    return window['Hook' + name].exports;
};
/**
 * 异步获取某个全局对象
 * @param {string} name 全局对象名
 * @returns any
 */
const waitGetGlobal = async (name) => {
    while (!window[name]) {
        await new Promise((resolve) => requestAnimationFrame(resolve));
    }
    return window[name];
};
/**
 * 追加新的积木盒
 * @param {string} name 
 * @param {string} icon 图标symbol的id
 * @param {string} color 颜色
 * @param {string[]} blocks 积木XML文本列表
 * @param {boolean} selectedColor 选中时颜色，默认为白
 */
function regToolbox(name, icon, color, blocks, selectedColor = 'white') {
    function addStyle(style) {
        const styleElement = document.getElementById('toolbox-style');
        if (!styleElement) {
            const styleElement = document.createElement('style');
            styleElement.id = 'toolbox-style';
            styleElement.textContent = style;
            document.head.appendChild(styleElement);
        } else styleElement.textContent += style;
    };
    const toolboxObject = {
        color,
        name: 'toolbox-' + name,
        icon: { font_id: icon },
        blocks: blocks.flat(1).map(block => str2xml(block)),
    };
    setTimeout(() => {
        const toolbox = Blockly.mainWorkspace.get_toolbox();
        toolbox.add(toolbox.new_node(toolboxObject));
        addStyle(`#toolbox-${name}.blocklyTreeSelected>div>svg { fill: ${selectedColor};}#toolbox-${name}{box-shadow: 4px 0px 0px ${color}}`);
    }, 1000);
}
const str2xml = function (str) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(str, "text/xml");
    return doc.firstChild;
};
/**
 * 注册新的解释器
 * @param {string} name 积木ID
 * @param {function} func 解释器
 * @param {string} error_msg 出错提示
 */
async function regDomainFunction(name, func, error_msg = '') {
    const registry = get_run_mgr().registry;
    registry.domain_function[name] = func;
    registry.domain_function_list.push(func);
    registry.domain_function_index[name] = registry.domain_function_types.push(name) - 1;
    const i18n = (await waitHook('MsgZhCN')).ZH_CN;
    if (error_msg)
        i18n['domain_function_error/' + name] = error_msg;
}
/**
 * 重写解释器
 * @param {string} name 积木ID
 * @param {function} func 解释器
 */
function rewriteDomainFunction(name, func) {
    const registry = get_run_mgr().registry;
    registry.domain_function[name] = func;
    const index = registry.domain_function_index[name];
    registry.domain_function_list[index] = func;
}
/**
 * 注册一个事件
 * @param {object} action_type 事件对象
 */
function regAction(action_type) {
    const registry = get_run_mgr().registry;
    var r = {
        namespace: "",
        id: action_type.id,
    };
    if (action_type.statefulness !== void 0) {
        r.statefulness = action_type.statefulness;
    }
    registry.register_action_type(r);
    action_type.responder_blocks.forEach(function (r) {
        registry.register({
            namespace: "",
            id: r.id,
            respond: {
                to_action: {
                    namespace: "",
                    id: action_type.id,
                },
                type: r.type,
                async: r.async,
                priority: r.priority,
                entity_specific: action_type.entity_specific,
                trigger_function: r.trigger_function,
                filter_arg_names: r.filter_arg_names,
            },
        });
    });
    return;
}
window['customEvents'] = [];
/**
 * 注册一个简单事件
 * @param {string} eventBlockId 事件积木ID
 */
function regSimpleEvent(eventBlockId) {
    regAction({
        id: eventBlockId,
        entity_specific: false,
        responder_blocks: [{
            id: eventBlockId,
            type: "action",
            async: false,
        }],
    });
    regDomainFunction(eventBlockId, () => { });
    // window['customEvents'].push(eventBlockId);
}
function checkRootBlock({ blockType = '', rootBlockTypes = [] }) {
    Blockly.mainWorkspace.get_all_blocks()
        .filter(block => block.type == blockType)
        .forEach(block => {
            if (block.get_colour() != Blockly.theme.disabled_color.fill)
                block._color = block.get_colour();
            if (block.get_root_block())
                if (rootBlockTypes.includes(block.get_root_block().type))
                    if (block._color) {
                        block.set_colour(block._color);
                        return;
                    }
            block.set_colour(Blockly.theme.disabled_color.fill);
        });
}
/**
 * 获取事件参数
 * @param {args.utils} utils 
 * @returns {object} 事件参数对象
 */
function getEventParams(utils) {
    const action_parameters =
        utils.runtime_manager.interpreters[
            Object.keys(utils.runtime_manager.interpreters)[0]
        ].action_parameters;
    if (action_parameters) {
        return action_parameters;
    }
    return undefined;
}
async function defineEventParam(blockId, text, colorId) {
    const Di = await waitHook('Di');
    Blockly.define_block_with_object('__' + blockId, {
        init: function () {
            const __IS_PC__ = false;
            var thisBlock = this,
                LabelSerializable = Blockly.di_container.get(Di.BINDING.FieldLabelSerializable),
                CreateEvent = Blockly.di_container.get(Di.BINDING.CreateEvent),
                label = LabelSerializable({ text: text });
            label.on_mouse_down = function (e) {
                e.preventDefault();
            };
            this.append_dummy_input().append_field(label, "TEXT");
            this.set_output(true);
            this.set_inputs_inline(true);
            this.set_colour(Blockly.theme.block_color[colorId].fill, Blockly.theme.block_color[colorId].border);
            this.on_mouse_down = function (n) {
                var i = Blockly.events.get_group();
                if (Blockly.events.set_group(i || !0),
                    __IS_PC__ && 0 !== n.button)
                    return n.preventDefault(),
                        void n.stopPropagation();
                var a = thisBlock.workspace.get_gesture(n);
                if (a) {
                    var o = a.handle_move.bind(a)
                        , s = a.handle_up.bind(a)
                        , c = 0
                        , u = !1
                        , l = !0;
                    a.handle_move = function (i) {
                        if (u)
                            o(i);
                        else if (c < 10)
                            c++;
                        else if (a.is_dragging_block = !0,
                            l || __IS_PC__) {
                            var s = function () {
                                Blockly.events.disable();
                                const newBlock = thisBlock.workspace.new_block(blockId),
                                    thisBlockPos = thisBlock.get_relative_to_surface_xy();
                                return newBlock.move_by(thisBlockPos),
                                    newBlock.init_svg(),
                                    newBlock.render(),
                                    Blockly.events.enable(),
                                    Blockly.events.is_enabled() && Blockly.events.fire(CreateEvent({
                                        block: newBlock,
                                        source: "other"
                                    })),
                                    newBlock;
                            }();
                            s.select(),
                                a.handle_block_start(n, s),
                                a.target_block = s,
                                u = !0;
                        } else
                            a.cancel();
                    }
                        ,
                        a.handle_up = function (t) {
                            s(t),
                                Blockly.events.set_group(i),
                                l = !0;
                        };
                }
            };
        }
    });
}

function regBlocks(blocks) {
    blockObjects = (blockObjects.concat(blocks));
    blocks.forEach((block) => {
        // 对于事件参数的特殊处理
        if (block.EventParam) {
            rootBlockChecks.push({
                blockType: block.type,
                rootBlockTypes: [block.EventParam.eventBlockId],
            });
            defineEventParam(block.type, block.text, block.EventParam.colorId);
            block = {
                type: block.type,
                message0: block.text,
                args0: [],
                colour: `%{BKY_${block.EventParam.colorId}}`,
                output: "String",
            };
        }
        // 防止有人漏写了
        if (!block.args0) block.args0 = [];
        // 注册积木
        Blockly.Blocks[block.type] = {
            init: function () {
                this.jsonInit(block);
            },
        };
    });
}
/**
 * 触发一个简单的事件
 * @param {string} name 事件名称
 * @param {object} params 参数(可选)
 */
function emitSimpleEvent(name, params = {}) {
    (async function () {
        const Runtime = await waitHook('Runtime');
        Runtime.get_webview_runtime().send_action({
            id: name,
            namespace: "",
            parameters: params,
        });
    })();
}

const BetterNemo = {
    log: (moduleName, ...msgs) => {
        if (moduleName) {
            console.log(
                `%c BetterNemo %c %c ${moduleName} %c ${msgs.join(' ')}`,
                'border-radius:5px;padding:2px;font-weight:bold;background: #20A5C4;color:white;', '',
                'border-radius:5px;padding:2px;font-weight:bold;background: #20A5C4;color:white;', ''
            );
        } else {
            console.log(`%c BetterNemo %c ${msgs.join(' ')}`, 'border-radius:5px;padding:2px;font-weight:bold;background: #20A5C4;color:white;', '');
        }
    },
    error: (moduleName, ...msgs) => {
        if (moduleName) {
            console.log(`%c BetterNemo %c %c ${moduleName} %c ${msgs.join(' ')}`, 'border-radius:5px;padding:2px;font-weight:bold;background: #ff0000;color:white;', '', 'border-radius:5px;padding:2px;font-weight:bold;background: #ff0000;color:white;', '');
        } else {
            console.log(`%c BetterNemo %c ${msgs.join(' ')}`, 'border-radius:5px;padding:2px;font-weight:bold;background: #ff0000;color:white;', '');
        }
    },
    hook: hook,
    getHook: waitHook,
    Block: {
        methodBlock: {
            previousStatement: true,
            nextStatement: true,
            inputsInline: true,
        },
        eventBlock: {
            nextStatement: true,
            inputsInline: true,
        }
    },
    Toolbox: {
        title: (text) =>
            `<label text="${text}" type="normal" gap="24" web-class="flyout-toolbox-title" vertical_padding="0"></label>`,
        error: (text) =>
            `<label text="${text}" type="normal" gap="24" web-class="flyout-toolbox-error" vertical_padding="0"></label>`,
        line: (text, height = 25) =>
            `<label type="flyout_line" height="${height}" text="${text}"/>`,
        flyout_bottom: (width = 130, height = 16) =>
            `<label type="flyout_bottom" align="center" width="${width}" height="${height}"></label>`,
        sep: (gap = 50) => `<sep gap="${gap}"></sep>`,
        numValue: (name, value) =>
            `<value name="${name}"><shadow type="math_number"><field name="NUM">${value}</field></shadow></value>`,
        textValue: (name, value) =>
            `<value name="${name}"><shadow type="text"><field name="TEXT">${value}</field></shadow></value>`,
        optionValue: (name, value) => `<field name="${name}">${value}</field>`,
        block: (type, ...values) => {
            const blockJSON = window['blockObjects'].find((block) => block.type === type);
            if (blockJSON) {
                if (!blockJSON.args0) return [BetterNemo.Toolbox.error(type + "缺少args0属性"), `<block type="${type}">${values.join("")}</block>`];
                for (let i = 1; i <= blockJSON.args0.length; i++)
                    if (!blockJSON.message0.includes(`%${i}`)) {
                        const msg = `${type}的message0缺少%${i}`;
                        console.error(msg);
                        return BetterNemo.Toolbox.error(msg);
                    }
                blockJSON.args0.forEach((arg) => {
                    if (arg.value !== undefined) {
                        switch (arg.type) {
                            case "input_value":
                                if (!Array.isArray(arg.check))
                                    arg.check = [arg.check];
                                if (arg.check[0] === "Number" && arg.check.length === 1)
                                    values.push(BetterNemo.Toolbox.numValue(arg.name, arg.value));
                                else if (arg.check.includes("String"))
                                    values.push(BetterNemo.Toolbox.textValue(arg.name, arg.value));
                                else console.error("未知参数", arg.check);
                                break;
                            case "field_dropdown":
                                values.push(BetterNemo.Toolbox.optionValue(arg.name, arg.value));
                                break;
                            // default: console.warn("未知类型参数", arg.type, blockJSON, arg);
                        }
                    } // else console.warn("无默认值", blockJSON, arg);
                });
                return `<block type="${type}">${values.join("")}</block>`;
            } else if (Blockly.Blocks[type]) {
                return `<block type="${type}">${values.join("")}</block>`;
            } else {
                return BetterNemo.Toolbox.error("错误：未能找到" + type + "的定义");
            }
        },
        eventBlock: (type, ...params) => [
            BetterNemo.Toolbox.sep(15),
            `<block type="${type}">${params.map(([name, type]) => `<value name="${name}"><block type="__${type}"></block></value>`)}</block>`,
        ],
        /** @deprecated */
        simpleEventBlock: (...args) => BetterNemo.Toolbox.eventBlock(...args),
        button: (key, text, callback, className = '') => {
            Blockly.mainWorkspace.register_button_callback(key, callback);
            return `<button text="${text}" callbackkey="${key}" type="normal"${className ? ` web-class="${className}"` : ''}></button>`;
        }
    },
    regColor: (colorID, fill, border, layer = '') => {
        if (layer) Blockly.theme.block_color[colorID] = { fill, border, layer };
        else Blockly.theme.block_color[colorID] = { fill, border };
    },
    defineBlocks: regBlocks,
    /** @deprecated */
    regBlocks,
    /** @deprecated */
    regSimpleEvent,
    regEvent: regSimpleEvent,
    /** @deprecated */
    regMethod: regDomainFunction,
    regDomainFunction,
    addIcon: (svg) => document.querySelector("#__SVG_SPRITE_NODE__").insertAdjacentHTML("beforeend", svg),
    /** @deprecated */
    regIcon: (svg) => BetterNemo.addIcon(svg),
    waitBlocklyLoaded: isBlocklyLoaded,
    waitBlockLoaded: async () => {
        while (window['blockObjects'] == [])
            await new Promise((resolve) => requestAnimationFrame(resolve));
        return;
    },
    waitHook,
    waitRunmgrLoaded: isRunmgrHooked,
    emitSimpleEvent,
    getEventParams,
    updateBrush: (actor) => {
        actor.parent_scene.should_update_brush();
    },
    getCtx: async () => {
        await isBlocklyLoaded();
        return Blockly.utils.canvas_context;
    },
    CAPI: {
        getToken: () => {
            if (window.WEBVIEW_DATA)
                if (window.WEBVIEW_DATA.user_token)
                    returnwindow.WEBVIEW_DATA.user_token;
            return '';
        },
        getWorkId: () => {
            if (window.WEBVIEW_DATA)
                if (window.WEBVIEW_DATA.work_id)
                    return parseInt(window.WEBVIEW_DATA.work_id);
            return -1;
        }
    }
};
async function reloadTheme() {
    document.querySelectorAll('.bn-theme').forEach(el => el.remove());
    THEME_FILES.forEach(async fileName => {
        const config = storage.get('theme_config');
        await loadScript('theme/' + fileName + '/on_disable.js');
        if (config[fileName]) {
            BetterNemo.log('主题管理', '主题', fileName, '已启用');
            await loadStyle('theme/' + fileName + '/style.css');
            await loadScript('theme/' + fileName + '/on_enable.js');
        };
    });
}
(async () => {
    window['Theme'] = { metaData: {} };
    let cnt = 0;
    THEME_FILES.forEach(async fileName => {
        cnt++;
        setLoaderInfo(`加载主题 (${cnt}/${THEME_FILES.length})`, 3);
        if (!storage.get('theme_config')) storage.set('theme_config', {});
        const config = storage.get('theme_config');
        if (config[fileName] == undefined) {
            if (fileName == 'default') {
                config[fileName] = true;
            } else {
                config[fileName] = false;
            };
            storage.set('theme_config', config);
        }
        Theme.metaData = {
            name: "未命名",
            version: "",
            description: "",
            author: "未知",
            docs: ""
        };
        await loadScript('theme/' + fileName + '/on_disable.js');
        themeMetaData[fileName] = Theme.metaData;
        BetterNemo.log('主题管理', '主题', fileName, '加载完成');
        if (config[fileName]) {
            BetterNemo.log('主题管理', '主题', fileName, '已启用');
            await loadStyle('theme/' + fileName + '/style.css');
        };
    });
    setLoaderInfo('主题加载完成！', 3);
})();
(async () => {
    let _dsb$returnValue$id, hackReturnValue;

    // --------------- 劫持Web向Native发送的数据 ---------------

    if (isPCTestEnv()) window['_dsbridge'] = { call: (...args) => { console.log(...args); } };
    setLoaderInfo('等待dsbridge初始化...', 4);
    const dsbridge = await waitHook('Dsbridge');
    const call = dsbridge.call;
    dsbridge.call = (...args) => {
        if (experimentalConfig.webview_debug) {
            console.log('[Webview -> Nemo] args:', ...args);
            debugServer.send(JSON.stringify({
                type: 'w2n',
                data: [...args]
            }));
        }
        if (args[0] === '_dsb.returnValue') {
            try {
                const data = args[1];
                _dsb$returnValue$id = data.id;
                if (hackReturnValue) {
                    args = [
                        '_dsb.returnValue',
                        JSON.stringify({
                            id: _dsb$returnValue$id,
                            complete: true,
                            data: hackReturnValue
                        })
                    ];
                    const result = call.apply(dsbridge, args);
                    if (experimentalConfig.webview_debug) {
                        console.log('[Webview -> Nemo] args:', ...args);
                        debugServer.send(JSON.stringify({
                            type: 'w2n',
                            data: ['劫持成功', ...args]
                        }));
                    }
                    hackReturnValue = undefined;
                    return result;
                }
            } catch (e) { console.error(e); }

        }
        if (args.length === 3)
            try {
                const data = JSON.parse(args[1]);
                const payload = data.payload;
                // if (data.type === 'EDIT_TEXT') {
                //     console.log('[原生劫持 - 文本编辑]', payload);
                //     if (getBrowserVersion() > 86) {
                //         (async () => {
                //             const text = await showFullscreenTextInput(payload.text);
                //             if (text !== null) args[2](text);
                //         })();
                //         return;
                //     }
                //     // else args[2](prompt('请输入文本'));
                //     else return call.apply(dsbridge, args);
                // }
                // if (data.type === 'SELECT_EXTENSIONS_CATEGORIES') {
                //     console.log('[原生劫持 - 扩展选择]', payload);
                //     if (getBrowserVersion() < 86) {
                //         alert("这个还没兼容，所以我只能帮你加一个microbit了");
                //         args[2]('["microbit"]');
                //     } else
                //         (async () => {
                //             const selected_categories = payload.selected_categories;
                //             await showExtensionShop(selected_categories, args[2]);
                //         })();
                //     return;
                // }
            } catch (e) { console.error(e); }
        const result = call.apply(dsbridge, args);
        // if (experimentalConfig.webview_debug) {
        //     console.log('[Webview -> Nemo] args:', ...args, 'result:', result);
        //     debugServer.send(JSON.stringify({
        //         type: 'w2n',
        //         data: [...args],
        //         result
        //     }));
        // }
        return result;
    };
    // --------------- 劫持Native向Web发送的数据 ---------------
    await waitGetGlobal('_dsf');
    await waitGetGlobal('_dsaf');

    const postMessage = _dsf.postMessage;
    window['postMsg'] = _dsf.postMessage;
    _dsf.postMessage = (...args) => {
        if (experimentalConfig.webview_debug) {
            console.log('[Nemo -> Webview]', ...args);
            debugServer.send(JSON.stringify({
                type: 'n2w',
                data: [...args]
            }));
        }
        if (args.length === 2)
            if (args[0] === 'INIT_WEBVIEW_DATA') {
                let data = JSON.parse(args[1]);
                window['WEBVIEW_DATA'] = data;
                // 启用教师端的积木隐藏功能
                data.context_menu_with_set_block_visibility = true;
                // 启用显示隐藏积木
                data.translucent_block_visible = 'translucent';
                // 给Nemo修改后的数据
                return postMessage.apply(_dsf, [
                    'INIT_WEBVIEW_DATA',
                    JSON.stringify(data)
                ]);
            }
        return postMessage.apply(_dsf, args);
    };
    const postMessageAsyn = _dsaf.postMessageAsyn;
    window['postMsgAsyn'] = _dsaf.postMessageAsyn;
    _dsaf.postMessageAsyn = async (...args) => {
        if (experimentalConfig.webview_debug) {
            console.log('[Nemo -> Webview] [ASYNC]', ...args);
            debugServer.send(JSON.stringify({
                type: 'n2w async',
                data: [...args]
            }));
        }
        if (args[0] === 'REQUEST_ALL_SAVE_DATA')
            hackReturnValue = {
                "xml": {
                    "619fd636-5c60-4be7-82ed-95c180d34585": "",
                    "62ec85d1-6e32-4bb4-bafe-4edbe940a312": "",
                    "03426ec6-a399-4b87-b248-10166bf49fe6": "",
                    "700824a5-44a8-4d03-a7e8-aa95d87e9b2a": ""
                },
                "block_count": 9178114514,
                "block_count_visible_only": 9178114514,
                "variable_dict": {},
                "broadcast_dict": {
                    "": {
                        "id": "",
                        "name": "CNM",
                        "scene": ""
                    }
                },
                "split_options": {},
                "procedure_dict": {},
                "toolbox": {
                    "devices": []
                }
            };
        return postMessageAsyn.apply(_dsaf, args);
    };
})();
(async () => {
})();