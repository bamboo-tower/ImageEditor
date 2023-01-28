import {
    // editor
    appendEditor,
    createDefaultImageReader,
    createDefaultImageWriter,
    createDefaultShapePreprocessor,
    createNode,
    appendNode,
    findNode,
    locale_en_gb,

    // plugins
    setPlugins,
    plugin_crop,
    plugin_crop_locale_en_gb,
    plugin_filter,
    plugin_filter_defaults,
    plugin_filter_locale_en_gb,
    plugin_finetune,
    plugin_finetune_defaults,
    plugin_finetune_locale_en_gb,
    plugin_annotate,
    plugin_annotate_locale_en_gb,
    markup_editor_defaults,
    markup_editor_locale_en_gb,
    plugin_frame,
    plugin_frame_defaults,
    plugin_frame_locale_en_gb,
} from '../pintura/pintura.js';

let editor;
let panel;               

//
// helper functions
//
const h = (name, attributes, children = []) => {
    const el = document.createElement(name);
    const descriptors = Object.getOwnPropertyDescriptors(el.__proto__);
    for (const key in attributes) {
        if (key === 'style') {
            el.style.cssText = attributes[key];
        } else if (
            (descriptors[key] && descriptors[key].set) ||
            /textContent|innerHTML/.test(key) ||
            typeof attributes[key] === 'function'
        ) {
            el[key] = attributes[key];
        } else {
            el.setAttribute(key, attributes[key]);
        }
    }
    children.forEach((child) => el.appendChild(child));
    return el;
};

const handleCustomize = () => {
    var radios = document.getElementsByName('cropinputtype');
    if (radios[0].checked) {
        const {expectedWidth, expectedHeight, ratioWidth, ratioHeight} = window;
        inputedSize.width = expectedWidth.value;
        inputedSize.height = expectedHeight.value;
        inputedRatio.width = expectedWidth.value;
        inputedRatio.height = expectedHeight.value;
        var width = parseFloat(expectedWidth.value) * 300;
        var height = parseFloat(expectedHeight.value) * 300;
        // no need to update
        if (editor.imageCropSize.width === width && editor.imageCropSize.height === height) return;

        // update state
        if (height > 0) {
            editor.imageCropAspectRatio = width / height;
        }
        // var currentCrop = editor.imageCrop;
        // editor.imageCrop = {x: currentCrop.x + (currentCrop.width - width) / 2,
        //                     y: currentCrop.y + (currentCrop.height - height) / 2,
        //                     width: width,
        //                     height: height}
        
        editor.history.write();
    } else if (radios[1].checked) {
        inputedRatio.width = ratioWidth.value;
        inputedRatio.height = ratioHeight.value;
        // update state
        var width = parseFloat(ratioWidth.value);
        var height = parseFloat(ratioHeight.value);
        if (height > 0) {
            editor.imageCropAspectRatio = width / height;
        }
        editor.history.write();
    }
    
    setTimeout("expectedHeight.dispatchEvent(ke)", 300);
}

const inputtypeChange = (e) => {
    const {expectedWidth, expectedHeight, ratioWidth, ratioHeight} = window;
    var radios = document.getElementsByName('cropinputtype');

    expectedWidth.disabled = !radios[0].checked;
    expectedHeight.disabled = !radios[0].checked;
    ratioWidth.disabled = !radios[1].checked;
    ratioHeight.disabled = !radios[1].checked;

    if (!expectedWidth.disabled) {
        expectedWidth.focus();
        expectedWidth.select();
    }
    if (!ratioWidth.disabled) {
        ratioWidth.focus();
        ratioWidth.select();
    }
}

setPlugins(
    plugin_crop,
    plugin_filter,
    plugin_finetune,
    plugin_frame,
    // plugin_annotate,
);

// create panel content
const form = h(
    'form',
    {
        class: 'export-form',
    },
    [
        h('div', {style:'padding-bottom:0.25em'} ,[
            h('span', {style:'width:6.8em;text-align:right;display:inline-block', textContent:'w'}, ),
            h('span', {style:'width:4.3em;text-align:right;display:inline-block', textContent:'h'}, ),
        ]),
        h('ul',
            {},
            [h( 
                'li',
                {},[                     
                // crop size
                h(
                    'label',
                    {                                   
                    },
                    [
                        h('input', { name: 'cropinputtype', type: 'radio', checked: 'true', value:'size',
                                onchange: (event) => {inputtypeChange(event)}}),

                        h('span', { class: "customizeinput",textContent: 'Print size :', }, [                            
                            h('input', {
                                id: 'expectedWidth',
                                type: 'number',
                                min: 0,
                                max: 100,
                                // value: editor.imageCropSize.width / 300,
                                step: 0.1,
                                onkeydown: (event) => {
                                    // If return key
                                    if (event.keyCode == 13) {
                                        handleCustomize();
                                    }
                                }
                            }),
                            h('span', {
                                textContent: 'X',
                                style: 'width: 1.5em;display: inline-block;text-align: right;margin: 0;'
                            }),
                            h('input', {
                                id: 'expectedHeight',
                                type: 'number',
                                min: 0,
                                // value: editor.imageCropSize.height / 300,
                                max: 100,
                                step: 0.1,
                                onkeydown: (event) => {
                                    // If return key
                                    if (event.keyCode == 13) {
                                        handleCustomize();
                                    }
                                }
                            }),
                            h('span', {
                                textContent: 'inch',
                            }),
                        ]),
                    ]
                ),
                ]
            ),
            h( 
                'li',
                {},[                     
                // crop ratio
                h(
                    'label',
                    {                                 
                        
                    },
                    [
                        h('input', { name: 'cropinputtype', type: 'radio', value:'type',
                             onchange: (event) => {inputtypeChange(event)}}),

                        h('span', { class: "customizeinput", textContent: 'Print ratio:'}, [   
                            h('input', {
                                id: 'ratioWidth',
                                type: 'number',
                                min: 0,
                                max: 100,
                                step: 1,
                                disabled: true,
                                onkeydown: (event) => {
                                    // If return key
                                    if (event.keyCode == 13) {
                                        handleCustomize();
                                    }
                                }
                            }),
                            h('span', {
                                textContent: ':',
                                style: 'width: 1.5em;display: inline-block;text-align: right;margin: 0;'
                            }),
                            h('input', {
                                id: 'ratioHeight',
                                type: 'number',
                                min: 0,
                                max: 100,
                                step: 1,
                                disabled: true,
                                onkeydown: (event) => {
                                    // If return key
                                    if (event.keyCode == 13) {
                                        handleCustomize();
                                    }
                                },
                            }),
                        ]),
                    ]
                ),
                ]
            )
                        ])
    ]
);

