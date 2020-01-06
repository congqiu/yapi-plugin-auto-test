let _config = {
};

class Config {
    static get instance() {
        return _config;
    }

    static set instance(options) {
        if (options && typeof options == 'object') {
            let config = Object.assign(_config, options);
            _config = config;
        }
    }
}

module.exports = Config;
