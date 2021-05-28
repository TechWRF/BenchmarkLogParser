const RegexTools = require('./regex_tools');

class DataProcessor {
    constructor(cwd, log_name) {
        this.log_name = log_name;

        this.benchmark_dict = {};
        this.testcase_dict = {};

        this.regex_tools = new RegexTools();
    };

    assign_test_data() {
        for (let i = 0; i < this.n_tests; i++){
            this.api_method[i][0] = this.api_method[i][0]
                .replace(this.regex_tools.quotes, '')
                .split('.');
    
            this.testcase_dict[i] = {
                'method_API': this.api_method[i][0][0],
                'method_name': this.api_method[i][0][1],
                'params': this.params[i][0],
                'dur': parseFloat(this.durs[i][0])
            };
        };
    };

    process_data(raw_data) {
        this.proc_data = raw_data.replace(this.regex_tools.empty_line, '');

        this.benchmark_dict['description'] = this.proc_data.split(this.regex_tools.eol)[0];
        this.benchmark_dict['environment'] = this.regex_tools.match_regex(this.proc_data, 'installed: ', this.regex_tools.white_end);
        this.benchmark_dict['date'] = null;
        this.benchmark_dict['server'] = this.regex_tools.match_regex(this.proc_data, 'https?:\/\/', this.regex_tools.white_end);
        this.benchmark_dict['app_version'] = this.regex_tools.match_regex(this.proc_data, '"jsonrpc": ', this.regex_tools.comma_end).replace(this.regex_tools.quotes, '');
        this.benchmark_dict['test_version'] = this.regex_tools.match_regex(this.proc_data, '"id": ', this.regex_tools.comma_end).replace(this.regex_tools.quotes, '');

        this.api_method = this.regex_tools.matchAll_regex(this.proc_data, '"method": ', this.regex_tools.comma_end);

        this.n_tests = this.api_method.length;

        this.params = this.regex_tools.matchAll_regex(this.proc_data, '"params": {', this.regex_tools.curly_end);
        this.durs = this.regex_tools.matchAll_regex(this.proc_data, 'Got response in ', this.regex_tools.sec_end);

        this.assign_test_data();

        return [this.benchmark_dict, this.testcase_dict, this.n_tests];
    };
};

module.exports = DataProcessor;