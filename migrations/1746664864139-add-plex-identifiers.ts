import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPlexIdentifiers1746664864139 implements MigrationInterface {
  name = 'AddPlexIdentifiers1746664864139';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "stored_files" ADD "plexMediaType" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "stored_files" ADD "plexRatingKey" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "stored_files" ADD "plexParentRatingKey" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "stored_files" ADD "plexGrandparentRatingKey" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "stored_files" ADD "plexTitle" character varying`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_57f9f3609dcea3b383a49cf317" ON "stored_files" ("plexMediaType") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_40ccdda153648097fa6029df2d" ON "stored_files" ("plexRatingKey") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4a4ba05ca33bf4ca7e14ecbbf0" ON "stored_files" ("plexParentRatingKey") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2e5c285d076424b9f40065215d" ON "stored_files" ("plexGrandparentRatingKey") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2e5c285d076424b9f40065215d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4a4ba05ca33bf4ca7e14ecbbf0"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_40ccdda153648097fa6029df2d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_57f9f3609dcea3b383a49cf317"`,
    );
    await queryRunner.query(
      `ALTER TABLE "stored_files" DROP COLUMN "plexTitle"`,
    );
    await queryRunner.query(
      `ALTER TABLE "stored_files" DROP COLUMN "plexGrandparentRatingKey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "stored_files" DROP COLUMN "plexParentRatingKey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "stored_files" DROP COLUMN "plexRatingKey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "stored_files" DROP COLUMN "plexMediaType"`,
    );
  }
}
