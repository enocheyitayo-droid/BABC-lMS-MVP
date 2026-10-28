-- JavaScript login-rate-limit timestamps are epoch milliseconds and exceed int4.
ALTER TABLE babc_school.login_attempts ALTER COLUMN created_at TYPE BIGINT;
