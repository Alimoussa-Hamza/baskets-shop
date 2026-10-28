import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261028133741 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "size_guide" drop constraint if exists "size_guide_handle_unique";`);
    this.addSql(`create table if not exists "size_guide" ("id" text not null, "handle" text not null, "title" text not null, "brand" text null, "gender" text check ("gender" in ('female', 'male', 'unisex')) not null default 'unisex', "rows" jsonb not null, "fit_note" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "size_guide_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_size_guide_handle_unique" ON "size_guide" ("handle") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_size_guide_deleted_at" ON "size_guide" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "size_guide" cascade;`);
  }

}
