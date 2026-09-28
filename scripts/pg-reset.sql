DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'user') THEN
    CREATE ROLE "user" WITH LOGIN PASSWORD 'posterraxxdb2026';
  ELSE
    ALTER ROLE "user" WITH LOGIN PASSWORD 'posterraxxdb2026';
  END IF;
END $$;
SELECT 'CREATE DATABASE posterraxx OWNER "user"'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'posterraxx')\gexec
