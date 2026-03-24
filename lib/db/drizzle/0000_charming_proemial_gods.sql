CREATE TABLE "clients" (
	"id" serial PRIMARY KEY NOT NULL,
	"phone" varchar(30) NOT NULL,
	"name" text,
	"email" text,
	"lead_status" varchar(20) DEFAULT 'cold' NOT NULL,
	"purchase_probability" real DEFAULT 0 NOT NULL,
	"technical_level" varchar(20) DEFAULT 'basic' NOT NULL,
	"total_interactions" integer DEFAULT 0 NOT NULL,
	"last_interaction" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "clients_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price" real NOT NULL,
	"category" varchar(100) NOT NULL,
	"brand" text,
	"stock" integer DEFAULT 0 NOT NULL,
	"image_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"role" varchar(10) NOT NULL,
	"message" text NOT NULL,
	"intent" varchar(50),
	"agent" varchar(50),
	"confidence" real,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bot_config" (
	"id" serial PRIMARY KEY NOT NULL,
	"bot_name" text DEFAULT 'Bot Inteligente' NOT NULL,
	"personality" text DEFAULT 'Soy un asistente de ventas inteligente, amable y profesional. Ayudo a los clientes a encontrar los mejores productos y soluciones para sus necesidades.' NOT NULL,
	"language" varchar(10) DEFAULT 'es' NOT NULL,
	"greeting_message" text DEFAULT '¡Hola! 👋 Soy Bot Inteligente, tu asistente virtual. ¿En qué puedo ayudarte hoy?' NOT NULL,
	"fallback_message" text DEFAULT 'Lo siento, no entendí bien tu mensaje. ¿Puedes reformularlo? Puedo ayudarte con productos, precios, soporte técnico y más.' NOT NULL,
	"max_context_messages" integer DEFAULT 10 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"business_name" text DEFAULT 'Mi Tienda' NOT NULL,
	"business_type" text DEFAULT 'Tienda de tecnología' NOT NULL,
	"payment_methods" text DEFAULT 'Efectivo,Transferencia,Tarjeta de crédito' NOT NULL,
	"working_hours" text DEFAULT 'Lunes a Viernes 8am-6pm, Sábados 9am-2pm' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_providers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"provider" varchar(30) DEFAULT 'openai' NOT NULL,
	"api_key" text DEFAULT '' NOT NULL,
	"base_url" text,
	"model" text DEFAULT 'gpt-5-mini' NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agents" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(30) NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"system_prompt" text DEFAULT '' NOT NULL,
	"handled_intents" text DEFAULT '' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "agents_key_unique" UNIQUE("key")
);
