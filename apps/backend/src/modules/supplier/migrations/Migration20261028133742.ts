import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261028133742 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "supplier" ("id" text not null, "name" text not null, "country" text not null, "email" text not null, "vat_number" text null, "lead_time_days" integer not null default 5, "ships_from_eu" boolean not null default true, "written_agreement_ref" text null, "active" boolean not null default true, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "supplier_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_supplier_deleted_at" ON "supplier" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "supplier_order" ("id" text not null, "order_id" text not null, "status" text check ("status" in ('to_place', 'placed', 'shipped', 'delivered', 'cancelled')) not null default 'to_place', "supplier_reference" text null, "tracking_number" text null, "cost_total_cents" integer null, "placed_at" timestamptz null, "supplier_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "supplier_order_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_supplier_order_order_id" ON "supplier_order" ("order_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_supplier_order_supplier_id" ON "supplier_order" ("supplier_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_supplier_order_deleted_at" ON "supplier_order" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "supplier_order" add constraint "supplier_order_supplier_id_foreign" foreign key ("supplier_id") references "supplier" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "supplier_order" drop constraint if exists "supplier_order_supplier_id_foreign";`);

    this.addSql(`drop table if exists "supplier" cascade;`);

    this.addSql(`drop table if exists "supplier_order" cascade;`);
  }

}
