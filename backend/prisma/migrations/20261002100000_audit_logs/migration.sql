-- Nhật ký thao tác (actor_id có thể NULL khi tài khoản bị xóa).

-- CreateTable
CREATE TABLE "audit_logs" (
    "log_id" SERIAL NOT NULL,
    "actor_id" INTEGER,
    "actor_name" VARCHAR(50) NOT NULL,
    "actor_role" VARCHAR(50) NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "entity_type" VARCHAR(30) NOT NULL,
    "entity_id" INTEGER,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("log_id")
);

-- CreateIndex
CREATE INDEX "audit_logs_actor_id_idx" ON "audit_logs"("actor_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "accounts"("account_id") ON DELETE SET NULL ON UPDATE CASCADE;
