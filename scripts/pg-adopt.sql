ALTER ROLE postgres WITH LOGIN PASSWORD 'posterraxxdb2026';
REASSIGN OWNED BY postgres TO "user";
GRANT ALL ON SCHEMA public TO "user";
