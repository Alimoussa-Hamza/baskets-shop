import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261029002925 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "supplier" add column if not exists "integration" text check ("integration" in ('email', 'cj')) not null default 'email', add column if not exists "logistic_name" text null;`);

    this.addSql(`alter table if exists "supplier_order" add column if not exists "carrier" text null, add column if not exists "shipped_at" timestamptz null, add column if not exists "lines" jsonb null, add column if not exists "last_error" text null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "supplier" drop column if exists "integration", drop column if exists "logistic_name";`);

    this.addSql(`alter table if exists "supplier_order" drop column if exists "carrier", drop column if exists "shipped_at", drop column if exists "lines", drop column if exists "last_error";`);
  }

}
