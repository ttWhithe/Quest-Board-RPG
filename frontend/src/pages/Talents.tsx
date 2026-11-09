import { useState, useMemo } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { useTalents, useUpgradeTalent } from '../api/talents';
import type { TalentNode } from '../api/talents';

const NODE_SIZE = 40;
const PADDING = 300;

export function Talents() {
  const { data, isLoading } = useTalents();
  const { mutate: upgradeTalent, isPending } = useUpgradeTalent();
  const [selectedNode, setSelectedNode] = useState<TalentNode | null>(null);

  const bounds = useMemo(() => {
    if (!data || data.nodes.length === 0) return { minX: 0, minY: 0, width: 1000, height: 1000 };

    const xs = data.nodes.map(n => n.x);
    const ys = data.nodes.map(n => n.y);
    const minX = Math.min(...xs) - PADDING;
    const maxX = Math.max(...xs) + PADDING;
    const minY = Math.min(...ys) - PADDING;
    const maxY = Math.max(...ys) + PADDING;

    return { minX, minY, width: maxX - minX, height: maxY - minY };
  }, [data]);

  if (isLoading || !data) {
    return <div className="p-8 text-center text-parchment-light">Загрузка древа...</div>;
  }

  const nodesMap = new Map(data.nodes.map(n => [n.id, n]));

  const getNodeColor = (node: TalentNode) => {
    if (node.rank > 0) return 'bg-amber-500 border-yellow-200 shadow-[0_0_15px_rgba(245,158,11,0.8)]';
    if (node.can_upgrade) return 'bg-green-600 border-green-300 hover:bg-green-500 cursor-pointer shadow-[0_0_10px_rgba(34,197,94,0.5)]';

    if (node.type === 'start') return 'bg-red-800 border-red-500';
    if (node.type === 'notable') return 'bg-purple-900 border-purple-500';
    return 'bg-slate-800 border-slate-600';
  };

  return (
    <div className="absolute inset-0 bg-[#1a1512] overflow-hidden flex flex-col">
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-black/80 px-6 py-2 rounded-full border-2 border-amber-600 shadow-xl pointer-events-none">
        <span className="text-parchment-light font-bold text-lg">
          Доступно очков: <span className="text-amber-400">{data.available_points}</span>
        </span>
      </div>

      <TransformWrapper
        initialScale={0.8}
        minScale={0.2}
        maxScale={2}
        centerOnInit={true}
        smooth={false}
        wheel={{ step: 0.05 }}
        doubleClick={{ disabled: true }}
      >
        <TransformComponent wrapperClass="w-full h-full" contentClass="w-full h-full">
          <div
            className="relative"
            style={{ width: bounds.width, height: bounds.height }}
          >
            <svg
              className="absolute inset-0 pointer-events-none"
              width={bounds.width}
              height={bounds.height}
            >
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

                // Вычисляем контрольную точку для изгиба (Безье)
                // Слегка смещаем середину линии перпендикулярно, чтобы создать дугу
                const midX = (x1 + x2) / 2;
                const midY = (y1 + y2) / 2;

                // Смещение для органичного изгиба
                const dx = x2 - x1;
                const dy = y2 - y1;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const offset = dist * 0.15; // Изгиб 15% от длины

                const cx = midX - (dy / dist) * offset;
                const cy = midY + (dx / dist) * offset;

                const pathData = `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;

                return (
                  <g key={idx}>
                    {/* Подложка для свечения активных линий */}
                    {isActive && (
                      <path
                        d={pathData}
                        fill="none"
                        stroke="#F59E0B"
                        strokeWidth={8}
                        strokeOpacity={0.3}
                        strokeLinecap="round"
                        filter="url(#glow)"
                      />
                    )}
                    {/* Сама линия */}
                    <path
                      d={pathData}
                      fill="none"
                      stroke={isActive ? '#F59E0B' : '#374151'}
                      strokeWidth={isActive ? 4 : 2}
                      strokeDasharray={isActive ? 'none' : '6 6'}
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
                  onClick={() => setSelectedNode(node)}
                  className={`absolute rounded-full border-4 flex items-center justify-center transition-all duration-200 z-10 ${getNodeColor(node)}`}
                  style={{
                    width: NODE_SIZE,
                    height: NODE_SIZE,
                    left: rx - NODE_SIZE / 2,
                    top: ry - NODE_SIZE / 2,
                  }}
                  title={node.name}
                >
                  {node.type === 'notable' && <span className="text-white text-xs">★</span>}
                  {node.type === 'start' && <span className="text-white text-xs">★</span>}
                  {node.rank > 0 && node.type === 'small' && <span className="text-white text-[10px] font-bold">{node.rank}</span>}
                </div>
              );
            })}
          </div>
        </TransformComponent>
      </TransformWrapper>

      {selectedNode && (
        <div className="absolute bottom-4 left-4 right-4 md:left-auto md:w-96 bg-black/90 p-4 rounded-xl border-2 border-amber-600 shadow-2xl z-20">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-xl font-bold text-amber-400">{selectedNode.name}</h3>
            <button onClick={() => setSelectedNode(null)} className="text-gray-400 hover:text-white">✕</button>
          </div>
          <p className="text-parchment-light text-sm mb-4">{selectedNode.description}</p>

          <div className="flex justify-between items-center text-sm text-gray-400 mb-4">
            <span>Ранг: {selectedNode.rank} / {selectedNode.max_rank}</span>
            {selectedNode.type === 'notable' && <span className="text-purple-400">Значимый</span>}
          </div>

          <button
            onClick={() => {
              upgradeTalent(selectedNode.id, {
                onSuccess: () => setSelectedNode(null)
              });
            }}
            disabled={!selectedNode.can_upgrade || isPending}
            className={`w-full py-2 rounded-lg font-bold transition-all ${
              selectedNode.can_upgrade
                ? 'bg-amber-600 hover:bg-amber-500 text-black shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isPending ? 'Изучение...' : selectedNode.can_upgrade ? 'Изучить' : 'Недоступно'}
          </button>
        </div>
      )}
    </div>
  );
}
