-- Apply this migration to an existing SkillSwap X database.
USE skillswapx;

ALTER TABLE users
    ADD UNIQUE KEY uq_oauth_identity (oauth_provider, oauth_id);
