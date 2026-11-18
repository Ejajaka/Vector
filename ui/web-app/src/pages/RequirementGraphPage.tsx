import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Background,
  Controls,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  AlertTriangle,
  ArrowRight,
  Download,
  GitBranch,
  Loader2,
  Network,
  RefreshCw,
  Waypoints,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useProject } from '../context/ProjectContext.tsx';
import { useToast } from '../components/ui/Toast.tsx';
import { listRequirements } from '../services/documents/requirementDocuments.ts';
import { analyzeRequirements } from '../services/requirements/intelligence.ts';
import { exportRequirementGraph } from '../services/requirements/graphExport.ts';
import { buildGraphModel, type GraphCard } from '../services/requirements/graphLayout.ts';
import type { RequirementRecord } from '../types/requirements.ts';
import type {
  RequirementAnalysisResult,
  RequirementFinding,
} from '../types/requirementIntelligence.ts';

type FindingTab = 'all' | 'ambiguity' | 'conflict' | 'dependency';

const CHIP_COLOR: Record<string, string> = {
  screen: '#688E5E',
  component: '#D1B653',
  role: '#5A8090',
  interaction: '#C96839',
};

function RequirementCardNode({ data }: NodeProps) {
  const card = (data as { card: GraphCard }).card;
  return (
    <div
      className={`flex h-full w-full flex-col overflow-hidden rounded-xl border bg-white shadow-xs ${
        card.conflicts ? 'border-[#E3B7B0]' : 'border-[#E5E2D8]'
      }`}
    >
      <Handle type="target" position={Position.Top} className="!h-1 !w-1 !border-0 !bg-transparent" />
      <div className="flex items-center gap-1.5 border-b border-[#EFECE3] bg-[#FAFAF8] px-2.5 py-1.5">
        <span className="font-mono text-[10px] font-bold text-[#49686C]">{card.code}</span>
        <div className="ml-auto flex items-center gap-1">
          {card.conflicts > 0 && (
            <span className="rounded-md bg-[#FDF2F0] px-1.5 py-0.5 text-[8px] font-bold text-[#B94D42]">
              {card.conflicts} conflict{card.conflicts === 1 ? '' : 's'}
            </span>
          )}
          {card.dependencies > 0 && (
            <span className="rounded-md bg-[#F0F5F5] px-1.5 py-0.5 text-[8px] font-bold text-[#49686C]">
              {card.dependencies} need{card.dependencies === 1 ? '' : 's'}
            </span>
          )}
        </div>
      </div>
      <p className="line-clamp-2 px-2.5 pt-1.5 text-[10.5px] leading-snug text-[#283638]">{card.text}</p>
      <div className="mt-auto space-y-1 px-2.5 pb-2">
        {card.chips.map((group) => (
          <div key={group.kind} className="flex items-center gap-1.5">
            <span
              className="w-[55px] shrink-0 text-[8px] font-bold uppercase tracking-wide"
              style={{ color: CHIP_COLOR[group.kind] || '#737A72' }}
            >
              {group.label}
            </span>
            <div className="flex min-w-0 items-center gap-1">
              {group.items.map((item) => (
                <span
                  key={item}
                  className="max-w-[86px] truncate rounded border border-[#EFECE3] bg-[#FAFAF8] px-1 py-0.5 text-[9px] text-[#5B625B]"
                >
                  {item}
                </span>
              ))}
              {group.total > group.items.length && (
                <span className="text-[9px] text-[#9A9688]">+{group.total - group.items.length}</span>
              )}
            </div>
          </div>
        ))}
        {card.dependsOn.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="w-[55px] shrink-0 text-[8px] font-bold uppercase tracking-wide text-[#49686C]">
              Needs
            </span>
            <span className="truncate rounded border border-[#D6E2E2] bg-[#F0F5F5] px-1 py-0.5 text-[9px] font-mono text-[#49686C]">
              {card.dependsOn.join(', ')}
            </span>
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="!h-1 !w-1 !border-0 !bg-transparent" />
    </div>
  );
}

const nodeTypes = { requirementCard: RequirementCardNode };

function buildFlow(result: RequirementAnalysisResult): { nodes: Node[]; edges: Edge[] } {
  const model = buildGraphModel(result);

  const nodes: Node[] = model.cards.map((card) => {
    const box = model.positions.get(card.id)!;
    return {
      id: card.id,
      type: 'requirementCard',
      position: { x: box.x, y: box.y },
      data: { card },
      style: { width: box.w, height: box.h },
      draggable: true,
    };
  });

  const edges: Edge[] = model.relations.map((relation) => ({
    id: relation.id,
    source: relation.source,
    target: relation.target,
    label: 'conflict',
    labelStyle: { fontSize: 9, fill: '#B94D42', fontWeight: 700 },
    labelBgStyle: { fill: '#FDF2F0', fillOpacity: 0.95 },
    labelBgPadding: [4, 2],
    labelBgBorderRadius: 4,
    style: { stroke: '#B94D42', strokeWidth: 1.6, strokeDasharray: '6 4' },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#B94D42', width: 16, height: 16 },
  }));

  return { nodes, edges };
}

function severityBadge(severity: string): string {
  if (severity === 'critical') return 'bg-[#FDF2F0] border-[#F0C4BF] text-[#B94D42]';
  if (severity === 'high') return 'bg-[#FFF7ED] border-[#FED7AA] text-[#9C4A28]';
  if (severity === 'medium') return 'bg-[#FEFCE8] border-[#FEF08A] text-[#856C16]';
  return 'bg-[#F4F9F1] border-[#CFE2C8] text-[#3E6B33]';
}

function FindingCard({ finding, requirements }: { finding: RequirementFinding; requirements: RequirementRecord[] }) {
  const byId = new Map(requirements.map((requirement) => [requirement.id, requirement]));
  return (
    <article className="bg-[#FFFFFF] border border-[#E5E2D8] rounded-xl p-4 shadow-xs">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${severityBadge(finding.severity)}`}>
          {finding.severity}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wide text-[#737A72]">{finding.type}</span>
        <span className="ml-auto text-[10px] font-mono text-[#49686C]">
          {finding.affectedRequirementIds.map((id) => byId.get(id)?.requirementCode || id.slice(0, 8)).join(' · ')}
        </span>
      </div>
      <h3 className="text-sm font-bold text-[#283638] mt-2">{finding.title}</h3>
      <p className="text-xs text-[#283638] leading-relaxed mt-1">{finding.detail}</p>
      <p className="text-[11px] text-[#737A72] leading-relaxed mt-2">
        <b className="text-[#49686C]">Why it matters:</b> {finding.whyItMatters}
      </p>
      <div className="mt-2.5 space-y-1.5">
        {finding.evidence.map((item) => (
          <div key={`${finding.id}-${item.requirementId}`} className="text-[11px] bg-[#FAFAF8] border border-[#E5E2D8] rounded-lg p-2">
            <span className="font-mono font-bold text-[#49686C]">{item.requirementCode}</span>
            {item.sourcePage ? <span className="text-[#737A72]"> · page {item.sourcePage}</span> : null}
            <p className="text-[#283638] mt-0.5">“{item.text}”</p>
          </div>
        ))}
      </div>
    </article>
  );
}

export const RequirementGraphPage: React.FC = () => {
  const { localMode } = useAuth();
  const { currentProject } = useProject();
  const { toast } = useToast();
  const [requirements, setRequirements] = useState<RequirementRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const [findingTab, setFindingTab] = useState<FindingTab>('all');

  const load = useCallback(async () => {
    if (!currentProject || localMode) {
      setRequirements([]);
      return;
    }
    setLoading(true);
    setError('');
    try {
      setRequirements(await listRequirements(currentProject.id));
    } catch (e: any) {
      setError(e?.message || 'Could not load requirements.');
    } finally {
      setLoading(false);
    }
  }, [currentProject, localMode]);

  useEffect(() => {
    void load();
  }, [load]);

  const analysis = useMemo(() => analyzeRequirements(requirements), [requirements]);
  const findings = analysis.findings;
  const visibleFindings = useMemo(
    () => (findingTab === 'all' ? findings : findings.filter((finding) => finding.type === findingTab)),
    [findings, findingTab]
  );
  const flow = useMemo(() => buildFlow(analysis), [analysis]);

  const downloadGraph = async () => {
    if (!flow.nodes.length || !currentProject) {
      toast('There is no graph to download yet.', 'info');
      return;
    }
    setDownloading(true);
    try {
      const blob = await exportRequirementGraph(analysis, {
        projectName: currentProject.name,
        counts: {
          requirements: requirements.length,
          ambiguities: findings.filter((finding) => finding.type === 'ambiguity').length,
          conflicts: findings.filter((finding) => finding.type === 'conflict').length,
          dependencies: findings.filter((finding) => finding.type === 'dependency').length,
        },
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const stamp = new Date().toISOString().slice(0, 10);
      link.download = `requirement-graph-${currentProject.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-${stamp}.png`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast('Requirement graph downloaded', 'success');
    } catch (e: any) {
      toast(e?.message || 'Could not render the graph image.', 'error');
    } finally {
      setDownloading(false);
    }
  };

  if (!currentProject) {
    return (
      <div className="max-w-3xl mx-auto bg-[#FFFFFF] border border-[#E5E2D8] rounded-xl p-10 text-center shadow-xs">
        <Network className="w-8 h-8 text-[#49686C] mx-auto mb-3" />
        <h1 className="text-lg font-bold text-[#283638]">Choose a project first</h1>
        <p className="text-xs text-[#737A72] mt-1">The requirement graph is project-scoped.</p>
      </div>
    );
  }

  const counts = {
    requirements: requirements.length,
    ambiguities: findings.filter((finding) => finding.type === 'ambiguity').length,
    conflicts: findings.filter((finding) => finding.type === 'conflict').length,
    dependencies: findings.filter((finding) => finding.type === 'dependency').length,
  };

  return (
    <div className="space-y-6 max-w-[1500px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#283638] tracking-tight">Requirement Intelligence</h1>
          <p className="text-xs sm:text-sm text-[#737A72] mt-1">
            Explore relationships, ambiguities, conflicts and implementation dependencies.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[#E5E2D8] bg-white text-xs font-bold text-[#49686C] hover:bg-[#F6F4EC] disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Refresh
          </button>
          <button
            type="button"
            onClick={() => void downloadGraph()}
            disabled={downloading || !requirements.length}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[#E5E2D8] bg-white text-xs font-bold text-[#49686C] hover:bg-[#F6F4EC] disabled:opacity-60"
            title="Download the requirement graph as a PNG"
          >
            {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            Download PNG
          </button>
        </div>
      </div>

      {error && <div className="rounded-xl border border-[#F0C4BF] bg-[#FDF2F0] p-4 text-xs text-[#B94D42]">{error}</div>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          ['Requirements', counts.requirements, GitBranch, '#49686C'],
          ['Ambiguities', counts.ambiguities, AlertTriangle, '#D1B653'],
          ['Conflicts', counts.conflicts, Waypoints, '#B94D42'],
          ['Dependencies', counts.dependencies, ArrowRight, '#5A8090'],
        ].map(([label, value, Icon, color]: any) => (
          <div key={label} className="bg-[#FFFFFF] border border-[#E5E2D8] rounded-xl p-4 shadow-xs">
            <div className="flex items-center gap-2 text-[11px] font-semibold text-[#737A72]">
              <Icon className="w-3.5 h-3.5" style={{ color }} />
              {label}
            </div>
            <div className="text-2xl font-bold font-mono text-[#283638] mt-1 tabular-nums">{value}</div>
          </div>
        ))}
      </div>

      {requirements.length === 0 ? (
        <div className="bg-[#FFFFFF] border border-[#E5E2D8] rounded-xl p-10 text-center text-xs text-[#737A72]">
          Upload and compile a requirement document first.
        </div>
      ) : (
        <>
          <div className="bg-[#FFFFFF] border border-[#E5E2D8] rounded-xl shadow-xs overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-[#E5E2D8]">
              <div className="flex items-center gap-2">
                <Network className="w-4 h-4 text-[#49686C]" />
                <h2 className="text-sm font-bold text-[#283638]">Requirement graph</h2>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-[#737A72]">
                <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-[2px] border border-[#49686C] bg-white" /> requirement card</span>
                <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#688E5E]" /> screen</span>
                <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#D1B653]" /> component</span>
                <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#5A8090]" /> role</span>
                <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#C96839]" /> interaction</span>
                <span className="inline-flex items-center gap-1"><span className="w-3 border-t border-dashed border-[#B94D42]" /> conflict</span>
                <span className="hidden sm:inline">Needs = dependency</span>
              </div>
            </div>
            <div className="h-[600px] bg-[#FAFAF8]">
              <ReactFlow
                nodes={flow.nodes}
                edges={flow.edges}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.15 }}
                minZoom={0.15}
                maxZoom={1.5}
                nodesDraggable
                nodesConnectable={false}
                elementsSelectable
                proOptions={{ hideAttribution: true }}
              >
                <Background gap={20} size={1} color="#E5E2D8" />
                <Controls showInteractive={false} />
              </ReactFlow>
            </div>
          </div>

          <div className="bg-[#FFFFFF] border border-[#E5E2D8] rounded-xl shadow-xs p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#49686C]" />
                <h2 className="text-sm font-bold text-[#283638]">Findings</h2>
                <span className="text-[10px] font-mono text-[#737A72]">{visibleFindings.length}/{findings.length}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {([
                  ['all', 'All'],
                  ['ambiguity', 'Ambiguity'],
                  ['conflict', 'Conflicts'],
                  ['dependency', 'Dependencies'],
                ] as [FindingTab, string][]).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setFindingTab(id)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                      findingTab === id
                        ? 'bg-[#49686C] border-[#49686C] text-white'
                        : 'bg-white border-[#E5E2D8] text-[#737A72] hover:border-[#49686C]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3 mt-3">
              {visibleFindings.length === 0 ? (
                <p className="text-xs text-[#737A72] py-6 text-center">No findings in this category.</p>
              ) : (
                visibleFindings.map((finding) => (
                  <FindingCard key={finding.id} finding={finding} requirements={requirements} />
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
