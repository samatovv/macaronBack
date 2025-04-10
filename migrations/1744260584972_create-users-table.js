/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
    pgm.createTable('users', {
      id: 'id',
      email: { type: 'varchar(255)', notNull: true, unique: true },
      password: { type: 'varchar(255)', notNull: true },
      first_name: { type: 'varchar(255)' },
      last_name: { type: 'varchar(255)' },
      smtp_user: { type: 'varchar(255)' },
      smtp_pass: { type: 'varchar(255)' },
      smtp_service: { type: 'varchar(50)' },
    });
  };
  

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {};
