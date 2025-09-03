import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw } from 'lucide-react';

// Tetris piece definitions
const PIECES = {
  I: { shape: [[1, 1, 1, 1]], color: 'tetris-i' },
  O: { shape: [[1, 1], [1, 1]], color: 'tetris-o' },
  T: { shape: [[0, 1, 0], [1, 1, 1]], color: 'tetris-t' },
  S: { shape: [[0, 1, 1], [1, 1, 0]], color: 'tetris-s' },
  Z: { shape: [[1, 1, 0], [0, 1, 1]], color: 'tetris-z' },
  J: { shape: [[1, 0, 0], [1, 1, 1]], color: 'tetris-j' },
  L: { shape: [[0, 0, 1], [1, 1, 1]], color: 'tetris-l' },
};

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const INITIAL_SPEED = 1000;

interface TetrisBoardProps {
  onScoreChange?: (score: number) => void;
  onLinesChange?: (lines: number) => void;
}

export default function TetrisBoard({ onScoreChange, onLinesChange }: TetrisBoardProps) {
  const [board, setBoard] = useState<(string | null)[][]>(() => 
    Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(null))
  );
  const [currentPiece, setCurrentPiece] = useState<any>(null);
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [dropSpeed, setDropSpeed] = useState(INITIAL_SPEED);
  
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Generate random piece
  const generatePiece = useCallback(() => {
    const pieces = Object.keys(PIECES);
    const randomPiece = pieces[Math.floor(Math.random() * pieces.length)] as keyof typeof PIECES;
    return {
      type: randomPiece,
      shape: PIECES[randomPiece].shape,
      color: PIECES[randomPiece].color,
      x: Math.floor(BOARD_WIDTH / 2) - 1,
      y: 0,
    };
  }, []);

  // Check if piece can be placed
  const isValidMove = useCallback((piece: any, newX: number, newY: number, newShape?: number[][]) => {
    const shape = newShape || piece.shape;
    
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          const boardX = newX + x;
          const boardY = newY + y;
          
          if (boardX < 0 || boardX >= BOARD_WIDTH || boardY >= BOARD_HEIGHT) {
            return false;
          }
          
          if (boardY >= 0 && board[boardY][boardX]) {
            return false;
          }
        }
      }
    }
    return true;
  }, [board]);

  // Rotate piece
  const rotatePiece = useCallback((piece: any) => {
    const rotated = piece.shape[0].map((_: any, index: number) =>
      piece.shape.map((row: number[]) => row[index]).reverse()
    );
    return rotated;
  }, []);

  // Place piece on board
  const placePiece = useCallback((piece: any) => {
    const newBoard = board.map(row => [...row]);
    
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x] && piece.y + y >= 0) {
          newBoard[piece.y + y][piece.x + x] = piece.color;
        }
      }
    }
    
    return newBoard;
  }, [board]);

  // Clear completed lines
  const clearLines = useCallback((boardState: (string | null)[][]) => {
    const newBoard = boardState.filter(row => row.some(cell => cell === null));
    const clearedLines = BOARD_HEIGHT - newBoard.length;
    
    // Add empty rows at the top
    while (newBoard.length < BOARD_HEIGHT) {
      newBoard.unshift(Array(BOARD_WIDTH).fill(null));
    }
    
    if (clearedLines > 0) {
      const newLines = lines + clearedLines;
      const newScore = score + clearedLines * 100 * level;
      const newLevel = Math.floor(newLines / 10) + 1;
      
      setLines(newLines);
      setScore(newScore);
      setLevel(newLevel);
      setDropSpeed(Math.max(100, INITIAL_SPEED - (newLevel - 1) * 100));
      
      onLinesChange?.(newLines);
      onScoreChange?.(newScore);
    }
    
    return newBoard;
  }, [lines, score, level, onLinesChange, onScoreChange]);

  // Game loop
  const gameLoop = useCallback(() => {
    if (!currentPiece || gameOver) return;

    if (isValidMove(currentPiece, currentPiece.x, currentPiece.y + 1)) {
      setCurrentPiece(prev => ({ ...prev, y: prev.y + 1 }));
    } else {
      // Place piece and generate new one
      const newBoard = placePiece(currentPiece);
      const clearedBoard = clearLines(newBoard);
      setBoard(clearedBoard);
      
      const newPiece = generatePiece();
      
      // Check game over
      if (!isValidMove(newPiece, newPiece.x, newPiece.y)) {
        setGameOver(true);
        setIsPlaying(false);
        return;
      }
      
      setCurrentPiece(newPiece);
    }
  }, [currentPiece, gameOver, isValidMove, placePiece, clearLines, generatePiece]);

  // Move piece
  const movePiece = useCallback((dx: number, dy: number) => {
    if (!currentPiece || gameOver) return;
    
    const newX = currentPiece.x + dx;
    const newY = currentPiece.y + dy;
    
    if (isValidMove(currentPiece, newX, newY)) {
      setCurrentPiece(prev => ({ ...prev, x: newX, y: newY }));
    }
  }, [currentPiece, gameOver, isValidMove]);

  // Rotate current piece
  const rotate = useCallback(() => {
    if (!currentPiece || gameOver) return;
    
    const rotatedShape = rotatePiece(currentPiece);
    if (isValidMove(currentPiece, currentPiece.x, currentPiece.y, rotatedShape)) {
      setCurrentPiece(prev => ({ ...prev, shape: rotatedShape }));
    }
  }, [currentPiece, gameOver, rotatePiece, isValidMove]);

  // Touch controls
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    
    const minSwipeDistance = 30;
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (Math.abs(deltaX) > minSwipeDistance) {
        movePiece(deltaX > 0 ? 1 : -1, 0);
      }
    } else {
      // Vertical swipe
      if (deltaY > minSwipeDistance) {
        movePiece(0, 1);
      }
    }
    
    touchStartRef.current = null;
  }, [movePiece]);

  const handleTap = useCallback(() => {
    rotate();
  }, [rotate]);

  // Start/pause game
  const toggleGame = useCallback(() => {
    if (gameOver) {
      // Reset game
      setBoard(Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(null)));
      setScore(0);
      setLines(0);
      setLevel(1);
      setDropSpeed(INITIAL_SPEED);
      setGameOver(false);
      setCurrentPiece(generatePiece());
      onScoreChange?.(0);
      onLinesChange?.(0);
    }
    
    setIsPlaying(!isPlaying);
  }, [gameOver, generatePiece, onScoreChange, onLinesChange, isPlaying]);

  // Initialize game
  useEffect(() => {
    if (isPlaying && !currentPiece && !gameOver) {
      setCurrentPiece(generatePiece());
    }
  }, [isPlaying, currentPiece, gameOver, generatePiece]);

  // Game loop effect
  useEffect(() => {
    if (isPlaying && !gameOver) {
      gameLoopRef.current = setInterval(gameLoop, dropSpeed);
    } else if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
    }
    
    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [isPlaying, gameOver, gameLoop, dropSpeed]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isPlaying || gameOver) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          movePiece(-1, 0);
          break;
        case 'ArrowRight':
          e.preventDefault();
          movePiece(1, 0);
          break;
        case 'ArrowDown':
          e.preventDefault();
          movePiece(0, 1);
          break;
        case 'ArrowUp':
        case ' ':
          e.preventDefault();
          rotate();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying, gameOver, movePiece, rotate]);

  // Render the game board with current piece
  const renderBoard = () => {
    const displayBoard = board.map(row => [...row]);
    
    // Add current piece to display board
    if (currentPiece) {
      for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
          if (currentPiece.shape[y][x] && currentPiece.y + y >= 0) {
            displayBoard[currentPiece.y + y][currentPiece.x + x] = currentPiece.color;
          }
        }
      }
    }
    
    return displayBoard.map((row, y) =>
      row.map((cell, x) => (
        <div
          key={`${x}-${y}`}
          className={`w-6 h-6 border border-border/30 tetris-block ${
            cell ? `bg-${cell}` : 'bg-surface/20'
          }`}
          style={cell ? { 
            backgroundColor: `hsl(var(--${cell}))`,
            boxShadow: `inset 0 1px 0 rgba(255, 255, 255, 0.3), 0 1px 2px rgba(0, 0, 0, 0.3)`
          } : {}}
        />
      ))
    );
  };

  return (
    <div className="flex flex-col items-center space-y-2 lg:space-y-4">
      {/* Game Controls */}
      <div className="flex items-center gap-2">
        <Button
          onClick={toggleGame}
          variant="default"
          className="gaming-button-primary text-sm lg:text-base px-4 lg:px-6"
          size="sm"
        >
          {gameOver ? (
            <><RotateCcw className="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2" /> Rejouer</>
          ) : isPlaying ? (
            <><Pause className="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2" /> Pause</>
          ) : (
            <><Play className="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2" /> Jouer</>
          )}
        </Button>
      </div>

      {/* Desktop Game Status */}
      <div className="hidden lg:flex gap-6 text-center">
        <div className="gaming-card px-4 py-2">
          <div className="text-sm text-muted-foreground">Score</div>
          <div className="text-lg font-bold gaming-text-gradient">{score.toLocaleString()}</div>
        </div>
        <div className="gaming-card px-4 py-2">
          <div className="text-sm text-muted-foreground">Lignes</div>
          <div className="text-lg font-bold text-accent">{lines}</div>
        </div>
        <div className="gaming-card px-4 py-2">
          <div className="text-sm text-muted-foreground">Niveau</div>
          <div className="text-lg font-bold text-secondary">{level}</div>
        </div>
      </div>

      {/* Game Board */}
      <div 
        className="game-board relative select-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={handleTap}
      >
        <div 
          className="grid gap-0.5 p-2 lg:p-4 bg-surface/40 rounded-lg border border-border"
          style={{ 
            gridTemplateColumns: `repeat(${BOARD_WIDTH}, 1fr)`,
            gridTemplateRows: `repeat(${BOARD_HEIGHT}, 1fr)`
          }}
        >
          {renderBoard()}
        </div>
        
        {gameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
            <div className="text-center p-4 lg:p-6">
              <h2 className="text-xl lg:text-2xl font-bold gaming-text-gradient mb-2">Game Over!</h2>
              <p className="text-muted-foreground mb-4 text-sm lg:text-base">Score final: {score.toLocaleString()}</p>
              <Button onClick={toggleGame} className="gaming-button-secondary" size="sm">
                <RotateCcw className="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2" />
                Nouvelle partie
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Instructions */}
      <div className="lg:hidden text-center text-xs text-muted-foreground max-w-xs px-2">
        <p>📱 Glissez pour déplacer • 👆 Tapotez pour tourner</p>
      </div>
    </div>
  );
}