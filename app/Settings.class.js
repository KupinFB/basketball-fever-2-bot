
class Settings{

    /** @param {Object|null} [options]
     * @param {String} options.PAGE_ACCESS_TOKEN
     * @param {String} options.VERIFY_TOKEN
     * @param {String} options.APP_SECRET
     * @param {String} options.DB_HOST
     * @param {String} options.DB_USER
     * @param {String} options.DB_USER_PASS
     * @param {String} options.DB_NAME
     * @param {Number} options.PORT
     * @param {boolean} isDevMode
     * @constructor */
    constructor(options, isDevMode){

        /**
         * @public
         * @type {String} */
        this.PAGE_ACCESS_TOKEN = options.PAGE_ACCESS_TOKEN;

        /**
         * @public
         * @type {String} */
        this.VERIFY_TOKEN = options.VERIFY_TOKEN;

        /**
         * @public
         * @type {String} */
        this.APP_SECRET = options.APP_SECRET;

        /**
         * @public
         * @type {String} */
        this.DB_HOST = options.DB_HOST;

        /**
         * @public
         * @type {String} */
        this.DB_USER = options.DB_USER;

        /**
         * @public
         * @type {String} */
        this.DB_USER_PASS = options.DB_USER_PASS;

        /**
         * @public
         * @type {String} */
        this.DB_NAME = options.DB_NAME;

        /**
         * @public
         * @type {Number} */
        this.PORT = options.PORT;

        /**
         * @public
         * @type {boolean} */
        this.IS_DEV_MODE = isDevMode;
    }
}

exports.Settings = Settings;
