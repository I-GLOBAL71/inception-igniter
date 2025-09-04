import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { useSound } from '@/hooks/useSound';
import LineEffect from '@/components/game/LineEffect';
import DemoResultModal from '@/components/game/DemoResultModal';

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
  isDemo?: boolean;
  onRealPlay?: () => void;
}

export default function TetrisBoard({ onScoreChange, onLinesChange, isDemo = false, onRealPlay }: TetrisBoardProps) {
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
  const [clearingLines, setClearingLines] = useState<number[]>([]);
  const [showDemoResult, setShowDemoResult] = useState(false);
  const [multiplier, setMultiplier] = useState(1);
  const [fastDrop, setFastDrop] = useState(false);
  
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const { playMove, playRotate, playDrop, playLineClear, playGameOver } = useSound();

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

  // Find lines to clear
  const findLinesToClear = useCallback((boardState: (string | null)[][]) => {
    const linesToClear: number[] = [];
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      if (boardState[y].every(cell => cell !== null)) {
        linesToClear.push(y);
      }
    }
    return linesToClear;
  }, []);

  // Clear completed lines with effects
  const clearLines = useCallback((boardState: (string | null)[][]) => {
    const linesToClear = findLinesToClear(boardState);
    
    if (linesToClear.length > 0) {
      setClearingLines(linesToClear);
      playLineClear(linesToClear.length);
      
      // Calculate multiplier based on combo and consecutive clears
      const newMultiplier = Math.min(5, multiplier + (linesToClear.length === 4 ? 0.5 : 0.2));
      setMultiplier(newMultiplier);
      
      return boardState; // Return unchanged board during effect
    }
    
    return boardState;
  }, [findLinesToClear, playLineClear, multiplier]);

  // Actually remove the lines after effect
  const executeLineClear = useCallback(() => {
    if (clearingLines.length === 0) return;
    
    setBoard(prevBoard => {
      const newBoard = prevBoard.filter((_, index) => !clearingLines.includes(index));
      
      // Add empty rows at the top
      while (newBoard.length < BOARD_HEIGHT) {
        newBoard.unshift(Array(BOARD_WIDTH).fill(null));
      }
      
      const clearedLines = clearingLines.length;
      const newLines = lines + clearedLines;
      const newScore = score + clearedLines * 100 * level * multiplier;
      const newLevel = Math.floor(newLines / 10) + 1;
      
      setLines(newLines);
      setScore(newScore);
      setLevel(newLevel);
      
      // Get speed settings from localStorage or use defaults
      const savedSettings = localStorage.getItem('gameSettings');
      const settings = savedSettings ? JSON.parse(savedSettings) : { 
        initialSpeed: INITIAL_SPEED, 
        speedIncrease: 100,
        fastDropMultiplier: 20,
        softDropMultiplier: 3
      };
      
      setDropSpeed(Math.max(100, settings.initialSpeed - (newLevel - 1) * settings.speedIncrease));
      
      onLinesChange?.(newLines);
      onScoreChange?.(newScore);
      
      return newBoard;
    });
    
    setClearingLines([]);
  }, [clearingLines, lines, score, level, multiplier, onLinesChange, onScoreChange]);

  // Game loop
  const gameLoop = useCallback(() => {
    if (!currentPiece || gameOver || clearingLines.length > 0) return;

    const speedMultiplier = fastDrop ? 20 : 1;
    
    if (isValidMove(currentPiece, currentPiece.x, currentPiece.y + 1)) {
      setCurrentPiece(prev => ({ ...prev, y: prev.y + 1 }));
    } else {
      playDrop();
      
      // Place piece and generate new one
      const newBoard = placePiece(currentPiece);
      clearLines(newBoard);
      setBoard(newBoard);
      
      const newPiece = generatePiece();
      
      // Check game over
      if (!isValidMove(newPiece, newPiece.x, newPiece.y)) {
        setGameOver(true);
        setIsPlaying(false);
        playGameOver();
        
        if (isDemo) {
          setShowDemoResult(true);
        }
        return;
      }
      
      setCurrentPiece(newPiece);
    }
  }, [currentPiece, gameOver, clearingLines, fastDrop, isValidMove, placePiece, clearLines, generatePiece, playDrop, playGameOver, isDemo]);

  // Move piece
  const movePiece = useCallback((dx: number, dy: number) => {
    if (!currentPiece || gameOver || clearingLines.length > 0) return;
    
    const newX = currentPiece.x + dx;
    const newY = currentPiece.y + dy;
    
    if (isValidMove(currentPiece, newX, newY)) {
      setCurrentPiece(prev => ({ ...prev, x: newX, y: newY }));
      if (dx !== 0) playMove();
      if (dy > 0) setFastDrop(true);
    }
  }, [currentPiece, gameOver, clearingLines, isValidMove, playMove]);

  // Rotate current piece
  const rotate = useCallback(() => {
    if (!currentPiece || gameOver || clearingLines.length > 0) return;
    
    const rotatedShape = rotatePiece(currentPiece);
    if (isValidMove(currentPiece, currentPiece.x, currentPiece.y, rotatedShape)) {
      setCurrentPiece(prev => ({ ...prev, shape: rotatedShape }));
      playRotate();
    }
  }, [currentPiece, gameOver, clearingLines, rotatePiece, isValidMove, playRotate]);

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
    if (isPlaying && !gameOver && clearingLines.length === 0) {
      const currentSpeed = fastDrop ? Math.max(50, dropSpeed / 20) : dropSpeed;
      gameLoopRef.current = setInterval(gameLoop, currentSpeed);
    } else if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
    }
    
    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [isPlaying, gameOver, gameLoop, dropSpeed, fastDrop, clearingLines]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying || gameOver || clearingLines.length > 0) return;
      
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
          setFastDrop(true);
          movePiece(0, 1);
          break;
        case 'ArrowUp':
        case ' ':
          e.preventDefault();
          rotate();
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        setFastDrop(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPlaying, gameOver, clearingLines, movePiece, rotate]);

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
    <>
      <div className="flex flex-col items-center h-full">
        {/* Mobile Stats - Fixed at top */}
        <div className="lg:hidden w-full px-4 py-2 bg-background/80 backdrop-blur-sm border-b border-border">
          <div className="flex justify-between items-center text-sm">
            <div className="text-center">
              <div className="gaming-text-gradient font-bold">{score.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Score</div>
            </div>
            <div className="text-center">
              <div className="text-accent font-bold">{lines}</div>
              <div className="text-xs text-muted-foreground">Lignes</div>
            </div>
            <div className="text-center">
              <div className="text-secondary font-bold">{level}</div>
              <div className="text-xs text-muted-foreground">Niveau</div>
            </div>
            <div className="text-center">
              <div className="text-success font-bold">x{multiplier.toFixed(1)}</div>
              <div className="text-xs text-muted-foreground">Multi</div>
            </div>
          </div>
        </div>

        {/* Game Controls */}
        <div className="flex items-center gap-2 p-2">
          <Button
            onClick={toggleGame}
            variant="default"
            className="gaming-button-primary text-sm px-4"
            size="sm"
          >
            {gameOver ? (
              <><RotateCcw className="w-3 h-3 mr-1" /> Rejouer</>
            ) : isPlaying ? (
              <><Pause className="w-3 h-3 mr-1" /> Pause</>
            ) : (
              <><Play className="w-3 h-3 mr-1" /> Jouer</>
            )}
          </Button>
        </div>

        {/* Desktop Game Status */}
        <div className="hidden lg:flex gap-6 text-center mb-4">
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
          <div className="gaming-card px-4 py-2">
            <div className="text-sm text-muted-foreground">Multiplicateur</div>
            <div className="text-lg font-bold text-success">x{multiplier.toFixed(1)}</div>
          </div>
        </div>

        {/* Game Board - Flex-1 to fill remaining space */}
        <div className="flex-1 flex items-center justify-center w-full px-2">
          <div 
            className="game-board relative select-none max-w-full"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onClick={handleTap}
          >
            <div 
              className="grid gap-0.5 p-2 bg-surface/40 rounded-lg border border-border"
              style={{ 
                gridTemplateColumns: `repeat(${BOARD_WIDTH}, 1fr)`,
                gridTemplateRows: `repeat(${BOARD_HEIGHT}, 1fr)`,
                width: 'min(300px, 80vw)',
                height: 'min(600px, 70vh)',
              }}
            >
              {renderBoard()}
            </div>
            
            {/* Line clearing effects */}
            <LineEffect 
              lines={clearingLines} 
              onComplete={executeLineClear}
            />
            
            {gameOver && !showDemoResult && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
                <div className="text-center p-4">
                  <h2 className="text-xl font-bold gaming-text-gradient mb-2">Game Over!</h2>
                  <p className="text-muted-foreground mb-4 text-sm">Score final: {score.toLocaleString()}</p>
                  <Button onClick={toggleGame} className="gaming-button-secondary" size="sm">
                    <RotateCcw className="w-3 h-3 mr-1" />
                    Nouvelle partie
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Instructions - Fixed at bottom */}
        <div className="lg:hidden text-center text-xs text-muted-foreground p-2 bg-background/50">
          <p>📱 Glissez ← → • 👆 Tapotez pour tourner • ⬇ Maintenez pour accélérer</p>
        </div>
      </div>

      {/* Demo Result Modal */}
      {showDemoResult && (
        <DemoResultModal
          score={score}
          lines={lines}
          multiplier={multiplier}
          onPlayReal={() => {
            setShowDemoResult(false);
            onRealPlay?.();
          }}
          onPlayAgain={() => {
            setShowDemoResult(false);
            toggleGame();
          }}
          onClose={() => setShowDemoResult(false)}
        />
      )}
    </>
  );
}