import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import postgres from "https://deno.land/x/postgresjs@v3.4.4/mod.js"

const databaseUrl = Deno.env.get('SUPABASE_DB_URL')!
// Create a connection pool
const sql = postgres(databaseUrl)

interface RequestBody {
  loan_id: string;
}

serve(async (req) => {
  try {
    // 1. Parse request
    const { loan_id } = await req.json() as RequestBody;

    if (!loan_id) {
      return new Response(JSON.stringify({ error: 'loan_id is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. Perform Transaction
    const result = await sql.begin(async (sql) => {
      // A. Update loan status to 'active' ONLY if it is currently 'pending'
      // This ensures we don't double-process a loan.
      const [loan] = await sql`
        UPDATE loans
        SET status = 'active'
        WHERE id = ${loan_id} AND status = 'pending'
        RETURNING lender_id, borrower_id, amount
      `;

      if (!loan) {
        throw new Error('Loan not found or not in pending status');
      }

      // B. Subtract from lender balance
      const [lender] = await sql`
        UPDATE profiles
        SET balance = balance - ${loan.amount}
        WHERE id = ${loan.lender_id}
        RETURNING balance
      `;

      // C. Add to borrower balance
      const [borrower] = await sql`
        UPDATE profiles
        SET balance = balance + ${loan.amount}
        WHERE id = ${loan.borrower_id}
        RETURNING balance
      `;

      return { loan, lender, borrower };
    });

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
})
