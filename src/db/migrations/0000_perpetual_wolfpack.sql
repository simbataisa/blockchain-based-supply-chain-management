CREATE TYPE "public"."product_category" AS ENUM('Electronics', 'Pharmaceuticals', 'Food & Beverage', 'Automotive', 'Textiles', 'Chemicals');--> statement-breakpoint
CREATE TYPE "public"."product_status" AS ENUM('created', 'in_transit', 'delivered', 'verified', 'recalled');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'manufacturer', 'distributor', 'retailer', 'consumer');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('active', 'inactive', 'suspended');--> statement-breakpoint
CREATE TABLE "product_transfers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"from_owner_id" uuid,
	"to_owner_id" uuid NOT NULL,
	"from_location" varchar(255),
	"to_location" varchar(255) NOT NULL,
	"transfer_type" varchar(50) NOT NULL,
	"notes" text,
	"blockchain_tx_hash" varchar(66),
	"verified_at" timestamp,
	"verified_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"category" "product_category" NOT NULL,
	"sku" varchar(100) NOT NULL,
	"batch_number" varchar(100) NOT NULL,
	"manufacturer_id" uuid NOT NULL,
	"current_owner_id" uuid NOT NULL,
	"status" "product_status" DEFAULT 'created' NOT NULL,
	"origin_location" varchar(255) NOT NULL,
	"current_location" varchar(255) NOT NULL,
	"price" numeric(10, 2),
	"quantity" integer DEFAULT 1,
	"weight" numeric(8, 2),
	"dimensions" varchar(100),
	"expiry_date" timestamp,
	"certifications" text[],
	"metadata" jsonb,
	"blockchain_tx_hash" varchar(66),
	"qr_code_data" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "products_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(100) NOT NULL,
	"description" text,
	"address" text,
	"contact_email" varchar(255),
	"contact_phone" varchar(50),
	"wallet_address" varchar(42),
	"is_verified" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auth_id" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"role" "user_role" DEFAULT 'consumer' NOT NULL,
	"status" "user_status" DEFAULT 'active' NOT NULL,
	"organization_id" uuid,
	"wallet_address" varchar(42),
	"profile_image" text,
	"phone_number" varchar(50),
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_auth_id_unique" UNIQUE("auth_id"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "product_transfers" ADD CONSTRAINT "product_transfers_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_transfers" ADD CONSTRAINT "product_transfers_from_owner_id_organizations_id_fk" FOREIGN KEY ("from_owner_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_transfers" ADD CONSTRAINT "product_transfers_to_owner_id_organizations_id_fk" FOREIGN KEY ("to_owner_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_transfers" ADD CONSTRAINT "product_transfers_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_manufacturer_id_organizations_id_fk" FOREIGN KEY ("manufacturer_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_current_owner_id_organizations_id_fk" FOREIGN KEY ("current_owner_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;