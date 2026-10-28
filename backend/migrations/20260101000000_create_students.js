exports.up = (knex) =>
  knex.schema.createTable('students', (t) => {
    t.increments('id').primary();
    t.string('first_name').notNullable();
    t.string('last_name').notNullable();
    t.string('email').notNullable().unique();
    t.integer('age').notNullable();
    t.string('course').notNullable();
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });

exports.down = (knex) => knex.schema.dropTable('students');
