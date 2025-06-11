import { AppDataSource } from '../../src/config/data-source';

module.exports = async () => {
  await AppDataSource.initialize();
  await AppDataSource.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
  await AppDataSource.destroy();
};
