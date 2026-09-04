import loader from '/js/utils/loader.js';
import template from '/js/utils/template.js';
import OpCodesIm from '/js/enums/OpCodes.js';

/** @typedef {import("../../../js/enums/OpCodes.js").OpCodesType} OpCodesType */

/** @type {OpCodesType} */
const OpCodes = OpCodesIm;

class Dashboard {
    constructor() {
        loader.hide();
    }
}

const dashboard = new Dashboard();