// inline
{
    editor = appendEditor('.inline-editor', {
        src: './sample.jfif',
        // This will set a square crop aspect ratio
        imageCropAspectRatio: 4 / 3,
        imageCrop: {
            x: 400,
            y: 300,
            width: 1000,
            height: 720,
        },
        // Offer different crop options
        cropSelectPresetFilter: 'landscape',
        cropSelectPresetOptions: cropSelectOptions,
        cropWillRenderTools: (tools, env) => {
            // insert your item
            panel = createNode('Panel', 'customize', {
                            buttonLabel: ' ',
                            buttonClass: 'PinturaButtonHidden', 
                            onshow: value => {
                                const {expectedWidth, expectedHeight, ratioWidth, ratioHeight} = window;
                                var realWidth = (editor.imageCropSize.width / 300).toFixed(1);
                                var realHeight = (editor.imageCropSize.height / 300).toFixed(1);
                                if ( inputedSize.width > 0 && inputedSize.height > 0 
                                    && realWidth > inputedSize.width && realHeight > inputedSize.height) {
                                    expectedWidth.value = inputedSize.width;
                                    expectedHeight.value = inputedSize.height;
                                } else {
                                    expectedWidth.value = realWidth;
                                    expectedHeight.value = realHeight;
                                }
                                
                                var cropRatio = editor.imageCropSize.width / editor.imageCropSize.height;
                                if(!ratioWidth.disabled && ratioWidth.value.length > 0 && ratioHeight.value.length > 0) {
                                    if (cropRatio == ratioWidth.value / ratioHeight.value)
                                        return;
                                }

                                var ratioLabel = getRatioLabel(cropRatio);
                                
                                if (ratioLabel.widthLable != 0) ratioWidth.value = ratioLabel.widthLable;
                                if (ratioLabel.heightLable != 0) ratioHeight.value = ratioLabel.heightLable;

                                if(ratioWidth.value.length == 0) ratioWidth.value = expectedWidth.value;
                                if(ratioHeight.value.length == 0) ratioHeight.value = expectedHeight.value;
                            }, 
                            root: form,
                        });
            return [panel,  ...tools,];
        },

        cropEnableRotationInput: true,
        cropEnableButtonRotateLeft: true,
        // cropEnableButtonFlipHorizontal: false,
        cropEnableZoomInput: true,
        cropImageSelectionCornerStyle: 'hook',
        cropEnableSelectPreset: true,
        cropEnableInfoIndicator: true,
        hasCropSelectPresetOptions: true,
        imageReader: createDefaultImageReader(),
        imageWriter: createDefaultImageWriter(),
        shapePreprocessor: createDefaultShapePreprocessor(),
        enableBrowseImage: true,                    
        ...plugin_filter_defaults,
        ...plugin_frame_defaults,
        ...plugin_finetune_defaults,
        ...markup_editor_defaults,
        locale: {
            ...locale_en_gb,
            ...plugin_crop_locale_en_gb,
            ...plugin_finetune_locale_en_gb,
            ...plugin_filter_locale_en_gb,
            ...plugin_annotate_locale_en_gb,
            ...plugin_frame_locale_en_gb,
            ...markup_editor_locale_en_gb,
        },
    });

    const downloadFile = (file) => {
        // Create a hidden link and set the URL using createObjectURL
        const link = document.createElement('a');
        link.style.display = 'none';
        link.href = URL.createObjectURL(file);
        link.download = file.name;

        // We need to add the link to the DOM for "click()" to work
        document.body.appendChild(link);
        link.click();

        // To make this work on Firefox we need to wait a short moment before clean up
        setTimeout(() => {
            URL.revokeObjectURL(link.href);
            link.parentNode.removeChild(link);
        }, 0);
    };

    editor.on('load', (res) => console.log('inline result', res));

    editor.on('process', (res) => {
        downloadFile(res.dest);
            // var resultUrl = URL.createObjectURL(res.dest);
            // document
            //     .querySelector('.inline-result')
            //     .setAttribute('src', resultUrl)
        }
    );
}
