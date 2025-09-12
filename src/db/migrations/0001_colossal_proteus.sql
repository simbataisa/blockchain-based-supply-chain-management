CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"action" varchar(100) NOT NULL,
	"resource_type" varchar(50) NOT NULL,
	"resource_id" varchar(100),
	"old_values" jsonb,
	"new_values" jsonb,
	"ip_address" varchar(45),
	"user_agent" text,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "smart_contracts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"contract_address" varchar(42) NOT NULL,
	"abi" jsonb NOT NULL,
	"bytecode" text,
	"network" varchar(50) DEFAULT 'localhost' NOT NULL,
	"deployed_by" uuid,
	"deployment_tx_hash" varchar(66),
	"deployment_block_number" integer,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"version" varchar(20) DEFAULT '1.0.0',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "smart_contracts_contract_address_unique" UNIQUE("contract_address")
);
--> statement-breakpoint
CREATE TABLE "tracking_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"location" varchar(255) NOT NULL,
	"latitude" numeric(10, 8),
	"longitude" numeric(11, 8),
	"event_type" varchar(50) NOT NULL,
	"actor_id" uuid NOT NULL,
	"notes" text,
	"sensor_data" jsonb,
	"blockchain_tx_hash" varchar(66),
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quality_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"inspector_id" uuid NOT NULL,
	"quality_score" numeric(5, 2) NOT NULL,
	"test_results" jsonb,
	"compliance_status" varchar(20) NOT NULL,
	"notes" text,
	"blockchain_tx_hash" varchar(66),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" varchar(50) NOT NULL,
	"product_id" uuid,
	"from_user_id" uuid,
	"to_user_id" uuid,
	"from_location" varchar(255),
	"to_location" varchar(255),
	"quantity" integer,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"blockchain_tx_hash" varchar(66),
	"block_number" integer,
	"gas_used" integer,
	"gas_fee" numeric(18, 8),
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "smart_contracts" ADD CONSTRAINT "smart_contracts_deployed_by_users_id_fk" FOREIGN KEY ("deployed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracking_records" ADD CONSTRAINT "tracking_records_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracking_records" ADD CONSTRAINT "tracking_records_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quality_records" ADD CONSTRAINT "quality_records_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quality_records" ADD CONSTRAINT "quality_records_inspector_id_users_id_fk" FOREIGN KEY ("inspector_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_from_user_id_users_id_fk" FOREIGN KEY ("from_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_to_user_id_users_id_fk" FOREIGN KEY ("to_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;