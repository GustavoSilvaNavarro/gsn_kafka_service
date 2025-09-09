-- CreateTable
CREATE TABLE "public"."messages" (
    "id" BIGSERIAL NOT NULL,
    "pfid" TEXT NOT NULL,
    "site_id" VARCHAR(20) NOT NULL,
    "acn_id" VARCHAR(20) NOT NULL,
    "acc_id" VARCHAR(20) NOT NULL,
    "acg_id" VARCHAR(20) NOT NULL,
    "acs_id" VARCHAR(20) NOT NULL,
    "payload" JSONB NOT NULL,
    "cbid" TEXT,
    "subject" TEXT NOT NULL,
    "action" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "unique_id" TEXT,
    "source" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "messages_pfid_idx" ON "public"."messages"("pfid");

-- CreateIndex
CREATE INDEX "messages_site_id_idx" ON "public"."messages"("site_id");

-- CreateIndex
CREATE INDEX "messages_action_idx" ON "public"."messages"("action");

-- CreateIndex
CREATE INDEX "messages_unique_id_idx" ON "public"."messages"("unique_id");
