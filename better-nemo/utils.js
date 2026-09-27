window["blockObjects"] = [];
window["rootBlockChecks"] = [];
/**
 * 异步获取Blockly
 * @returns Blockly
 */
const isBlocklyLoaded = async () => {
    while (!window["Blockly"]) {
        await new Promise(resolve => requestAnimationFrame(resolve));
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
        await new Promise(resolve => requestAnimationFrame(resolve));
    }
    return Blockly.mainWorkspace;
};
/**
 * 异步获取Toolbox
 * @returns Toolbox
 */
const isToolboxLoaded = async () => {
    while (!Blockly.mainWorkspace.get_toolbox()) {
        await new Promise(resolve => requestAnimationFrame(resolve));
    }
    return Blockly.mainWorkspace.get_toolbox();
};
const isElementLoaded = async element => {
    while (!document.querySelector(element)) {
        await new Promise(resolve => requestAnimationFrame(resolve));
    }
    return document.querySelector(element);
};
/**
 * 异步获取RunMgr
 * @returns RunMgr
 */
const isRunmgrHooked = async () => {
    while (!get_run_mgr()) {
        await new Promise(resolve => requestAnimationFrame(resolve));
    }
    return get_run_mgr();
};
/**
 * 异步获取某个模块
 * @param {string} name 在hook部分中定义的模块别名
 * @returns Module
 */
const waitHook = async name => {
    while (!window["Hook" + name]) {
        await new Promise(resolve => requestAnimationFrame(resolve));
    }
    return window["Hook" + name].exports;
};
/**
 * 异步获取某个全局对象
 * @param {string} name 全局对象名
 * @returns any
 */
