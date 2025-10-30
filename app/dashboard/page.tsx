'use client';

import { Calendar, Clock, DollarSign, Edit2, LogOut, Plus, Trash2, Upload, Users, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

interface Game {
  _id: string;
  title: string;
  startDate: string;
  startTime: string;
  durationInMinutes: number;
  price: number;
  friends: string[];  // Just base64 image strings
  enemies: string[];  // Just base64 image strings
  friendDescription?: string;
  enemyDescription?: string;
  showFriendImages: boolean;
  showEnemyImages: boolean;
  connectedUsers: number;
  readyUsers: number;
}

export default function Dashboard() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [showGameForm, setShowGameForm] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [gameForm, setGameForm] = useState({
    title: '',
    startDate: '',
    startTime: '',
    durationInMinutes: 60,
    price: 0,
    friendDescription: '',
    enemyDescription: '',
    showFriendImages: true,
    showEnemyImages: true
  });
  
  const [friends, setFriends] = useState<string[]>([]);  // Just image strings
  const [enemies, setEnemies] = useState<string[]>([]);  // Just image strings

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      router.push('/');
    } else {
      setToken(storedToken);
      loadGames(storedToken);
    }
  }, [router]);

  const loadGames = async (authToken: string) => {
    try {
      setLoading(true);
      const res = await fetch('/api/games', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });
      
      if (res.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/');
        return;
      }
      
      const data = await res.json();
      if (data.success) {
        setGames(data.games);
      }
    } catch (error) {
      console.error('Error loading games:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // Add friend image
  const handleAddFriend = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      setFriends([...friends, base64]);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    }
  };

  // Add enemy image
  const handleAddEnemy = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      setEnemies([...enemies, base64]);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    }
  };

  // Remove friend
  const removeFriend = (index: number) => {
    setFriends(friends.filter((_, i) => i !== index));
  };

  // Remove enemy
  const removeEnemy = (index: number) => {
    setEnemies(enemies.filter((_, i) => i !== index));
  };

  const handleGameSubmit = async () => {
    if (!token) return;
    
    const gameData = {
      ...gameForm,
      friends: friends,
      enemies: enemies
    };

    try {
      if (editingGame) {
        const res = await fetch(`/api/games/${editingGame._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(gameData),
        });
        
        const data = await res.json();
        if (data.success) {
          setGames(games.map(g => g._id === editingGame._id ? data.game : g));
        }
      } else {
        const res = await fetch('/api/games', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(gameData),
        });
        
        const data = await res.json();
        if (data.success) {
          setGames([data.game, ...games]);
        }
      }
      
      resetForm();
    } catch (error) {
      console.error('Error saving game:', error);
    }
  };

  const handleEdit = (game: Game) => {
    setEditingGame(game);
    setGameForm({
      title: game.title,
      startDate: game.startDate,
      startTime: game.startTime,
      durationInMinutes: game.durationInMinutes,
      price: game.price,
      friendDescription: game.friendDescription || '',
      enemyDescription: game.enemyDescription || '',
      showFriendImages: game.showFriendImages !== false,
      showEnemyImages: game.showEnemyImages !== false
    });
    setFriends(game.friends || []);
    setEnemies(game.enemies || []);
    setShowGameForm(true);
  };

  const handleDelete = async (gameId: string) => {
    if (!token || !window.confirm('Are you sure you want to delete this game?')) {
      return;
    }

    try {
      const res = await fetch(`/api/games/${gameId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const data = await res.json();
      if (data.success) {
        setGames(games.filter(g => g._id !== gameId));
      }
    } catch (error) {
      console.error('Error deleting game:', error);
    }
  };

  const resetForm = () => {
    setGameForm({
      title: '',
      startDate: '',
      startTime: '',
      durationInMinutes: 60,
      price: 0,
      friendDescription: '',
      enemyDescription: '',
      showFriendImages: true,
      showEnemyImages: true
    });
    setFriends([]);
    setEnemies([]);
    setEditingGame(null);
    setShowGameForm(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Gatekeepers Admin</h1>
              <p className="text-sm text-purple-300">Game Management Dashboard</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Games</p>
                <p className="text-3xl font-bold text-white mt-1">{games.length}</p>
              </div>
              <Calendar className="text-purple-500" size={32} />
            </div>
          </div>
          
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Active Players</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {games.reduce((sum, g) => sum + (g.connectedUsers || 0), 0)}
                </p>
              </div>
              <Users className="text-green-500" size={32} />
            </div>
          </div>
          
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Revenue</p>
                <p className="text-3xl font-bold text-white mt-1">
                  ₦{games.reduce((sum, g) => sum + (g.price || 0), 0).toLocaleString()}
                </p>
              </div>
              <DollarSign className="text-yellow-500" size={32} />
            </div>
          </div>
        </div>

        <div className="mb-6">
          <button
            onClick={() => setShowGameForm(true)}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
          >
            <Plus size={20} />
            Create New Game
          </button>
        </div>

        {showGameForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-slate-800 rounded-lg p-6 w-full max-w-4xl my-8 border border-slate-700">
              <h2 className="text-2xl font-bold text-white mb-6">
                {editingGame ? 'Edit Game' : 'Create New Game'}
              </h2>
              
              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                <div>
                  <label className="block text-sm font-medium text-purple-200 mb-2">Game Title</label>
                  <input
                    type="text"
                    value={gameForm.title}
                    onChange={(e) => setGameForm({...gameForm, title: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-purple-200 mb-2">Start Date</label>
                    <input
                      type="date"
                      value={gameForm.startDate}
                      onChange={(e) => setGameForm({...gameForm, startDate: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-purple-200 mb-2">Start Time</label>
                    <input
                      type="time"
                      value={gameForm.startTime}
                      onChange={(e) => setGameForm({...gameForm, startTime: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-purple-200 mb-2">Duration (minutes)</label>
                    <input
                      type="number"
                      value={gameForm.durationInMinutes}
                      onChange={(e) => setGameForm({...gameForm, durationInMinutes: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-purple-200 mb-2">Price (₦)</label>
                    <input
                      type="number"
                      value={gameForm.price}
                      onChange={(e) => setGameForm({...gameForm, price: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                {/* Friends Section */}
                <div className="border-t border-slate-700 pt-4">
                  <h3 className="text-lg font-semibold text-purple-300 mb-3">Friends</h3>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-purple-200 mb-2">Friend Description</label>
                    <textarea
                      value={gameForm.friendDescription}
                      onChange={(e) => setGameForm({...gameForm, friendDescription: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      rows={2}
                      placeholder="Describe the friends in the game..."
                    />
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <input
                      type="checkbox"
                      id="showFriendImages"
                      checked={gameForm.showFriendImages}
                      onChange={(e) => setGameForm({...gameForm, showFriendImages: e.target.checked})}
                      className="w-4 h-4 text-purple-600 bg-slate-700 border-slate-600 rounded focus:ring-purple-500"
                    />
                    <label htmlFor="showFriendImages" className="text-sm text-purple-200">Show Friend Images</label>
                  </div>

                  <div className="mb-3">
                    <label className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg cursor-pointer transition-colors w-full">
                      <Upload size={18} />
                      Add Friend Image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAddFriend}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                    {friends.map((friendImage, index) => (
                      <div key={index} className="relative bg-slate-700 rounded-lg p-2 border border-slate-600">
                        <button
                          onClick={() => removeFriend(index)}
                          className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 z-10"
                        >
                          <X size={16} />
                        </button>
                        <img
                          src={friendImage.image||friendImage}
                          alt={`Friend ${index + 1}`}
                          className="w-full h-24 object-cover rounded"
                        />
                      </div>
                    ))}
                  </div>
                  {friends.length > 0 && (
                    <p className="text-sm text-slate-400 mt-2">{friends.length} friend image(s) added</p>
                  )}
                </div>

                {/* Enemies Section */}
                <div className="border-t border-slate-700 pt-4">
                  <h3 className="text-lg font-semibold text-red-300 mb-3">Enemies</h3>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-purple-200 mb-2">Enemy Description</label>
                    <textarea
                      value={gameForm.enemyDescription}
                      onChange={(e) => setGameForm({...gameForm, enemyDescription: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      rows={2}
                      placeholder="Describe the enemies in the game..."
                    />
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <input
                      type="checkbox"
                      id="showEnemyImages"
                      checked={gameForm.showEnemyImages}
                      onChange={(e) => setGameForm({...gameForm, showEnemyImages: e.target.checked})}
                      className="w-4 h-4 text-purple-600 bg-slate-700 border-slate-600 rounded focus:ring-purple-500"
                    />
                    <label htmlFor="showEnemyImages" className="text-sm text-purple-200">Show Enemy Images</label>
                  </div>

                  <div className="mb-3">
                    <label className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg cursor-pointer transition-colors w-full">
                      <Upload size={18} />
                      Add Enemy Image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAddEnemy}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                    {enemies.map((enemyImage, index) => (
                      <div key={index} className="relative bg-slate-700 rounded-lg p-2 border border-slate-600">
                        <button
                          onClick={() => removeEnemy(index)}
                          className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 z-10"
                        >
                          <X size={16} />
                        </button>
                        <img
                          src={enemyImage.image||enemyImage}
                          alt={`Enemy ${index + 1}`}
                          className="w-full h-24 object-cover rounded"
                        />
                      </div>
                    ))}
                  </div>
                  {enemies.length > 0 && (
                    <p className="text-sm text-slate-400 mt-2">{enemies.length} enemy image(s) added</p>
                  )}
                </div>

                <div className="flex gap-3 pt-4 sticky bottom-0 bg-slate-800 pb-2">
                  <button
                    onClick={handleGameSubmit}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition-colors"
                  >
                    {editingGame ? 'Update Game' : 'Create Game'}
                  </button>
                  <button
                    onClick={resetForm}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {games.length === 0 ? (
            <div className="bg-slate-800 rounded-lg p-12 text-center border border-slate-700">
              <Calendar className="mx-auto text-slate-600 mb-4" size={48} />
              <p className="text-slate-400 text-lg">No games created yet</p>
              <p className="text-slate-500 text-sm mt-2">Click "Create New Game" to get started</p>
            </div>
          ) : (
            games.map(game => (
              <div key={game._id} className="bg-slate-800 rounded-lg p-6 border border-slate-700 hover:border-purple-500 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">{game.title}</h3>
                    <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar size={16} />
                        {game.startDate}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={16} />
                        {game.startTime} ({game.durationInMinutes}min)
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign size={16} />
                        ₦{game.price.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(game)}
                      className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(game._id)}
                      className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-purple-300 font-semibold mb-2">
                      Friends ({game.friends?.length || 0})
                    </p>
                    {game.friendDescription && (
                      <p className="text-xs text-slate-400 mb-2">{game.friendDescription}</p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {game.friends && game.showFriendImages && game.friends.map((friendImage, i) => (
                        <img 
                          key={i} 
                          src={friendImage.image||friendImage} 
                          alt={`Friend ${i + 1}`} 
                          className="w-12 h-12 rounded-lg object-cover border-2 border-green-500" 
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-red-300 font-semibold mb-2">
                      Enemies ({game.enemies?.length || 0})
                    </p>
                    {game.enemyDescription && (
                      <p className="text-xs text-slate-400 mb-2">{game.enemyDescription}</p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {game.enemies && game.showEnemyImages && game.enemies.map((enemyImage, i) => (
                        <img 
                          key={i} 
                          src={enemyImage.image||enemyImage} 
                          alt={`Enemy ${i + 1}`} 
                          className="w-12 h-12 rounded-lg object-cover border-2 border-red-500" 
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-6 pt-4 border-t border-slate-700">
                  <div className="flex items-center gap-2">
                    <Users className="text-green-500" size={18} />
                    <span className="text-white">{game.connectedUsers || 0} connected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="text-blue-500" size={18} />
                    <span className="text-white">{game.readyUsers || 0} ready</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}