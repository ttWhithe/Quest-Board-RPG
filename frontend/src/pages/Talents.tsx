import { useState, useMemo, useEffect } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { useTalents, useUpgradeTalent } from '../api/talents';
import type { TalentNode } from '../api/talents';

const NODE_SIZE = 36;
const PADDING = 700;

export function Talents() {
  const { data, isLoading } = useTalents();
  const { mutate: upgradeTalent, isPending } = useUpgradeTalent();

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<TalentNode | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Восстановление зума и скролла из sessionStorage
  const [initialState] = useState(() => {
    try {
      const saved = sessionStorage.getItem('talent_tree_state');
      return saved ? JSON.parse(saved) : { scale: 0.4, positionX: 0, positionY: 0 };
    } catch {
      return { scale: 0.4, positionX: 0, positionY: 0 };
    }
  });

  const bounds = useMemo(() => {
    if (!data || data.nodes.length === 0) return { minX: 0, minY: 0, width: 2000, height: 2000 };
    const xs = data.nodes.map(n => n.x);
    const ys = data.nodes.map(n => n.y);
    const minX = Math.min(...xs) - PADDING;
    const maxX = Math.max(...xs) + PADDING;
    const minY = Math.min(...ys) - PADDING;
    const maxY = Math.max(...ys) + PADDING;
    return { minX, minY, width: maxX - minX, height: maxY - minY };
  }, [data]);

  const nodesMap = useMemo(
    () => new Map((data?.nodes ?? []).map(n => [n.id, n])),
    [data]
  );

  const selectedNode = useMemo(
    () => (selectedNodeId ? (nodesMap.get(selectedNodeId) ?? null) : null),
    [selectedNodeId, nodesMap]
  );

  // --- ЛОГИКА ПОДСВЕТКИ ПУТИ ---
  // 1. Находим ВСЕ кратчайшие пути от старта до цели.
  // 2. Считаем, в скольких путях встречается каждое ребро.
  // 3. Если ребро во ВСЕХ путях — это общий участок (до развилки) → синий.
  // 4. Иначе — это ребро конкретной ветки → цвет ветки (оранжевый, зелёный и т.д.).
  const pathEdgeColors = useMemo(() => {
    if (!hoveredNode || !data) return new Map<string, string>();
    const startId = 'skyrim_start';
    const targetId = hoveredNode.id;
    if (startId === targetId) return new Map<string, string>();

    // BFS от старта: кратчайшее расстояние до каждого узла
    const distFromStart = new Map<string, number>();
    distFromStart.set(startId, 0);
    const q1 = [startId];
    while (q1.length) {
      const curr = q1.shift()!;
      data.edges.forEach(([from, to]) => {
        if (from === curr && !distFromStart.has(to)) {
          distFromStart.set(to, distFromStart.get(curr)! + 1);
          q1.push(to);
        }
      });
    }
    if (!distFromStart.has(targetId)) return new Map<string, string>();

    // Обратный BFS: собираем ВСЕ кратчайшие пути целиком
    const allPaths: string[][][] = [];
    const queue: { id: string; path: string[][] }[] = [{ id: targetId, path: [] }];
    while (queue.length) {
      const { id, path } = queue.shift()!;
      if (id === startId) {
        allPaths.push(path);
        continue;
      }
      const currentDist = distFromStart.get(id)!;
      data.edges.forEach(([from, to]) => {
        if (to === id && distFromStart.get(from) === currentDist - 1) {
          queue.push({ id: from, path: [[from, to], ...path] });
        }
      });
    }
    if (allPaths.length === 0) return new Map<string, string>();

    // Частота рёбер: сколько путей через них проходит
    const edgeFrequency = new Map<string, number>();
    allPaths.forEach(path => {
      path.forEach(([from, to]) => {
        const key = `${from}-${to}`;
        edgeFrequency.set(key, (edgeFrequency.get(key) || 0) + 1);
      });
    });

    // Цвета веток (не включают основной синий — он зарезервирован за общим путём)
    const MAIN_COLOR = '#3B82F6';
    const branchColors = ['#F59E0B', '#10B981', '#EF4444', '#8B5CF6', '#EC4899'];
    const edgeColors = new Map<string, string>();
    const branchIdToColor = new Map<string, string>();
    let colorCounter = 0;

    allPaths.forEach(path => {
      // Ветка идентифицируется первым ребром после стартового (A → X)
      const branchId = path.length > 1 ? path[1][1] : 'default';
      if (!branchIdToColor.has(branchId)) {
        branchIdToColor.set(branchId, branchColors[colorCounter % branchColors.length]);
        colorCounter++;
      }
      const branchColor = branchIdToColor.get(branchId)!;

      path.forEach(([from, to]) => {
        const key = `${from}-${to}`;
        // Ребро входит во все кратчайшие пути → общий участок → синий
        if (edgeFrequency.get(key) === allPaths.length) {
          edgeColors.set(key, MAIN_COLOR);
        } else {
          edgeColors.set(key, branchColor);
        }
      });
    });

    return edgeColors;
  }, [hoveredNode, data]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedNodeId(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleTransformed = (ref: any) => {
    if (ref?.state) {
      sessionStorage.setItem('talent_tree_state', JSON.stringify({
        scale: ref.state.scale,
        positionX: ref.state.positionX,
        positionY: ref.state.positionY
      }));
    }
  };

  if (isLoading || !data) {
    return <div className="p-8 text-center text-parchment-light">Загрузка древа...</div>;
  }

  const getNodeColor = (node: TalentNode) => {
    if (node.rank > 0) return 'bg-amber-500 border-yellow-200 shadow-[0_0_15px_rgba(245,158,11,0.8)] z-20';
    if (node.can_upgrade) return 'bg-emerald-600 border-emerald-300 hover:bg-emerald-500 cursor-pointer shadow-[0_0_10px_rgba(16,185,129,0.6)] z-20';
    if (node.type === 'start') return 'bg-red-800 border-red-500 shadow-[0_0_15px_rgba(220,38,38,0.5)] z-20';
    if (node.type === 'notable') return 'bg-purple-900 border-purple-500 z-20';
    return 'bg-[#2a2a35] border-[#4a4a5a] z-20 opacity-90';
  };

  return (
    <div className="absolute inset-0 bg-[#1a1512] overflow-hidden flex flex-col">

      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-black/80 px-6 py-2 rounded-full border-2 border-amber-600 shadow-xl pointer-events-none">
        <span className="text-parchment-light font-bold text-lg">
          Доступно очков: <span className="text-amber-400">{data.available_points}</span>
        </span>
      </div>

      <TransformWrapper
        initialScale={initialState.scale}
        initialPositionX={initialState.positionX}
        initialPositionY={initialState.positionY}
        minScale={0.1}
        maxScale={2}
        centerOnInit={initialState.scale === 0.4}
        smooth={false}
        wheel={{ step: 0.05 }}
        doubleClick={{ disabled: true }}
        onTransform={handleTransformed}
      >
        <TransformComponent wrapperClass="w-full h-full" contentClass="w-full h-full">
          <div className="relative" style={{ width: bounds.width, height: bounds.height }}>
            <svg className="absolute inset-0 pointer-events-none" width={bounds.width} height={bounds.height}>
              <defs>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              {data.edges.map(([from, to], idx) => {
                const n1 = nodesMap.get(from);
                const n2 = nodesMap.get(to);
                if (!n1 || !n2) return null;

                const x1 = n1.x - bounds.minX;
                const y1 = n1.y - bounds.minY;
                const x2 = n2.x - bounds.minX;
                const y2 = n2.y - bounds.minY;

                const isActive = (n1.rank > 0 && n2.rank > 0) || (n1.type === 'start' && n2.rank > 0) || (n2.type === 'start' && n1.rank > 0);

                const hoverColor = pathEdgeColors.get(`${from}-${to}`);
                const isHoveredPath = hoverColor !== undefined;

                const midX = (x1 + x2) / 2;
                const midY = (y1 + y2) / 2;
                const dx = x2 - x1;
                const dy = y2 - y1;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const offset = from === 'skyrim_start' || to === 'skyrim_start' ? 0 : dist * 0.1;
                const cx = midX - (dy / dist) * offset;
                const cy = midY + (dx / dist) * offset;

                const pathData = `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;

                return (
                  <g key={idx}>
                    {(isActive || isHoveredPath) && (
                      <path
                        d={pathData}
                        fill="none"
                        stroke={isHoveredPath ? hoverColor : "#F59E0B"}
                        strokeWidth={6}
                        strokeOpacity={0.3}
                        strokeLinecap="round"
                        filter="url(#glow)"
                      />
                    )}
                    <path
                      d={pathData}
                      fill="none"
                      stroke={isHoveredPath ? hoverColor : isActive ? '#F59E0B' : '#4B5563'}
                      strokeWidth={isActive || isHoveredPath ? 3 : 2}
                      strokeDasharray={isActive || isHoveredPath ? 'none' : '4 6'}
                      strokeLinecap="round"
                    />
                  </g>
                );
              })}
            </svg>

            {data.nodes.map(node => {
              const rx = node.x - bounds.minX;
              const ry = node.y - bounds.minY;

              return (
                <div
                  key={node.id}
                  onClick={() => setSelectedNodeId(node.id)}
                  onMouseEnter={(e) => {
                    setHoveredNode(node);
                    setMousePos({ x: e.clientX, y: e.clientY });
                  }}
                  onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
                  onMouseLeave={() => setHoveredNode(null)}
                  className={`absolute rounded-full border-[3px] flex items-center justify-center transition-all duration-200 ${getNodeColor(node)} ${
                    hoveredNode?.id === node.id ? 'scale-125 ring-2 ring-white/50' : ''
                  }`}
                  style={{
                    width: NODE_SIZE,
                    height: NODE_SIZE,
                    left: rx - NODE_SIZE / 2,
                    top: ry - NODE_SIZE / 2,
                  }}
                >
                  {/* Временная отладка: показываем буквы для ветки иллюзий */}
                  {node.id === 'illusion_root' ? (
                    <span className="text-white font-bold text-xs">A</span>
                  ) : node.id.startsWith('illusion_') ? (
                    <span className="text-white font-bold text-xs">
                      {String.fromCharCode(65 + parseInt(node.id.split('_')[1]))}
                    </span>
                  ) : (
                    <>
                      {node.type === 'notable' && <span className="text-white text-xs">★</span>}
                      {node.type === 'start' && <span className="text-white text-sm">★</span>}
                      {node.rank > 0 && node.type === 'small' && (
                        <span className="text-black font-extrabold text-xs">{node.rank}</span>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </TransformComponent>
      </TransformWrapper>

      {hoveredNode && (
        <div
          className="fixed z-50 pointer-events-none bg-black/95 border-2 border-amber-600/50 p-3 rounded-lg shadow-2xl w-64 -translate-x-1/2 -translate-y-[120%] transition-opacity duration-150"
          style={{ left: mousePos.x, top: mousePos.y }}
        >
          <h4 className="text-amber-400 font-bold text-sm mb-1">{hoveredNode.name}</h4>
          <p className="text-gray-300 text-xs mb-2 leading-tight">{hoveredNode.description}</p>
          <div className="flex justify-between items-center text-[10px] text-gray-400 border-t border-gray-700 pt-2">
            <span>Ранг: {hoveredNode.rank} / {hoveredNode.max_rank}</span>
            {hoveredNode.type === 'notable' && <span className="text-purple-400">Значимый</span>}
          </div>
        </div>
      )}

      {selectedNode && (
        <div className="absolute bottom-4 left-4 right-4 md:left-auto md:w-96 bg-[#12100e]/95 backdrop-blur-sm p-5 rounded-xl border border-amber-600/50 shadow-2xl z-40 transition-transform">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-2xl font-bold text-amber-400">{selectedNode.name}</h3>
            <button onClick={() => setSelectedNodeId(null)} className="text-gray-400 hover:text-white p-1">✕</button>
          </div>
          <p className="text-parchment-light text-sm mb-6">{selectedNode.description}</p>
          <div className="flex justify-between items-center text-sm text-gray-400 mb-4 bg-black/40 p-2 rounded-lg">
            <span>Ранг: <span className="text-white font-bold">{selectedNode.rank}</span> / {selectedNode.max_rank}</span>
            {selectedNode.type === 'notable' && <span className="text-purple-400 font-medium">Значимый</span>}
          </div>
          <button
            onClick={() => upgradeTalent(selectedNode.id)}
            disabled={!selectedNode.can_upgrade || isPending}
            className={`w-full py-3 rounded-lg font-bold transition-all text-lg shadow-lg ${
              selectedNode.can_upgrade
                ? 'bg-amber-600 hover:bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
            }`}
          >
            {isPending ? 'Изучение...' : selectedNode.can_upgrade ? 'Изучить' : 'Недоступно'}
          </button>
        </div>
      )}
    </div>
  );
}
