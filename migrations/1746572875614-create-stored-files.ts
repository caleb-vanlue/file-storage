import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateStoredFiles1746572875614 implements MigrationInterface {
    name = 'CreateStoredFiles1746572875614'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "stored_files" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "filename" character varying(255) NOT NULL, "originalName" character varying(255) NOT NULL, "mimeType" character varying(100) NOT NULL, "path" character varying(255) NOT NULL, "size" integer NOT NULL, "isPublic" boolean NOT NULL DEFAULT false, "referenceType" character varying, "referenceId" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5d5be862bf53851c1794b4adf4e" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "stored_files"`);
    }

}
