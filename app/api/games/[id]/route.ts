import dbConnect from '@/lib/db';
import { Game } from '@/lib/models/Game';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';

interface DecodedToken extends JwtPayload {
  userId: string;
  role: string;
}

interface GameCharacter {
  name: string;
  image: string;
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

// Helper function to normalize character data
function normalizeCharacters(data: unknown, index: number): GameCharacter[] {
  if (!data) return [];
  
  if (!Array.isArray(data)) return [];
  
  return data.map((item, i) => {
    // If it's already a proper object with name and optionally image
    if (typeof item === 'object' && item !== null && 'name' in item) {
      const obj = item as { name: string; image?: string };
      // Check if it's actually valid (not a base64 string in the name field)
      if (obj.name && !obj.name.startsWith('data:image')) {
        return {
          name: obj.name,
          image: obj.image || ''
        };
      }
    }
    
    // If it's a plain string (just a name, not an image)
    if (typeof item === 'string' && !item.startsWith('data:image')) {
      return { name: item, image: '' };
    }
    
    // If it's a base64 image string (current frontend format)
    if (typeof item === 'string' && item.startsWith('data:image')) {
      // Auto-generate a name based on position
      const type = index === 0 ? 'Friend' : 'Enemy';
      return {
        name: `${type} ${i + 1}`,
        image: item
      };
    }
    
    // If we get here, the data format is wrong
    console.warn('Invalid character data format:', typeof item, item?.toString().substring(0, 50));
    return null;
  }).filter((item): item is GameCharacter => item !== null);
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
    
    // Normalize friends and enemies data
    const friends = normalizeCharacters(body.friends, 0);
    const enemies = normalizeCharacters(body.enemies, 1);
    
    // Validate the normalized data
    const invalidFriend = friends.find(f => !f.name || typeof f.name !== 'string');
    if (invalidFriend) {
      return NextResponse.json(
        { error: 'Invalid friend data: each friend must have a name property' },
        { status: 400 }
      );
    }
    
    const invalidEnemy = enemies.find(e => !e.name || typeof e.name !== 'string');
    if (invalidEnemy) {
      return NextResponse.json(
        { error: 'Invalid enemy data: each enemy must have a name property' },
        { status: 400 }
      );
    }
    
    const updateData = {
      ...body,
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