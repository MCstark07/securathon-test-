import React, { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';
import { Shuffle, Plus, Hand, Box } from 'lucide-react';

export default function EntropyChamber() {
  const containerRef = useRef(null);
  const engineRef = useRef(null);
  const [chunkCount, setChunkCount] = useState(12);

  // Function to add an entropy chunk
  const spawnChunk = (engine, x, y) => {
    if (!engine) return;
    const { Bodies, Composite } = Matter;

    const colors = ['#34d399', '#06b6d4', '#a855f7', '#38bdf8', '#f59e0b', '#ec4899', '#10b981'];
    const chosenColor = colors[Math.floor(Math.random() * colors.length)];
    const width = 36 + Math.random() * 24;
    const height = 22 + Math.random() * 16;

    const block = Bodies.rectangle(x, y, width, height, {
      restitution: 0.65,
      friction: 0.05,
      frictionAir: 0.015,
      chamfer: { radius: 4 },
      render: {
        fillStyle: chosenColor,
        strokeStyle: '#0f172a',
        lineWidth: 2
      }
    });

    Composite.add(engine.world, block);
    setChunkCount((prev) => prev + 1);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const {
      Engine,
      Render,
      Runner,
      Bodies,
      Composite,
      Mouse,
      MouseConstraint
    } = Matter;

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 280;

    // 1. Create Engine & World
    const engine = Engine.create({
      gravity: { x: 0, y: 0.9, scale: 0.001 }
    });
    engineRef.current = engine;

    // 2. Create Renderer
    const render = Render.create({
      element: container,
      engine: engine,
      options: {
        width: width,
        height: height,
        wireframes: false,
        background: 'transparent',
        pixelRatio: Math.min(window.devicePixelRatio, 2)
      }
    });

    Render.run(render);

    // 3. Create Runner
    const runner = Runner.create();
    Runner.run(runner, engine);

    // 4. Create Container Boundaries
    const wallThickness = 60;
    const floor = Bodies.rectangle(width / 2, height + wallThickness / 2 - 2, width * 2, wallThickness, {
      isStatic: true,
      render: { fillStyle: '#1e293b' }
    });
    const ceiling = Bodies.rectangle(width / 2, -wallThickness / 2, width * 2, wallThickness, {
      isStatic: true,
      render: { fillStyle: 'transparent' }
    });
    const leftWall = Bodies.rectangle(-wallThickness / 2, height / 2, wallThickness, height * 2, {
      isStatic: true,
      render: { fillStyle: '#1e293b' }
    });
    const rightWall = Bodies.rectangle(width + wallThickness / 2, height / 2, wallThickness, height * 2, {
      isStatic: true,
      render: { fillStyle: '#1e293b' }
    });

    Composite.add(engine.world, [floor, ceiling, leftWall, rightWall]);

    // 5. Initial Spawn of Encrypted Chunk Blocks
    const colors = [
      '#34d399', '#06b6d4', '#a855f7', '#38bdf8',
      '#f59e0b', '#10b981', '#6366f1', '#14b8a6'
    ];

    const initialBlocks = [];
    for (let i = 0; i < 12; i++) {
      const x = width * 0.2 + Math.random() * (width * 0.6);
      const y = 30 + Math.random() * 80;
      const bWidth = 38 + Math.random() * 22;
      const bHeight = 22 + Math.random() * 14;
      const color = colors[i % colors.length];

      const block = Bodies.rectangle(x, y, bWidth, bHeight, {
        restitution: 0.6,
        friction: 0.05,
        frictionAir: 0.012,
        chamfer: { radius: 4 },
        render: {
          fillStyle: color,
          strokeStyle: '#0f172a',
          lineWidth: 2
        }
      });
      initialBlocks.push(block);
    }
    Composite.add(engine.world, initialBlocks);

    // 6. Interactive Mouse Drag Controls (MouseConstraint)
    const mouse = Mouse.create(render.canvas);
    // Allow canvas touch/drag without blocking window scroll
    mouse.element.removeEventListener('mousewheel', mouse.mousewheel);
    mouse.element.removeEventListener('DOMMouseScroll', mouse.mousewheel);

    const mouseConstraint = MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: {
        stiffness: 0.2,
        render: {
          visible: true,
          lineWidth: 1,
          strokeStyle: 'rgba(6, 182, 212, 0.5)'
        }
      }
    });

    Composite.add(engine.world, mouseConstraint);
    render.mouse = mouse;

    // 7. Resize handling
    const handleResize = () => {
      if (!container || !render.canvas) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight || 280;

      render.canvas.width = newWidth;
      render.canvas.height = newHeight;
      render.options.width = newWidth;
      render.options.height = newHeight;

      // Reposition walls
      Matter.Body.setPosition(floor, { x: newWidth / 2, y: newHeight + wallThickness / 2 - 2 });
      Matter.Body.setPosition(rightWall, { x: newWidth + wallThickness / 2, y: newHeight / 2 });
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // 8. Cleanup
    return () => {
      resizeObserver.disconnect();
      Render.stop(render);
      Runner.stop(runner);
      Composite.clear(engine.world, false);
      Engine.clear(engine);

      if (render.canvas && render.canvas.parentNode) {
        render.canvas.parentNode.removeChild(render.canvas);
      }
      engineRef.current = null;
    };
  }, []);

  const handleAddChunk = () => {
    if (!engineRef.current || !containerRef.current) return;
    const w = containerRef.current.clientWidth || 300;
    spawnChunk(engineRef.current, w * 0.3 + Math.random() * (w * 0.4), 20);
  };

  return (
    <div className="relative rounded-3xl backdrop-blur-md bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 p-5 shadow-2xl overflow-hidden transition-all duration-300 flex flex-col justify-between">
      {/* Header telemetry badge & button */}
      <div className="flex items-center justify-between gap-2 z-10 mb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-400">
            <Shuffle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <span>Entropy & Nonce Chamber</span>
              <span className="text-[10px] font-mono text-cyan-400">Matter.js</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Interactive 2D physics sandbox for cryptographic nonces
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-slate-400 hidden sm:inline-flex items-center gap-1 bg-slate-950/60 px-2.5 py-1 rounded-full border border-slate-800">
            <Box className="w-3 h-3 text-purple-400" /> {chunkCount} Chunks
          </span>
          <button
            type="button"
            onClick={handleAddChunk}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-cyan-950/80 hover:bg-cyan-900/80 border border-cyan-500/50 text-cyan-300 text-xs font-semibold shadow-[0_0_12px_rgba(6,182,212,0.25)] transition-all cursor-pointer active:scale-95"
            title="Inject entropy block"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Inject</span>
          </button>
        </div>
      </div>

      {/* Physics Canvas Container */}
      <div
        ref={containerRef}
        className="w-full h-56 sm:h-64 relative overflow-hidden rounded-2xl bg-slate-950/60 border border-slate-800/80 cursor-grab active:cursor-grabbing flex items-center justify-center"
      >
        <div className="absolute top-2 left-2 z-10 text-[10px] text-slate-500 font-mono pointer-events-none flex items-center gap-1">
          <Hand className="w-3 h-3 text-cyan-400" /> Click & drag blocks to fling entropy
        </div>
      </div>
    </div>
  );
}
