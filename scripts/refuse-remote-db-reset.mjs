console.error("db:reset is disabled because this workspace now points to Supabase/PostgreSQL.");
console.error("Use explicit, reviewed migration/seed commands instead. Do not reset a remote database from npm scripts.");
process.exit(1);
