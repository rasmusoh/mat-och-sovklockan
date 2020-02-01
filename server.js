require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const short = require('short-uuid');
const uuid = require('uuid/v4');
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(express.static('public'));

const { Pool } = require('pg');
const pool = new Pool({
    user: process.env.RDS_USERNAME,
    host: process.env.RDS_HOSTNAME,
    database: process.env.RDS_DB_NAME,
    password: process.env.RDS_PASSWORD,
    port: process.env.RDS_PORT
});
pool.on('error', (err, _) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

const dbScripts = [
    `CREATE TYPE activityType AS ENUM ('sleep', 'eat')`,
    `CREATE TABLE IF NOT EXISTS Baby (
        id SERIAL PRIMARY KEY,
        name VARCHAR(64) NOT NULL,
        uri VARCHAR(64) NOT NULL,
        created TIMESTAMP NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS Activity (
         id SERIAL PRIMARY KEY,
         uid uuid NOT NULL,
         type activityType NOT NULL,
         from_time TIMESTAMP NOT NULL,
         to_time TIMESTAMP NOT NULL,
         baby_id INTEGER REFERENCES Baby NOT NULL);`
];
for (const script of dbScripts) {
    pool.query(script, (err, res) => {
        console.log(err ? err.stack : 'script ran successfully');
    });
}

app.get('/', (_, response) => {
    response.sendFile(`${__dirname}/views/index.html`);
});

app.post('/', (request, response) => {
    const uri = short.generate();
    pool.query(
        `INSERT INTO Baby (name, uri, created) 
            VALUES ($1, $2, $3)`,
        [cleanseString(request.body.name), uri, new Date()],
        error => {
            if (error) {
                console.log(error);
                response.status(500);
                response.send({ message: 'error!' });
            } else {
                response.status(201);
                response.send({ location: `/${uri}` });
            }
        }
    );
});

app.get('/:baby', (_, response) => {
    response.sendFile(`${__dirname}/views/details.html`);
});

app.get('/:baby/activities', (request, response) => {
    console.log('get activities for baby ' + request.params.baby);
    pool.query(
        `SELECT * 
            FROM Activity 
            INNER JOIN Baby ON Activity.baby_id = Baby.id
            WHERE Baby.uri=$1`,
        [request.params.baby],
        (err, res) => {
            if (res && res.rows) {
                response.send(
                    JSON.stringify(
                        res.rows.map(x => ({
                            id: x.uid,
                            type: x.type,
                            from: x.from_time,
                            to: x.to_time
                        }))
                    )
                );
            } else {
                console.log(err);
                response.status(500);
                response.send('error');
            }
        }
    );
});

app.post('/:baby/activities', (request, response) => {
    const babyId = request.params.baby;
    const id = uuid();
    console.log(
        `add to activities ${request.body.type}, ${request.body.from},${request.body.to} from baby ${babyId}`
    );

    pool.query(
        `INSERT INTO Activity (uid, type, from_time, to_time, baby_id) 
            SELECT $1, $2, $3, $4, Baby.id 
            FROM Baby 
            WHERE Baby.uri=$5`,
        [
            id,
            cleanseString(request.body.type),
            cleanseString(request.body.from),
            cleanseString(request.body.to),
            babyId
        ],
        error => {
            if (error) {
                console.log(error);
                response.status(500);
                response.send({ message: 'error!' });
            } else {
                response.status(201);
                response.send({ id: id });
            }
        }
    );
});

app.delete('/:baby/activities', (request, response) => {
    const babyId = request.params.baby;
    console.log(`delete activity ${request.body.id} from ${babyId}`);

    pool.query(
        `DELETE FROM Activity
            USING Baby
         WHERE 
            Activity.baby_id = Baby.id AND
            Activity.uid=$1 AND
            Baby.uri=$2`,
        [request.body.id, babyId],
        error => {
            if (error) {
                console.log(error);
                response.status(500);
                response.send({ message: 'error!' });
            } else {
                response.send();
            }
        }
    );
});

// helper function that prevents html/css/script malice
const cleanseString = function(string) {
    return string.replace(/</g, '&lt;').replace(/>/g, '&gt;');
};

var listener = app.listen(process.env.PORT, () => {
    console.log(`Your app is listening on port ${listener.address().port}`);
});
