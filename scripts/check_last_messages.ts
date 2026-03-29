import { db } from "@workspace/db";
import { conversationsTable } from "@workspace/db/schema";
import { desc } from "drizzle-orm";

async function check() {
  const msgs = await db.select().from(conversationsTable).orderBy(desc(conversationsTable.id)).limit(5);
  console.log(JSON.stringify(msgs, null, 2));
  process.exit(0);
}
check();
