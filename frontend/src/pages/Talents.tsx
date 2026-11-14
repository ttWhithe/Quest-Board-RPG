import { useState, useMemo, useEffect, useRef } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { useTalents, useUpgradeTalent } from '../api/talents';
import type { TalentNode } from '../api/talents';
import { TalentsSkeleton } from '../components/Skeletons';

const NODE_SIZE = 36;
const PADDING = 300;

const edgeKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);

// Легаси-узлы (центр, характеристики): у них эти префиксы ID
const LEGACY_PREFIXES = ['xp_', 'wis_', 'str_', 'luck_', 'vit_', 'pre_', 'cross_'] as const;
const isLegacyNode = (id: string): boolean =>
  id !== 'skyrim_start' && LEGACY_PREFIXES.some(p => id.startsWith(p));
const isLegacyEdge = (from: string, to: string): boolean =>
  isLegacyNode(from) || isLegacyNode(to);

export function Talents() {
  const { data, isLoading } = useTalents();
  const { mutate: upgradeTalent, isPending } = useUpgradeTalent();

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<TalentNode | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const transformRef = useRef<any>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const initialScale = 0.18;

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

  const pathEdgeColors = useMemo(() => {
    if (!hoveredNode || !data) return new Map<string, string>();
    const startId = 'skyrim_start';
    const targetId = hoveredNode.id;
    if (startId === targetId) return new Map<string, string>();

    const adj = new Map<string, string[]>();
    data.nodes.forEach(n => adj.set(n.id, []));
    data.edges.forEach(([u, v]) => {
      adj.get(u)!.push(v);
      adj.get(v)!.push(u);
    });

    const allPaths: string[][] = [];
    const MAX_PATHS = 2000;
    const dfs = (curr: string, path: string[], visited: Set<string>) => {
      if (allPaths.length >= MAX_PATHS) return;
      if (curr === targetId) {
        allPaths.push([...path]);
        return;
      }
      visited.add(curr);
      for (const next of adj.get(curr) || []) {
        if (!visited.has(next)) {
          path.push(next);
          dfs(next, path, visited);
          path.pop();
        }
      }
      visited.delete(curr);
    };
    dfs(startId, [startId], new Set());

    if (allPaths.length === 0) return new Map<string, string>();

    const minLen = Math.min(...allPaths.map(p => p.length));
    const shortestPaths = allPaths.filter(p => p.length === minLen);
    const longerPaths = allPaths.filter(p => p.length > minLen);

    const edgeFreq = new Map<string, number>();
    shortestPaths.forEach(path => {
      for (let i = 0; i < path.length - 1; i++) {
        const key = edgeKey(path[i], path[i + 1]);
        edgeFreq.set(key, (edgeFreq.get(key) || 0) + 1);
      }
    });

    const MAIN_COLOR = '#3B82F6';
    const RED_COLOR = '#EF4444';
    const branchColors = ['#F59E0B', '#10B981', '#8B5CF6', '#EC4899', '#F97316'];
    const edgeColors = new Map<string, string>();
    const branchIdToColor = new Map<string, string>();
    let colorCounter = 0;

    shortestPaths.forEach(path => {
      const branchId = path.length > 2 ? path[2] : 'default';
      if (!branchIdToColor.has(branchId)) {
        branchIdToColor.set(branchId, branchColors[colorCounter % branchColors.length]);
        colorCounter++;
      }
      const branchColor = branchIdToColor.get(branchId)!;

      for (let i = 0; i < path.length - 1; i++) {
        const key = edgeKey(path[i], path[i + 1]);
        if (edgeFreq.get(key) === shortestPaths.length) {
          edgeColors.set(key, MAIN_COLOR);
        } else {
          edgeColors.set(key, branchColor);
        }
      }
    });

    longerPaths.forEach(path => {
      for (let i = 0; i < path.length - 1; i++) {
        const key = edgeKey(path[i], path[i + 1]);
        if (!edgeColors.has(key)) {
          edgeColors.set(key, RED_COLOR);
        }
      }
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

  const handleReset = () => {
    if (!transformRef.current) return;
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    const dotX = 0 - bounds.minX;
    const dotY = 0 - bounds.minY;
    const x = w / 2 - dotX * initialScale;
    const y = h / 2 - dotY * initialScale;

    transformRef.current.setTransform(x, y, initialScale, 300, "easeOut");
  };

  if (isLoading || !data) {
    return <TalentsSkeleton />;
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

      <button
        onClick={handleReset}
        className="absolute top-4 left-4 z-40 bg-black/80 hover:bg-black px-4 py-2 rounded-full border-2 border-amber-600 text-amber-400 text-sm font-bold shadow-xl transition-colors cursor-pointer"
        title="Вернуть красную точку в центр"
      >
        ⌖ Сброс вида
      </button>

      <div ref={canvasRef} className="flex-1 relative w-full h-full overflow-hidden">
        <TransformWrapper
          ref={transformRef}
          initialScale={initialScale}
          minScale={0.05}
          maxScale={2}
          centerOnInit={false}
          limitToBounds={true}
          smooth={false}
          wheel={{ step: 0.05 }}
          doubleClick={{ disabled: true }}
          onInit={() => setTimeout(handleReset, 100)}
        >
          <TransformComponent wrapperClass="w-full h-full" wrapperStyle={{ width: '100%', height: '100%' }}>
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

                  const hoverColor = pathEdgeColors.get(edgeKey(from, to));
                  const isHoveredPath = hoverColor !== undefined;

                  // РАЗЛИЧАЕМ ЛЕГАСИ (центр) И СКАЙРИМ (внешние ветки)
                  const legacy = isLegacyEdge(from, to);
                  const inactiveStroke = legacy ? '#78716C' : '#6B7280';
                  const inactiveDash = legacy ? '3 5' : '6 9';

                  const midX = (x1 + x2) / 2;
                  const midY = (y1 + y2) / 2;
                  const dx = x2 - x1;
                  const dy = y2 - y1;
                  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
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
                        stroke={isHoveredPath ? hoverColor : isActive ? '#F59E0B' : inactiveStroke}
                        strokeWidth={isActive || isHoveredPath ? 3 : 2}
                        strokeDasharray={isActive || isHoveredPath ? 'none' : inactiveDash}
                        strokeOpacity={isActive || isHoveredPath ? 1 : 0.5}
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
                    id={`node-${node.id}`}
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
                    {node.id === 'skyrim_start' ? (
                      <span className="text-white text-sm">★</span>
                    ) : node.id.endsWith('_root') ? (
                      <span className="text-white font-bold text-xs">A</span>
                    ) : node.id.includes('_') ? (
                      <span className="text-white font-bold text-xs">
                        {String.fromCharCode(65 + parseInt(node.id.split('_').pop() || '0'))}
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </TransformComponent>
        </TransformWrapper>
      </div>

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
