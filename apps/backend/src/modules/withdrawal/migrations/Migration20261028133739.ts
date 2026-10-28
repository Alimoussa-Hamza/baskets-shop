import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261028133739 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "withdrawal_request" ("id" text not null, "order_id" text not null, "order_display_id" integer not null, "email" text not null, "scope" text check ("scope" in ('full', 'partial')) not null default 'full', "item_ids" jsonb null, "status" text check ("status" in ('draft', 'acknowledged', 'processed', 'rejected')) not null default 'draft', "submitted_at" timestamptz not null, "acknowledged_at" timestamptz null, "note" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "withdrawal_request_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_withdrawal_order_id" ON "withdrawal_request" ("order_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_withdrawal_request_deleted_at" ON "withdrawal_request" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "withdrawal_request" cascade;`);
  }

}
