const knex = require('knex');
const config = require('../../knexfile');

const env = process.env.KNEX_ENV || 'development';
module.exports = knex(config[env]);
