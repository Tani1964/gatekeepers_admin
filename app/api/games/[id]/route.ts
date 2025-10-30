import dbConnect from '@/lib/db';
import { Game } from '@/lib/models/Game';
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';

function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    return decoded;
  } catch (error) {
    return null;
  }
}

// GET all games
export async function GET(request: NextRequest) {
  try {
    const user = verifyToken(request);
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();
    
    const games = await Game.find({}).sort({ createdAt: -1 });
    
    return NextResponse.json({ success: true, games });
  } catch (error) {
    console.error('Get games error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST create new game
export async function POST(request: NextRequest) {
  try {
    const user = verifyToken(request);
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();
    
    const body = await request.json();
    
    // Ensure friends and enemies are properly formatted
    const gameData = {
      ...body,
      friends: body.friends || [],
      enemies: body.enemies || [],
      createdBy: user.userId,
    };

    // Validate that friends and enemies have the correct structure
    if (gameData.friends.length > 0) {
      const hasInvalidFriend = gameData.friends.some(
        (f: any) => !f.name || typeof f.name !== 'string'
      );
      if (hasInvalidFriend) {
        return NextResponse.json(
          { error: 'Invalid friend data structure' },
          { status: 400 }
        );
      }
    }

    if (gameData.enemies.length > 0) {
      const hasInvalidEnemy = gameData.enemies.some(
        (e: any) => !e.name || typeof e.name !== 'string'
      );
      if (hasInvalidEnemy) {
        return NextResponse.json(
          { error: 'Invalid enemy data structure' },
          { status: 400 }
        );
      }
    }

    const game = await Game.create(gameData);
    
    return NextResponse.json({ success: true, game }, { status: 201 });
  } catch (error) {
    console.error('Create game error:', error);
    
    // Provide more detailed error information
    let errorMessage = 'Internal server error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    // Extract validation errors if they exist
    if (error && typeof error === 'object' && 'errors' in error) {
      const validationErrors = (error as any).errors;
      const errorDetails = Object.keys(validationErrors).map(key => {
        return `${key}: ${validationErrors[key].message}`;
      }).join(', ');
      errorMessage = `Validation failed: ${errorDetails}`;
    }
    
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}

// PUT update existing game
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = verifyToken(request);
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();
    
    const body = await request.json();
    
    // Ensure friends and enemies are properly formatted
    const updateData = {
      ...body,
      friends: body.friends || [],
      enemies: body.enemies || [],
    };

    // Validate that friends and enemies have the correct structure
    if (updateData.friends.length > 0) {
      const hasInvalidFriend = updateData.friends.some(
        (f: any) => !f.name || typeof f.name !== 'string'
      );
      if (hasInvalidFriend) {
        return NextResponse.json(
          { error: 'Invalid friend data structure' },
          { status: 400 }
        );
      }
    }

    if (updateData.enemies.length > 0) {
      const hasInvalidEnemy = updateData.enemies.some(
        (e: any) => !e.name || typeof e.name !== 'string'
      );
      if (hasInvalidEnemy) {
        return NextResponse.json(
          { error: 'Invalid enemy data structure' },
          { status: 400 }
        );
      }
    }

    const game = await Game.findByIdAndUpdate(
      params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!game) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, game });
  } catch (error) {
    console.error('Update game error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE game
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = verifyToken(request);
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();
    
    const game = await Game.findByIdAndDelete(params.id);
    
    if (!game) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, message: 'Game deleted' });
  } catch (error) {
    console.error('Delete game error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}