import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw } from 'lucide-react';
import LineEffect from '@/components/game/LineEffect';
import DemoResultModal from '@/components/game/DemoResultModal';
import { GameSettings } from '@/hooks/useGameSettings';

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
const CELL_SIZE = 24; // Corresponds to w-6/h-6 in Tailwind

interface TetrisBoardProps {
  onScoreChange?: (score: number) => void;
  onLinesChange?: (lines: number) => void;
  isDemo?: boolean;
  onGameOver: (score: number) => void;
  playMove: () => void;
  playRotate: () => void;
  playDrop: () => void;
  playLineClear: (lines: number) => void;
  playGameOver: () => void;
  playDebrisFall: () => void;
  gameSettings: GameSettings;
  maxScore?: number;
}

export default function TetrisBoard({
  onScoreChange,
  onLinesChange,
  isDemo = false,
  onGameOver,
  playMove,
  playRotate,
  playDrop,
  playLineClear,
  playGameOver,
  playDebrisFall,
  gameSettings,
  maxScore
}: TetrisBoardProps) {
  const [board, setBoard] = useState<(string | null)[][]>(() =>
    Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(null))
  );
  const [currentPiece, setCurrentPiece] = useState<any>(null);
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [dropSpeed, setDropSpeed] = useState(gameSettings.initialSpeed || 1000);
  const [linesToAnimate, setLinesToAnimate] = useState<{ y: number; row: (string | number)[] }[]>([]);
  const [showDemoResult, setShowDemoResult] = useState(false);
  const [multiplier, setMultiplier] = useState(1);
  const [fastDrop, setFastDrop] = useState(false);
  
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const scoreRef = useRef<HTMLDivElement | null>(null);
  const [scorePosition, setScorePosition] = useState<{ x: number; y: number } | null>(null);

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
    const linesToClearIndices = findLinesToClear(boardState);
    
    if (linesToClearIndices.length > 0) {
      // Trigger animation
      const linesData = linesToClearIndices.map(y => ({ y, row: boardState[y] as (string|number)[] }));
      setLinesToAnimate(linesData);
      playLineClear(linesToClearIndices.length);
      
      // Update score and level immediately
      const clearedLinesCount = linesToClearIndices.length;
      const newLines = lines + clearedLinesCount;
      let newScore = score + clearedLinesCount * 100 * level * multiplier;
      
      // Cap score at maxScore if provided (for real money games)
      if (maxScore && newScore > maxScore) {
        newScore = maxScore;
      }
      
      const newLevel = Math.floor(newLines / 10) + 1;
      const newMultiplier = Math.min(5, multiplier + (clearedLinesCount === 4 ? 0.5 : 0.2));

      setLines(newLines);
      setScore(newScore);
      setLevel(newLevel);
      setMultiplier(newMultiplier);
      onLinesChange?.(newLines);
      onScoreChange?.(newScore);

      // Update board state immediately
      const newBoard = boardState.filter((_, index) => !linesToClearIndices.includes(index));
      while (newBoard.length < BOARD_HEIGHT) {
        newBoard.unshift(Array(BOARD_WIDTH).fill(null));
      }
      
      setDropSpeed(Math.max(100, (gameSettings.initialSpeed || 1000) - (newLevel - 1) * (gameSettings.speedIncrease || 100)));

      playDebrisFall();
      return newBoard;
    }
    
    return boardState;
  }, [findLinesToClear, playLineClear, playDebrisFall, lines, score, level, multiplier, onLinesChange, onScoreChange]);

  // Game loop
  const gameLoop = useCallback(() => {
    if (!currentPiece || gameOver) return;

    if (isValidMove(currentPiece, currentPiece.x, currentPiece.y + 1)) {
      setCurrentPiece(prev => ({ ...prev, y: prev.y + 1 }));
    } else {
      playDrop();
      
      // Place piece and generate new one
      const newBoard = placePiece(currentPiece);
      const boardAfterClear = clearLines(newBoard);
      setBoard(boardAfterClear);
      
      const newPiece = generatePiece();
      
      // Check game over
      if (!isValidMove(newPiece, newPiece.x, newPiece.y)) {
        setGameOver(true);
        setIsPlaying(false);
        playGameOver();
        
        onGameOver(score);
        return;
      }
      
      setCurrentPiece(newPiece);
    }
  }, [currentPiece, gameOver, linesToAnimate, fastDrop, isValidMove, placePiece, clearLines, generatePiece, playDrop, playGameOver, isDemo]);

  // Move piece
  const movePiece = useCallback((dx: number, dy: number) => {
    if (!currentPiece || gameOver) return;
    
    const newX = currentPiece.x + dx;
    const newY = currentPiece.y + dy;
    
    if (isValidMove(currentPiece, newX, newY)) {
      setCurrentPiece(prev => ({ ...prev, x: newX, y: newY }));
      if (dx !== 0) playMove();
      if (dy > 0) setFastDrop(true);
    }
  }, [currentPiece, gameOver, linesToAnimate, isValidMove, playMove]);

  // Rotate current piece
  const rotate = useCallback(() => {
    if (!currentPiece || gameOver) return;
    
    const rotatedShape = rotatePiece(currentPiece);
    if (isValidMove(currentPiece, currentPiece.x, currentPiece.y, rotatedShape)) {
      setCurrentPiece(prev => ({ ...prev, shape: rotatedShape }));
      playRotate();
    }
  }, [currentPiece, gameOver, linesToAnimate, rotatePiece, isValidMove, playRotate]);

  // Touch controls
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // The native listener handles prevention for dragging, so this is not needed here.
    // if (e.cancelable) e.preventDefault();
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const minSwipeDistance = 16;

    // Downward drag -> enable fast drop and block browser pull-to-refresh
    if (deltaY > minSwipeDistance && Math.abs(deltaY) > Math.abs(deltaX)) {
      setFastDrop(true);
      if (e.cancelable) e.preventDefault();
    }
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
      // Vertical swipe up = rotate
      if (deltaY < -minSwipeDistance) {
        rotate();
      }
    }
    
    setFastDrop(false);
    touchStartRef.current = null;
  }, [movePiece, rotate]);

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
      setDropSpeed(gameSettings.initialSpeed || 1000);
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
      const fastDropMultiplier = gameSettings.fastDropMultiplier || 20;
      const currentSpeed = fastDrop ? Math.max(50, dropSpeed / fastDropMultiplier) : dropSpeed;
      gameLoopRef.current = setInterval(gameLoop, currentSpeed);
    } else if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
    }
    
    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [isPlaying, gameOver, gameLoop, dropSpeed, fastDrop, linesToAnimate]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
  }, [isPlaying, gameOver, linesToAnimate, movePiece, rotate]);

  // Native non-passive touch listeners to prevent pull-to-refresh only on drag down
  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;

    let startY = 0;
    let isDragging = false;

    const onStart = (ev: TouchEvent) => {
      startY = ev.touches[0].clientY;
      isDragging = false;
    };

    const onMove = (ev: TouchEvent) => {
      if (!touchStartRef.current) return;
      
      const touch = ev.touches[0];
      const deltaY = touch.clientY - startY;
      
      // Only prevent if dragging down significantly (avoid blocking taps)
      if (deltaY > 20) {
        isDragging = true;
        setFastDrop(true);
        if (ev.cancelable) ev.preventDefault();
      }
    };

    const onEnd = () => {
      if (!isDragging) {
        // This was a tap, not a drag - let React handle it
      }
      isDragging = false;
    };

    el.addEventListener('touchstart', onStart, { passive: false });
    el.addEventListener('touchmove', onMove, { passive: false });
    el.addEventListener('touchend', onEnd, { passive: false });
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('touchend', onEnd);
    };
  }, []);

  useEffect(() => {
    if (scoreRef.current && boardRef.current) {
      const scoreRect = scoreRef.current.getBoundingClientRect();
      const boardRect = boardRef.current.getBoundingClientRect();
      setScorePosition({
        x: scoreRect.left - boardRect.left + scoreRect.width / 2,
        y: scoreRect.top - boardRect.top + scoreRect.height / 2,
      });
    }
  }, [scoreRef.current, boardRef.current]);

  // Render the game board with current piece
  const renderBoard = () => {
    const displayBoard = board.map(row => [...row]);
    
    // Add current piece to display board
    if (currentPiece) {
      for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
          if (currentPiece.shape[y][x]) {
            const boardY = currentPiece.y + y;
            const boardX = currentPiece.x + x;
            if (
              boardY >= 0 && boardY < BOARD_HEIGHT &&
              boardX >= 0 && boardX < BOARD_WIDTH
            ) {
              displayBoard[boardY][boardX] = currentPiece.color;
            }
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

  const onLineEffectComplete = useCallback(() => setLinesToAnimate([]), []);

  return (
    <>
      <div className="flex flex-col items-center h-full justify-between" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {/* Mobile Stats - Fixed at top */}
        <div className="lg:hidden w-full px-4 py-2 bg-background/80 backdrop-blur-sm border-b border-border">
          <div className="flex justify-between items-center text-sm">
            <div className="text-center" ref={scoreRef}>
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
          <div className="gaming-card px-4 py-2" ref={scoreRef}>
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

        {/* Game Board - Adjusted for mobile visibility */}
        <div className="flex-1 flex items-center justify-center w-full p-2">
          <div
            ref={boardRef}
            className="game-board relative select-none w-full h-full flex items-center justify-center touch-none overscroll-contain"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onClick={handleTap}
          >
            <div
              className="grid gap-0.5 p-1 bg-surface/40 rounded-lg border border-border"
              style={{
                gridTemplateColumns: `repeat(${BOARD_WIDTH}, 1fr)`,
                gridTemplateRows: `repeat(${BOARD_HEIGHT}, 1fr)`,
                aspectRatio: '10 / 20',
                maxHeight: '100%',
                maxWidth: '100%',
              }}
            >
              {renderBoard()}
            </div>
            
            {/* Line clearing effects */}
            {linesToAnimate.length > 0 && scorePosition && (
              <LineEffect
                clearedLines={linesToAnimate}
                onComplete={onLineEffectComplete}
                cellSize={CELL_SIZE}
                targetPosition={scorePosition}
              />
            )}
            
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
          isOpen={true}
          score={score}
          payout={0}
          isWin={false}
          isJackpot={false}
          isDemo={isDemo}
          onPlayReal={() => {
            setShowDemoResult(false);
            // Note: onRealPlay callback should be passed from parent
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