const waitGetGlobal = async name => {
    while (!window[name]) {
        await new Promise(resolve => requestAnimationFrame(resolve));
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
function regToolbox(name, icon, color, blocks, selectedColor = "white") {
    function addStyle(style) {
        const styleElement = document.getElementById("toolbox-style");
        if (!styleElement) {
            const styleElement = document.createElement("style");
            styleElement.id = "toolbox-style";
            styleElement.textContent = style;
            document.head.appendChild(styleElement);
        } else styleElement.textContent += style;
    }
    const toolboxObject = {
        color,
        name: "toolbox-" + name,
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
async function regDomainFunction(name, func, error_msg = "") {
    const registry = get_run_mgr().registry;
    registry.domain_function[name] = func;
    registry.domain_function_list.push(func);
    registry.domain_function_index[name] = registry.domain_function_types.push(name) - 1;
    const i18n = (await waitHook("MsgZhCN")).ZH_CN;
    if (error_msg) i18n["domain_function_error/" + name] = error_msg;
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
window["customEvents"] = [];
/**
 * 注册一个简单事件
 * @param {string} eventBlockId 事件积木ID
 */
function regSimpleEvent(eventBlockId) {
    regAction({
        id: eventBlockId,
        entity_specific: false,
        responder_blocks: [
            {
                id: eventBlockId,
                type: "action",
                async: false,
            },
        ],
    });
    regDomainFunction(eventBlockId, () => {});
    // window['customEvents'].push(eventBlockId);
}
function checkRootBlock({ blockType = "", rootBlockTypes = [] }) {
    Blockly.mainWorkspace
        .get_all_blocks()
        .filter(block => block.type == blockType)
        .forEach(block => {
            if (block.get_colour() != Blockly.theme.disabled_color.fill) block._color = block.get_colour();
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
    const action_parameters = utils.runtime_manager.interpreters[Object.keys(utils.runtime_manager.interpreters)[0]].action_parameters;
    if (action_parameters) {
        return action_parameters;
    }
    return undefined;
}
async function defineEventParam(blockId, text, colorId) {
    const Di = await waitHook("Di");
    Blockly.define_block_with_object("__" + blockId, {
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
                if ((Blockly.events.set_group(i || !0), __IS_PC__ && 0 !== n.button)) return (n.preventDefault(), void n.stopPropagation());
                var a = thisBlock.workspace.get_gesture(n);
                if (a) {
                    var o = a.handle_move.bind(a),
                        s = a.handle_up.bind(a),
                        c = 0,
                        u = !1,
                        l = !0;
                    ((a.handle_move = function (i) {
                        if (u) o(i);
                        else if (c < 10) c++;
                        else if (((a.is_dragging_block = !0), l || __IS_PC__)) {
                            var s = (function () {
                                Blockly.events.disable();
                                const newBlock = thisBlock.workspace.new_block(blockId),
                                    thisBlockPos = thisBlock.get_relative_to_surface_xy();
                                return (
                                    newBlock.move_by(thisBlockPos),
                                    newBlock.init_svg(),
                                    newBlock.render(),
                                    Blockly.events.enable(),
                                    Blockly.events.is_enabled() &&
                                        Blockly.events.fire(
                                            CreateEvent({
                                                block: newBlock,
                                                source: "other",
                                            }),
                                        ),
                                    newBlock
                                );
                            })();
                            (s.select(), a.handle_block_start(n, s), (a.target_block = s), (u = !0));
                        } else a.cancel();
                    }),
                        (a.handle_up = function (t) {
                            (s(t), Blockly.events.set_group(i), (l = !0));
                        }));
                }
            };
        },
    });
}

function regBlocks(blocks) {
    blockObjects = blockObjects.concat(blocks);
    blocks.forEach(block => {
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
        const Runtime = await waitHook("Runtime");
        Runtime.get_webview_runtime().send_action({
            id: name,
            namespace: "",
            parameters: params,
        });
    })();
}

const experimentalConfig = {
    webview_debug: true,
};
(async () => {

    function sleep(time) {
        return new Promise(r => setTimeout(r, time));
    }

    let _dsb$returnValue$id, asyncReqType;

    // --------------- 劫持Web向Native发送的数据 ---------------

    if (isPCTestEnv())
        window["_dsbridge"] = {
            call: (...args) => {
                console.log(...args);
            },
        };
    setLoaderInfo("等待dsbridge初始化...", 4);
    const dsbridge = await waitHook("Dsbridge");
    const call = dsbridge.call;
    dsbridge.call = (...args) => {
        if (experimentalConfig.webview_debug) {
            console.log("[Webview -> Nemo] args:", ...args);
            debugServer.send(
                JSON.stringify({
                    type: "w2n",
                    data: [...args],
                }),
            );
        }
        if (args[0] === "_dsb.returnValue") {
            try {
                const { id, data } = args[1];
                _dsb$returnValue$id = id;
                if (asyncReqType === "REQUEST_ALL_SAVE_DATA") {
                    // data.block_count = 1145141919;
                    const dataKeys = Object.keys(data.xml);
                    dataKeys.sort();
                    const WORK_EXT_DATA = {
                        CUE: BN_CUEL_BRIDGE.CUE_EXTS,
                    };
                    data.xml[dataKeys[0]] += `<BN_WORK_EXT_DATA>${JSON.stringify(WORK_EXT_DATA)}</BN_WORK_EXT_DATA>`;
                    args = [
                        "_dsb.returnValue",
                        {
                            id: _dsb$returnValue$id,
                            complete: true,
                            data,
                        },
                    ];
                    const result = call.apply(dsbridge, args);
                    debugServer.send(
                        JSON.stringify({
                            type: "w2n",
                            data: ["数据注入成功", ...args],
                        }),
                    );
                    if (experimentalConfig.webview_debug) {
                        console.log("[Webview -> Nemo] args:", ...args);
                    }
                    asyncReqType = undefined;
                    return result;
                }
            } catch (e) {
                debugServer.send(
                    JSON.stringify({
                        type: "w2n",
                        data: ["数据注入失败", e.stack],
                    }),
                );
            }
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
                if (data.type === "SELECT_EXTENSIONS_CATEGORIES") {
                    mdui.dialog({
                        headline: "导入扩展",
                        actions: [
                            {
                                text: "官方扩展",
                                onClick: () => {
                                    call.apply(dsbridge, args);
                                },
                            },
                            {
                                text: "自定义(选择文件)",
                                onClick: async () => {
                                    const data = await selectFileFromDevice(dnc);
                                    if (!data) return;
                                    if (!data.content) return;
                                    console.log('文件内容：', data.content);
                                    BN_CUEL_BRIDGE.installExt(data.content);
                                    return;
                                },
                            },
                        ],
                        closeOnOverlayClick: true,
                    });
                    // args[2]('["microbit"]');
                    return;
                }
            } catch (e) {
                console.error(e);
            }
        const result = call.apply(dsbridge, args);
        return result;
    };
    // --------------- 劫持Native向Web发送的数据 ---------------
    await waitGetGlobal("_dsf");
    await waitGetGlobal("_dsaf");

    const postMessage = _dsf.postMessage;
    window["postMsg"] = _dsf.postMessage;
    _dsf.postMessage = (...args) => {
        debugServer.send(
            JSON.stringify({
                type: "n2w",
                data: [...args],
            }),
        );
        if (experimentalConfig.webview_debug) console.log("[Nemo -> Webview]", ...args);
        if (args.length === 2)
            if (args[0] === "INIT_WEBVIEW_DATA") {
                let data = JSON.parse(args[1]);
                window["WEBVIEW_DATA"] = data;
                // 启用教师端的积木隐藏功能
                data.context_menu_with_set_block_visibility = true;
                // 启用显示隐藏积木
                data.translucent_block_visible = "translucent";
                // 给Nemo修改后的数据
                return postMessage.apply(_dsf, ["INIT_WEBVIEW_DATA", JSON.stringify(data)]);
            }
        return postMessage.apply(_dsf, args);
    };
    const postMessageAsyn = _dsaf.postMessageAsyn;
    window["postMsgAsyn"] = _dsaf.postMessageAsyn;
    _dsaf.postMessageAsyn = async (...args) => {
        debugServer.send(
            JSON.stringify({
                type: "n2w async",
                data: [...args],
            }),
        );
        if (experimentalConfig.webview_debug) console.log("[Nemo -> Webview] [ASYNC]", ...args);
        asyncReqType = args[0];
        if (asyncReqType === "LOAD_BCM") {
            try {
                const bcmData = JSON.parse(args[1]);
                const xml = {};
                for (const key of Object.keys(bcmData.actors.actors_dict)) xml[key] = ["actors", bcmData.actors.actors_dict[key].blocksXML];
                for (const key of Object.keys(bcmData.scenes.scenes_dict)) xml[key] = ["scenes", bcmData.scenes.scenes_dict[key].blocksXML];
                const dataKeys = Object.keys(xml);
                dataKeys.sort();
                const [storageType, dataText] = xml[dataKeys[0]];
                if (dataText.endsWith("</BN_WORK_EXT_DATA>")) {
                    const extDataText = dataText.split("</BN_WORK_EXT_DATA>").slice(-2)[0].split("<BN_WORK_EXT_DATA>").slice(-1)[0];
                    const fullLength = `<BN_WORK_EXT_DATA>${extDataText}</BN_WORK_EXT_DATA>`.length;
                    BN_CUEL_BRIDGE.WORK_EXT_DATA = JSON.parse(extDataText);
                    BN_CUEL_BRIDGE.emit("workExtDataLoaded");
                    bcmData[storageType][storageType + "_dict"][dataKeys[0]].blocksXML = dataText.slice(0, -fullLength);
                    debugServer.send(
                        JSON.stringify({
                            type: "CLOG",
                            data: ["附加数据", JSON.parse(extDataText)],
                        }),
                    );
                    args[1] = JSON.stringify(bcmData);
                }
                await sleep(500);
                return postMessageAsyn.apply(_dsaf, args);
            } catch (e) {
                debugServer.send(
                    JSON.stringify({
                        type: "w2n",
                        data: ["附加数据读取失败", e.stack],
                    }),
                );
            }
        }
        return postMessageAsyn.apply(_dsaf, args);
    };
})();
(async () => {})();
