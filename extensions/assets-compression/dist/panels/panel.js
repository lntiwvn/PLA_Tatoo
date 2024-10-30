'use strict';

const { updateKeyValue } = require("../editorSetupInit");

Object.defineProperty(exports, "__esModule", { value: true });


module.exports = Editor.Panel.define({
    template: `
    <div class="content">
        <header>
            <ui-button class="submit" id="submit-button"
            >
                Submit
            </ui-button>
        </header>
        <section>
            <div>
                <ui-input id="input-key"
                    placeholder="Enter your key here!"
                ></ui-input>
            </div>
        </section>
    </div>
    `,
    style: `
    :host { display: flex; padding: 6px; flex-direction: column; }
    :host .content { flex: 1; display: flex; flex-direction: column; }
    header { margin-bottom: 6px; }
    header > ui-button.submit { float: right; }
    section { flex: 1; background: var(--color-normal-fill-emphasis); border-radius: calc(var(--size-normal-radius) * 1px); padding: 4px; }
    .input-container { padding: 10px; }
    .input-container > ui-input { 
        width: 100%; 
        height: 40px; 
        font-size: 16px; 
        box-sizing: border-box; 
    }
    `,
    methods: {
    },
    $:{
        key:"#input-key",
        button:"#submit-button"
    },
    ready() {
        console.log('Panel is loaded!');
        this.$.button.addEventListener('click', () =>{
            updateKeyValue(this.$.key.value);
        })
    }
});
