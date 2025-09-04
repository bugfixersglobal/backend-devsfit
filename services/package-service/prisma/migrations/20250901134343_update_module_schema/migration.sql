-- CreateEnum
CREATE TYPE "LimitationType" AS ENUM ('UNLIMITED', 'LIMITED');

-- CreateEnum
CREATE TYPE "PackageStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'DRAFT', 'DEPRECATED');

-- CreateTable
CREATE TABLE "saas_packages" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "short_description" VARCHAR(255),
    "icon" VARCHAR(255),
    "color" VARCHAR(7),
    "badge" VARCHAR(50),
    "features" VARCHAR(100)[],
    "monthly_price" DECIMAL(10,2) NOT NULL,
    "yearly_price" DECIMAL(10,2),
    "quarterly_price" DECIMAL(10,2),
    "lifetime_price" DECIMAL(10,2),
    "setup_fee" DECIMAL(10,2),
    "trial_days" INTEGER NOT NULL DEFAULT 0,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "status" "PackageStatus" NOT NULL DEFAULT 'ACTIVE',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_popular" BOOLEAN NOT NULL DEFAULT false,
    "is_recommended" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "branch_limit_type" "LimitationType" NOT NULL DEFAULT 'LIMITED',
    "max_branches" INTEGER,
    "user_limit_type" "LimitationType" NOT NULL DEFAULT 'LIMITED',
    "max_users" INTEGER,
    "max_members" INTEGER,
    "max_staff" INTEGER,
    "max_trainers" INTEGER,
    "storage_limit" DECIMAL(10,2),
    "api_calls_limit" INTEGER,

    CONSTRAINT "saas_packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modules" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "icon" VARCHAR(255) NOT NULL,
    "display_name" VARCHAR(100),
    "description" TEXT,
    "category" VARCHAR(50) NOT NULL DEFAULT 'management',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_by" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_modules" (
    "id" UUID NOT NULL,
    "package_id" UUID NOT NULL,
    "module_id" UUID NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "package_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saas_features" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "display_name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "category" VARCHAR(50) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saas_features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saas_package_features" (
    "id" UUID NOT NULL,
    "package_id" UUID NOT NULL,
    "feature_id" UUID NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "limit_value" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saas_package_features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_analytics" (
    "id" UUID NOT NULL,
    "package_id" UUID NOT NULL,
    "total_subscriptions" INTEGER NOT NULL DEFAULT 0,
    "active_subscriptions" INTEGER NOT NULL DEFAULT 0,
    "total_revenue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "monthly_revenue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "churn_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "average_rating" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "total_ratings" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "package_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "saas_packages_name_key" ON "saas_packages"("name");

-- CreateIndex
CREATE UNIQUE INDEX "saas_packages_slug_key" ON "saas_packages"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "modules_name_key" ON "modules"("name");

-- CreateIndex
CREATE UNIQUE INDEX "package_modules_package_id_module_id_key" ON "package_modules"("package_id", "module_id");

-- CreateIndex
CREATE UNIQUE INDEX "saas_features_name_key" ON "saas_features"("name");

-- CreateIndex
CREATE UNIQUE INDEX "saas_package_features_package_id_feature_id_key" ON "saas_package_features"("package_id", "feature_id");

-- CreateIndex
CREATE UNIQUE INDEX "package_analytics_package_id_key" ON "package_analytics"("package_id");

-- AddForeignKey
ALTER TABLE "package_modules" ADD CONSTRAINT "package_modules_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "saas_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_modules" ADD CONSTRAINT "package_modules_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saas_package_features" ADD CONSTRAINT "saas_package_features_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "saas_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saas_package_features" ADD CONSTRAINT "saas_package_features_feature_id_fkey" FOREIGN KEY ("feature_id") REFERENCES "saas_features"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_analytics" ADD CONSTRAINT "package_analytics_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "saas_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
