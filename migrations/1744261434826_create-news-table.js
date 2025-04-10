/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.up = (pgm) => {
    pgm.createTable('news', {
      id: 'id',
      name: { type: 'varchar(255)', notNull: true },
      short_description: { type: 'text' },
      description: { type: 'text' },
      price: { type: 'numeric(10,2)', notNull: true },
      discount_price: { type: 'numeric(10,2)' },
      images: { type: 'text[]' },
      created_at: { type: 'timestamp', default: pgm.func('current_timestamp') },
    });
  };
  
  exports.down = (pgm) => {
    pgm.dropTable('news');
  };
  