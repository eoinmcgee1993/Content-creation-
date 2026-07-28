-- ============================================================
-- n8n Automation Engine - Centralized Master Database Schema
-- Compatible with PostgreSQL 15+
-- Run this script once on your n8n Postgres instance to
-- initialize all tables needed by the 3 automation pipelines.
-- ============================================================

-- Enable UUID extension for secure, non-sequential record IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE 1: Global System Execution Logs
-- Captures all pipeline executions, errors, and health metrics
-- across all three automation engines.
-- ============================================================
CREATE TABLE IF NOT EXISTS system_execution_logs (
    log_id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pipeline_name   VARCHAR(50) NOT NULL
                    CHECK (pipeline_name IN ('NEWSLETTER', 'AFFILIATE_SOCIAL', 'B2B_OUTBOUND')),
    execution_id    VARCHAR(100),
    status          VARCHAR(20) NOT NULL
                    CHECK (status IN ('SUCCESS', 'FAILED', 'REWRITTEN', 'SKIPPED')),
    tokens_consumed INT DEFAULT 0,
    error_message   TEXT,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE system_execution_logs IS
    'Central health and audit log for all three n8n automation pipelines.';

-- ============================================================
-- TABLE 2: Newsletter Campaign Tracking (Pipeline 1)
-- Records every newsletter sent, stories selected, QA outcome.
-- ============================================================
CREATE TABLE IF NOT EXISTS newsletter_campaigns (
    campaign_id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    execution_id            VARCHAR(100),
    subject_line            TEXT NOT NULL,
    -- JSONB array of { url, title, textContent } objects selected by Agent A
    selected_stories        JSONB,
    -- Populated when Agent B rejects and logs reasoning
    editor_feedback         TEXT,
    subscriber_count_at_send INT DEFAULT 0,
    sent_at                 TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE newsletter_campaigns IS
    'Tracks every newsletter execution: stories chosen, QA feedback, and send timestamp.';

-- ============================================================
-- TABLE 3: Affiliate Asset Publication Log (Pipeline 2)
-- Tracks every product post: generated copy, image, channels.
-- ============================================================
CREATE TABLE IF NOT EXISTS affiliate_publications (
    publication_id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_product_url  TEXT NOT NULL,
    product_title       VARCHAR(500),
    generated_copy      TEXT,
    generated_image_url TEXT,
    -- JSONB array of channel names e.g. ["Telegram", "Instagram", "Facebook"]
    channels_posted     JSONB DEFAULT '[]'::jsonb,
    -- LIVE | FLAGGED | DRAFT | FAILED
    status              VARCHAR(20) DEFAULT 'LIVE'
                        CHECK (status IN ('LIVE', 'FLAGGED', 'DRAFT', 'FAILED')),
    published_at        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE affiliate_publications IS
    'Records every affiliate product publication across all social channels.';

-- ============================================================
-- TABLE 4: B2B Outreach Lead Tracker (Pipeline 3)
-- Tracks prospecting, personalization, compliance, and delivery.
-- ============================================================
CREATE TABLE IF NOT EXISTS b2b_outreach_leads (
    lead_id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name        VARCHAR(255) NOT NULL,
    -- UNIQUE ensures one record per email — no double-sends
    prospect_email      VARCHAR(255) NOT NULL UNIQUE,
    corporate_website   TEXT,
    personalized_pitch  TEXT,
    -- PASSED | FAILED_FILTER
    compliance_status   VARCHAR(20)
                        CHECK (compliance_status IN ('PASSED', 'FAILED_FILTER')),
    delivery_attempts   INT DEFAULT 0,
    last_contacted_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE b2b_outreach_leads IS
    'Master outreach ledger: one row per prospect email, tracks compliance and delivery status.';

-- ============================================================
-- INDEXES
-- Optimized for the deduplication and status query patterns
-- used by each pipeline at runtime.
-- ============================================================

-- Pipeline 1: Query by status and pipeline for dashboard reporting
CREATE INDEX IF NOT EXISTS idx_logs_pipeline_status
    ON system_execution_logs(pipeline_name, status);

-- Pipeline 1: Query most recent campaign runs
CREATE INDEX IF NOT EXISTS idx_logs_created_at
    ON system_execution_logs(created_at DESC);

-- Pipeline 2: Deduplication check — most critical hot-path query
CREATE INDEX IF NOT EXISTS idx_affiliate_url
    ON affiliate_publications(source_product_url);

-- Pipeline 2: Filter live publications by channel
CREATE INDEX IF NOT EXISTS idx_affiliate_status
    ON affiliate_publications(status, published_at DESC);

-- Pipeline 3: Deduplication check — prevents re-contacting leads
CREATE INDEX IF NOT EXISTS idx_b2b_email
    ON b2b_outreach_leads(prospect_email);

-- Pipeline 3: Find all successfully contacted leads
CREATE INDEX IF NOT EXISTS idx_b2b_compliance
    ON b2b_outreach_leads(compliance_status, last_contacted_at DESC);

-- ============================================================
-- VIEWS (Optional — for quick status dashboards)
-- ============================================================

-- Daily execution summary across all pipelines
CREATE OR REPLACE VIEW v_daily_pipeline_summary AS
SELECT
    pipeline_name,
    DATE(created_at) AS run_date,
    COUNT(*) AS total_executions,
    SUM(CASE WHEN status = 'SUCCESS' THEN 1 ELSE 0 END) AS successes,
    SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) AS failures,
    SUM(CASE WHEN status = 'REWRITTEN' THEN 1 ELSE 0 END) AS rewrites,
    SUM(tokens_consumed) AS total_tokens
FROM system_execution_logs
GROUP BY pipeline_name, DATE(created_at)
ORDER BY run_date DESC, pipeline_name;

COMMENT ON VIEW v_daily_pipeline_summary IS
    'Quick daily health summary — run SELECT * FROM v_daily_pipeline_summary LIMIT 30 to review.';

-- B2B outreach performance summary
CREATE OR REPLACE VIEW v_b2b_outreach_summary AS
SELECT
    compliance_status,
    COUNT(*) AS lead_count,
    AVG(delivery_attempts) AS avg_attempts,
    MAX(last_contacted_at) AS most_recent_contact
FROM b2b_outreach_leads
GROUP BY compliance_status;

COMMENT ON VIEW v_b2b_outreach_summary IS
    'B2B pipeline health — shows pass/fail ratio and delivery attempt stats.';
