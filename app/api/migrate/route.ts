import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET() {
  try {
    console.log('Running database migration...');

    // Run prisma db push to create tables
    const { stdout, stderr } = await execAsync('npx prisma db push --accept-data-loss');

    console.log('Migration output:', stdout);
    if (stderr) console.error('Migration stderr:', stderr);

    return NextResponse.json({
      success: true,
      message: 'Database schema pushed successfully!',
      output: stdout
    });

  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Migration failed',
        details: error.stderr || error.stdout
      },
      { status: 500 }
    );
  }
}
