import dbConnect from '@/lib/db';
import { Game } from '@/lib/models/Game';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';

interface DecodedToken extends JwtPayload {
  userId: string;
  role: string;
}

function verifyToken(request: NextRequest): DecodedToken | null {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;
    return decoded;
  } catch (error) {
    throw error;
  }
}

// Helper function to normalize character data to string array
function normalizeCharacters(data: unknown): string[] {
  if (!data) return [];
  
  if (!Array.isArray(data)) return [];
  
  return data
    .map((item) => {
      // If it's already a string
      if (typeof item === 'string') {
        return item;
      }
      
      // If it's an object with a name property
      if (typeof item === 'object' && item !== null && 'name' in item) {
        const obj = item as { name: string };
        return obj.name;
      }
      
      // Skip invalid items
      return null;
    })
    .filter((item): item is string => item !== null && item.length > 0);
}

// PUT update existing game
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
    const { id } = await params;
    
    // Normalize friends and enemies to string arrays
    const friends = normalizeCharacters(body.friends);
    const enemies = normalizeCharacters(body.enemies);
    
    const updateData = {
      title: body.title,
      startTime: body.startTime,
      startDate: body.startDate,
      durationInMinutes: body.durationInMinutes,
      price: body.price,
      friendDescription: body.friendDescription || '',
      enemyDescription: body.enemyDescription || '',
      showFriendImages: body.showFriendImages !== false,
      showEnemyImages: body.showEnemyImages !== false,
      friends,
      enemies,
    };
    
    const game = await Game.findByIdAndUpdate(
      id,
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
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE game
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
    
    const { id } = await params;
    
    const game = await Game.findByIdAndDelete(id);
    
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