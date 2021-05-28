const path = require('path');
const fs = require('fs');

class DataReader {
    constructor(cwd) {
        this.cwd = cwd;
    };

    check_path(path_dir) {
        if (!fs.existsSync(path_dir)) {
            throw new Error(`ERROR: ${path_dir} does not exist`);
        };
    };

    read_data(log_name) {
        var log_dir = path.join(this.cwd, 'data');
        this.check_path(log_dir);

        var log_path = path.join(log_dir, log_name);
        this.check_path(log_path);

        return [fs.readFileSync(log_path, {encoding: 'utf8'}), log_path];
    };

    read_sql(query_name) {
        var sql_dir = path.join(this.cwd, 'sql');
        this.check_path(sql_dir);

        var sql_path = path.join(sql_dir, `${query_name}.sql`);
        this.check_path(sql_path);

        return [fs.readFileSync(sql_path, {encoding: 'utf8'}), sql_path][0];
    }
};

module.exports = DataReader;