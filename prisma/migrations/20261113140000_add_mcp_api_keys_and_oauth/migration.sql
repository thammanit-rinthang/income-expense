CREATE TABLE "mcp_api_keys" (
    "id" SERIAL NOT NULL,
    "person_name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "access_level" TEXT NOT NULL DEFAULT 'read_write',
    "key_prefix" TEXT NOT NULL,
    "key_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "mcp_api_keys_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "mcp_api_keys_person_name_check" CHECK ("person_name" IN ('Bon', 'Ray')),
    CONSTRAINT "mcp_api_keys_access_level_check" CHECK ("access_level" IN ('read_only', 'read_write'))
);

CREATE UNIQUE INDEX "mcp_api_keys_key_prefix_key" ON "mcp_api_keys"("key_prefix");
CREATE UNIQUE INDEX "mcp_api_keys_key_hash_key" ON "mcp_api_keys"("key_hash");
CREATE INDEX "mcp_api_keys_person_name_revoked_at_idx" ON "mcp_api_keys"("person_name", "revoked_at");

CREATE TABLE "mcp_oauth_clients" (
    "client_id" TEXT NOT NULL,
    "client_name" TEXT,
    "redirect_uris" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mcp_oauth_clients_pkey" PRIMARY KEY ("client_id")
);

CREATE TABLE "mcp_authorization_codes" (
    "code_hash" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "api_key_id" INTEGER NOT NULL,
    "redirect_uri" TEXT NOT NULL,
    "code_challenge" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mcp_authorization_codes_pkey" PRIMARY KEY ("code_hash"),
    CONSTRAINT "mcp_authorization_codes_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "mcp_oauth_clients"("client_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "mcp_authorization_codes_api_key_id_fkey" FOREIGN KEY ("api_key_id") REFERENCES "mcp_api_keys"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "mcp_authorization_codes_expires_at_idx" ON "mcp_authorization_codes"("expires_at");

CREATE TABLE "mcp_oauth_tokens" (
    "token_hash" TEXT NOT NULL,
    "token_type" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "api_key_id" INTEGER NOT NULL,
    "resource" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mcp_oauth_tokens_pkey" PRIMARY KEY ("token_hash"),
    CONSTRAINT "mcp_oauth_tokens_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "mcp_oauth_clients"("client_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "mcp_oauth_tokens_api_key_id_fkey" FOREIGN KEY ("api_key_id") REFERENCES "mcp_api_keys"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "mcp_oauth_tokens_api_key_id_token_type_revoked_at_idx" ON "mcp_oauth_tokens"("api_key_id", "token_type", "revoked_at");
CREATE INDEX "mcp_oauth_tokens_expires_at_idx" ON "mcp_oauth_tokens"("expires_at");
