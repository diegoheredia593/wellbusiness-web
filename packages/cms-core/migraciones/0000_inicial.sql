CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `account_user` ON `account` (`user_id`);--> statement-breakpoint
CREATE TABLE `ajustes_internos` (
	`clave` text PRIMARY KEY NOT NULL,
	`valor` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `auditoria` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`usuario_id` text,
	`usuario_nombre` text NOT NULL,
	`accion` text NOT NULL,
	`objeto_tipo` text NOT NULL,
	`objeto_id` text,
	`objeto_nombre` text,
	`contexto` text,
	`resumen` text,
	`creado` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `auditoria_creado` ON `auditoria` (`creado`);--> statement-breakpoint
CREATE TABLE `bloques` (
	`key` text PRIMARY KEY NOT NULL,
	`pagina` text NOT NULL,
	`seccion` text NOT NULL,
	`etiqueta` text NOT NULL,
	`tipo` text NOT NULL,
	`nivel` text NOT NULL,
	`max_length` integer,
	`obligatorio` integer NOT NULL,
	`valor` text,
	`valor_borrador` text,
	`actualizado` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`actualizado_por` text
);
--> statement-breakpoint
CREATE INDEX `bloques_pagina` ON `bloques` (`pagina`);--> statement-breakpoint
CREATE TABLE `enlaces` (
	`id` text PRIMARY KEY NOT NULL,
	`tipo` text NOT NULL,
	`token_hash` text NOT NULL,
	`email` text NOT NULL,
	`nombre` text,
	`rol` text,
	`usuario_id` text,
	`vence` text NOT NULL,
	`usado_en` text,
	`creado_por` text,
	`creado` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `enlaces_token_hash_unique` ON `enlaces` (`token_hash`);--> statement-breakpoint
CREATE TABLE `envios_formulario` (
	`id` text PRIMARY KEY NOT NULL,
	`tipo` text NOT NULL,
	`datos` text NOT NULL,
	`creado` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`leido_en` text,
	`es_ejemplo` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE INDEX `envios_tipo` ON `envios_formulario` (`tipo`,`creado`);--> statement-breakpoint
CREATE TABLE `items` (
	`id` text PRIMARY KEY NOT NULL,
	`coleccion` text NOT NULL,
	`slug` text,
	`estado` text NOT NULL,
	`orden` integer NOT NULL,
	`datos` text NOT NULL,
	`datos_borrador` text,
	`creado` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`actualizado` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`eliminado_en` text,
	`autor` text
);
--> statement-breakpoint
CREATE INDEX `items_coleccion` ON `items` (`coleccion`,`eliminado_en`,`estado`,`orden`);--> statement-breakpoint
CREATE UNIQUE INDEX `items_slug_unico` ON `items` (`coleccion`,`slug`) WHERE slug is not null and eliminado_en is null;--> statement-breakpoint
CREATE TABLE `medios` (
	`id` text PRIMARY KEY NOT NULL,
	`clave` text NOT NULL,
	`nombre_original` text NOT NULL,
	`tipo` text NOT NULL,
	`ancho` integer NOT NULL,
	`alto` integer NOT NULL,
	`peso` integer NOT NULL,
	`alt` text NOT NULL,
	`subido_por` text,
	`creado` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `medios_clave_unique` ON `medios` (`clave`);--> statement-breakpoint
CREATE TABLE `rate_limit` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`count` integer NOT NULL,
	`last_request` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `rate_limit_key_unique` ON `rate_limit` (`key`);--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	`impersonated_by` text,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE INDEX `session_user` ON `session` (`user_id`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`role` text,
	`banned` integer DEFAULT false,
	`ban_reason` text,
	`ban_expires` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
