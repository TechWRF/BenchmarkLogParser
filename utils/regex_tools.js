class RegexTools {
    constructor() {
        this.empty_line = /^\s*$(?:\r\n?|\n)/gm;
        this.whitespace = /[\s]+/g;
        this.space = /[/ ]/g;
        this.eol = /[\r\n]+/;
        this.quotes = /['"]+/g;
        this.comma_end = '[^,]+';
        this.white_end = '[^\\s\\r\\n]+';
        this.curly_end = '[^}]+';
        this.sec_end = '[^s]+';
        this.select_keys = /(?<=SELECT ).+(?= FROM)/i;
        this.comma = /, ?/;
        this.select = /select/i;
    };

    match_regex(proc_data, keyword, end) {
        var regex = new RegExp(`(?<=${keyword})(${end})`, 'i');
        return proc_data.match(regex)[0];
    };

    matchAll_regex(proc_data, keyword, end) {
        var regex = new RegExp(`(?<=${keyword})(${end})`, 'gi');
        return [...proc_data.matchAll(regex)];
    };
};

module.exports = RegexTools;