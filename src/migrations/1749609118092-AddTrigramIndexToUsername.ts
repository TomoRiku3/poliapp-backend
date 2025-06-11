import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTrigramIndexToUsername1749609118092 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS users_username_trgm_idx
      ON users USING GIN (username gin_trgm_ops)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS users_username_trgm_idx`);
  }

}
