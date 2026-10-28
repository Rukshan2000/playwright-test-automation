// Example students. The E2E "read" test relies on Ada Lovelace being here.
exports.seed = async (knex) => {
  await knex('students').del();
  await knex('students').insert([
    { first_name: 'Ada', last_name: 'Lovelace', email: 'ada@example.com', age: 28, course: 'Mathematics' },
    { first_name: 'Alan', last_name: 'Turing', email: 'alan@example.com', age: 31, course: 'Computer Science' },
    { first_name: 'Grace', last_name: 'Hopper', email: 'grace@example.com', age: 35, course: 'Software Engineering' },
  ]);
};
