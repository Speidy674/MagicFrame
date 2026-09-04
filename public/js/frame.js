import loader from '/js/utils/loader.js';
import template from '/js/utils/template.js';
import OpCodesIm from '/js/enums/OpCodes.js';

/** @typedef {import("../../js/enums/OpCodes.js").OpCodesType} OpCodesType */

/** @type {OpCodesType} */
const OpCodes = OpCodesIm;

class Frame {
    #isConnected = false;
    #authenticated = false;

    settings = null;

    showing;
    playInfo = {
        ref: null,
        id: null,
        data: null,
    };

    constructor() {
        loader.show();
        this.#connect();
        this.authenticate();
    }

    #connect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.#isConnected = false;
            this.#authenticated = false;
        }
        this.socket = new io();

        this.#handleListiner();
    }

    #handleListiner() {
        this.socket.on('connect', () => {
            console.log(
                '[Socket]',
                `[${new Date().toLocaleString()}]`,
                'connect'
            );

            this.#isConnected = true;

            this.authenticate();
        });

        this.socket.on('connect_error', (err) => {
            console.log(
                '[Socket]',
                `[${new Date().toLocaleString()}]`,
                'connect_error: ' + err
            );
            this.reset(true);
        });

        this.socket.on('disconnect', (err) => {
            console.log(
                '[Socket]',
                `[${new Date().toLocaleString()}]`,
                'disconnect: ' + err
            );
            this.reset(true);
        });

        this.socket.io.on('reconnect', () => {
            console.log(
                '[Socket]',
                `[${new Date().toLocaleString()}]`,
                'reconnect'
            );
        });

        this.socket.onAny((eventName, ...data) => {
            console.debug('[Socket]', `Message [${eventName}]`, ...data);
        });

        this.socket.on(OpCodes.FRAME_REGISTER.value, ({ id: id }) => {
            this.id = id;
            this.authenticate();
        });

        this.socket.on(OpCodes.FRAME_LOGIN.value, () => {
            this.#authenticated = true;
        });

        this.socket.on(OpCodes.FRAME_LOGIN_ERROR.value, (err) => {
            console.debug('[Socket]', 'Login Error:', err);
            this.socket.disconnect();
        });

        this.socket.on(OpCodes.FRAME_SETTINGS.value, (settings) => {
            this.settings = settings;
        });

        this.socket.on(OpCodes.FRAME_ID_CHANGE.value, ({ id: id }) => {
            this.id = id;
            window.location.reload();
        });

        this.socket.on(OpCodes.FRAME_INFO.value, async ({ method: method }) => {
            if (method === 'show') {
                this.removeFrames();
                if (document.querySelector('#frameInfos'))
                    document.querySelector('#frameInfos').remove();
                const frameInfoHtml = await template.load('frame.info', {
                    frame: {
                        id: this.id,
                        width: window.innerWidth,
                        height: window.innerHeight,
                    },
                });

                document.querySelector('body').innerHTML += frameInfoHtml;
                loader.hide();
            } else {
                if (!document.querySelector('#frameInfos')) return;

                document.querySelector('#frameInfos').remove();
            }
        });

        this.socket.on(
            OpCodes.FRAME_PLAY.value,
            async ({ ref: ref, id: id, data: data }) => {
                console.log('[Socket]', 'Ref:', ref, 'ID:', id, 'Data:', data);

                if (
                    this.playInfo.ref === ref &&
                    this.playInfo.id === id &&
                    JSON.stringify(this.playInfo.data) === JSON.stringify(data)
                ) {
                    console.log('[Socket]', 'already playing');
                    return;
                }

                this.playInfo.ref = ref;
                this.playInfo.id = id;
                this.playInfo.data = data;

                switch (ref) {
                    case 'media':
                        const response = await fetch(`/api/media/${id}/info`);
                        const mediaInfo = await response.json();
                        switch (mediaInfo.type) {
                            case 'image':
                                this.loadPic(id);
                                break;
                            case 'video':
                                this.loadVid(id);
                                break;
                            default:
                                console.error(
                                    '[Frame]',
                                    `[${new Date().toLocaleString()}]`,
                                    'type ' +
                                        mediaInfo.type +
                                        ' is not supported'
                                );
                                break;
                        }
                        break;

                    case 'twitch':
                        this.loadTwitch(data);
                        break;
                    default:
                        console.error(
                            '[Frame]',
                            `[${new Date().toLocaleString()}]`,
                            'ref ' + ref + ' is not supported'
                        );
                        break;
                }
                loader.hide();
            }
        );

        this.socket.on(OpCodes.RELOAD.value, () => {
            window.location.reload();
        });
    }

    loadVid(id) {
        let html =
            '<video src="/api/media/{{id}}" class="frame-item opacity-0" muted loop></video>';
        html = Mustache.render(html, {
            id,
        });

        document
            .querySelector('#app .frame-item:not(.old)')
            ?.classList.add('old');

        document.querySelector('#app').innerHTML += html;
        document.querySelector('#app .frame-item:not(.old)').play();

        this.blendFrame();
    }

    loadPic(id) {
        let html =
            '<img src="/api/media/{{id}}" class="frame-item opacity-0"></img>';
        html = Mustache.render(html, {
            id,
        });

        document
            .querySelector('#app .frame-item:not(.old)')
            ?.classList.add('old');

        document.querySelector('#app').innerHTML += html;

        this.blendFrame();
    }

    loadTwitch(data) {
        let html =
            '<iframe class="frame-item opacity-0" src="https://player.twitch.tv/?{{type}}={{typeValue}}&parent={{parent}}&muted={{muted}}" allowfullscreen> </iframe>';
        html = Mustache.render(html, {
            type: data.type,
            typeValue: data.value,
            parent: location.host.split(':')[0],
            muted: this.settings?.muted ?? true,
        });
        document.querySelector('#app').innerHTML = html;

        this.blendFrame();
    }

    blendFrame() {
        let frameOld = document.querySelectorAll('#app .frame-item.old');
        let frameNew = document.querySelector('#app .frame-item:not(.old)');

        setTimeout(() => {
            frameNew.classList.remove('opacity-0');
            for (const frame of frameOld) {
                frame.classList.add('opacity-0');
            }
        }, 100);

        setTimeout(() => {
            for (const frame of frameOld) {
                frame.remove();
            }
        }, 2100);
    }

    reset(disconnected = false) {
        loader.show();

        this.removeFrames();

        if (disconnected) {
            this.#isConnected = false;
            this.#authenticated = false;
        }
    }

    removeFrames() {
        this.playInfo = {
            ref: null,
            id: null,
            data: null,
        };
        let frameItems = document.querySelectorAll('#app .frame-item');
        for (const frameItem of frameItems) {
            frameItem.remove();
        }
    }

    authenticate() {
        if (!this.#isConnected) return;

        if (this.#authenticated) return;

        if (!this.id) {
            this.register();
        } else {
            this.login();
        }
    }

    register() {
        if (!this.#isConnected) return;
        this.socket.emit(OpCodes.FRAME_REGISTER.value);
    }

    login() {
        if (!this.#isConnected) return;
        this.socket.emit(OpCodes.FRAME_LOGIN.value, { id: this.id });
    }

    get id() {
        return window.localStorage.getItem('frame.id');
    }

    set id(value) {
        window.localStorage.setItem('frame.id', value);
    }
}

const frame = new Frame();
