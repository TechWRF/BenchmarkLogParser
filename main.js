// install xampp, start apache and mysql
// npm install express mysql open argparse url-join

const DataReader = require('./utils/data_reader');
const DataProcessor = require('./utils/data_processor');
const SqlDbTool = require('./utils/sql_db_tool');
const {ArgumentParser} = require('argparse');

function parse_arguments() {
    const argparser = new ArgumentParser();

    argparser.add_argument('--log_name', {default: 'log.txt', help: 'data file'});
    argparser.add_argument('--echo_stats', {default: false, help: 'view n of tests'});
    argparser.add_argument('--echo_result', {default: false, help: 'view parsed data'});
    argparser.add_argument('--db_name', {default: 'benchmark_db', help: 'one thats not created yet!'});
    argparser.add_argument('--port', {default: 3000, help: 'free port'});
    argparser.add_argument('--sleep', {default: 250, help: 'db creation intervals in ms'});
    argparser.add_argument('--query_name', {default: null, help: 'sql file in sql dir'});

    return argparser.parse_args();
};

function echo() {
    if (args['echo_stats']) {
        console.log(`Log File Path:\n${log_path}`)
        console.log(`Number of Testcases in Benchmark: ${n_tests}`);
    }

    if (args['echo_result']) {
        console.log(benchmark_dict);
        for (let i = 0; i < n_tests; i++){
            console.log(testcase_dict[i]);
        }
    }
}

const host = 'localhost';
const user = 'root';
const protocol = 'http:';

const args = parse_arguments();

const data_reader = new DataReader(__dirname);
const data_processor = new DataProcessor(args['log_name']);

data = data_reader.read_data(args['log_name']);
const raw_data = data[0];
const log_path = data[1];

data = data_processor.process_data(raw_data);
var benchmark_dict = data[0];
var testcase_dict = data[1];
var n_tests = data[2];

delete data; echo();

const sql_db_tool = new SqlDbTool(__dirname, args['db_name'], host, user, args['port'], protocol, args['sleep']);
sql_db_tool.build_database(benchmark_dict, testcase_dict, args['query_name']);