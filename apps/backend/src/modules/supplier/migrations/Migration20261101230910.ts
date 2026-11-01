import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261101230910 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "supplier_variant" ("id" text not null, "variant_id" text not null, "sku" text null, "cost_cents" integer null, "supplier_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "supplier_variant_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_supplier_variant_variant_id" ON "supplier_variant" ("variant_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_supplier_variant_supplier_id" ON "supplier_variant" ("supplier_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_supplier_variant_deleted_at" ON "supplier_variant" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "supplier_variant" add constraint "supplier_variant_supplier_id_foreign" foreign key ("supplier_id") references "supplier" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "supplier_variant" cascade;`);
  }

}
