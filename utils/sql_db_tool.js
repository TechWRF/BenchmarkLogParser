const express = require('express');
const mysql = require('mysql');
const open = require('open');
const urljoin = require('url-join');
const RegexTools = require('./regex_tools');
const DataReader = require('./data_reader');

class SqlDbTool {
    constructor(cwd, db_name, host, user, port, protocol, async_sleep) {
        this.db_name = db_name;
        this.host = host;
        this.user = user;
        this.port = port;
        this.protocol = protocol;
        this.async_sleep = async_sleep;

        this.server_loc = urljoin(this.protocol, `${this.host}:${this.port}`);

        this.regex_tools = new RegexTools();
        this.data_reader = new DataReader(cwd);
    };

    sleep(ms) {
        return new Promise((resolve) => {
          setTimeout(resolve, ms);
        });
    };

    callback (err, result) {
        // Dummy callback function, used as default for sql queries
    };

    display(res, result, sql_code) {
        // Creates HTML code to view result of SELECT statements

        var cols = sql_code.match(this.regex_tools.select_keys)[0].split(this.regex_tools.comma);
        for (var j = 0; j < cols.length; j++) {
            cols[j] = cols[j].replace(this.regex_tools.whitespace, '');
        };
    
        if (cols[0] === '*') {
            cols = Object.keys(result[0]).map(function(key){
                return key;
            });
        };
    
        var table_content = '';
        for (var i = 0; i < result.length; i++) {
            table_content += `<tr><td>${i + 1}</td><td>`;
    
            for (var j = 0; j < cols.length; j++) {
                    if (j === cols.length - 1) var b = '</tr>';
                    else var b = '<td>';
                    
                    table_content +=`${result[i][cols[j]]}</td>${b}`;
            };
        };
        var table_header = '<tr><th>result_id</th><th>';
        for (var j = 0; j < cols.length; j++) {
            if (j === cols.length - 1) var b = '</tr>';
            else var b = '<th>';
    
            table_header +=`${cols[j]}</th>${b}`;
        };
    
        const table = `<table border="1">${table_header}${table_content}</table>`;
        var html_head =`<html><body><h1>${sql_code}</h1>${table}</body></html>`;
    
        res.writeHead(200, {'Content-Type':'text/html; charset=utf-8'});
        res.write(html_head, 'utf-8');
    };

    sql_query(sql_code, query_name, callback, values=null, show=true) {
        // Creates path in server and SQL query for it
        // Implemented error handling for existing objects 
        // Opens created path to query, keeps browser open for result viewing

        sql_code = sql_code.replace(this.regex_tools.eol, ' ');
        query_name = query_name.replace(this.regex_tools.space, '_');
    
        this.app.get(`/${query_name}`, (req, res) => {
            this.db.query(sql_code, [values], (err, result) => {
                if (err && [1050, 1007].includes(err['errno'])) {
                    console.log(err['sqlMessage']);
                }
                else if (err) {
                    throw (err['sqlMessage'], err['sql']);
                }

                console.log(`Successful query: "${query_name}"`);
                
                if (this.regex_tools.select.test(sql_code) && show) {
                    this.display(res, result, sql_code);
                }
                else {
                    res.send('<script>window.close();</script >');
                }
    
                callback(err, result);
            });
        });
    
        open(urljoin(this.server_loc, query_name));
    };

    connect() {
        // Creates connection, connects

        this.db = mysql.createConnection({
            host: this.host,
            user: this.user,
            database: this.db_name
        });

        this.db.connect((err) => {
            if (err) throw err;
            console.log('My SQL Connected')
        });

        this.app = express();
        console.log(`Creating Server at "${this.server_loc}"...`)
    };

    async build_database(benchmark_dict, testcase_dict, query_name) {
        // Asynchronically creates database, tables, and inputs data

        this.connect()
        await this.sleep(this.async_sleep);

        // Create DB
        this.sql_query(
            `CREATE DATABASE ${this.db_name}`,
            'create db',
            this.callback
        );
        await this.sleep(this.async_sleep);
            
        // Switch to DB
        this.sql_query(
            `USE ${this.db_name}`,
            'switch db',
            this.callback
        );
        await this.sleep(this.async_sleep);
    
        // Create Benchmarks Table
        this.sql_query(
            `CREATE TABLE Benchmarks (
                id int AUTO_INCREMENT,
                description VARCHAR(500),
                environment VARCHAR(500),
                date VARCHAR(30),
                server VARCHAR(30),
                app_version VARCHAR(10),
                test_version VARCHAR(10),
                PRIMARY KEY (id)
            )`,
            'create benchmark table',
            this.callback
        );
        await this.sleep(this.async_sleep);
    
        // Create Testcases Table
        this.sql_query(
            `CREATE TABLE Testcases (
                id int AUTO_INCREMENT,
                benchmark_id int,
                method_API VARCHAR(30),
                method_name VARCHAR(30),
                params VARCHAR(500),
                dur FLOAT,
                PRIMARY KEY (id)
            )`,
            'create testcase table',
            this.callback
        );
        await this.sleep(this.async_sleep);
    
        // Fill Benchmarks Table
        this.sql_query(
            `INSERT INTO Benchmarks (
                description,
                environment,
                date,
                server,
                app_version,
                test_version
            )
            VALUES ?`,
            'insert benchmark data',
            this.callback,
            [Object.keys(benchmark_dict).map(function(key){
                return benchmark_dict[key];
            })]
        );
        await this.sleep(this.async_sleep);
    
        // Get Current Number of Benchmark Runs and Fill Testcase Table
        this.sql_query(
            `SELECT id FROM Benchmarks ORDER BY id DESC LIMIT 1`,
            'select id',
            (err, result) => {
                var benchmark_n = result[0]['id'];
    
                this.sql_query(
                    `INSERT INTO Testcases (
                        benchmark_id,
                        method_API,
                        method_name,
                        params,
                        dur
                    )
                    VALUES ?`,
                    'insert testcase data',
                    this.callback,
                    Object.keys(testcase_dict).map(function(key0) {
                        var data_arr = Object.keys(testcase_dict[key0]).map(function(key1) {
                        return testcase_dict[key0][key1];
                        })
                        data_arr.unshift(benchmark_n);
                        return data_arr;
                    })
                );
            },
            null,
            false
        );
        await this.sleep(this.async_sleep);
    
        // Add Foreign Key
        this.sql_query(
            `ALTER TABLE Testcases
            ADD FOREIGN KEY (benchmark_id)
            REFERENCES Benchmarks (id)`,
            'foreign key',
            this.callback
        );
        await this.sleep(this.async_sleep);

        this.app.listen(this.port, () => {
            console.log(`Server Started on Port ${this.port}`);

        open(urljoin(this.protocol, this.host, 'phpmyadmin'));
        });

        if (query_name !== null) this.do_sql(query_name);
    };

    do_sql(query_name) {
        var sql_code = this.data_reader.read_sql(query_name);

        this.sql_query(
            sql_code,
            query_name,
            this.callback
        );
    };

};

module.exports = SqlDbTool;