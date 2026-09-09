import ConnectionManager from '/js/utils/connectionManager.js';
import OpCodes from '/js/enums/OpCodes.js';

export default class BaseDashboard {
    constructor() {
        this.connectionManager = new ConnectionManager();
        this.#handleSocketListener();
        if (this.handlePageSocketListener) this.handlePageSocketListener();
        this.#connect();
    }

    #connect() {
        this.connectionManager.connect();
    }

    #handleSocketListener() {
        this.connectionManager.on('socket:connect', () => {
            this.connectionManager.emit(OpCodes.DASHBOARD_LOGIN.value);
        });
    }
}
