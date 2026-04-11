import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { cn } from '../utils/cn';
import { 
  Zap, MessageSquare, GitBranch, Clock, Mail, Globe, 
  UserPlus, CheckCircle, Play, AlertCircle 
} from 'lucide-react';

const nodeIcons: Record<string, React.ElementType> = {
  aiResponse: Zap,
  intentDetection: Zap,
  sentimentAnalysis: Zap,
  textInput: MessageSquare,
  emailInput: Mail,
  phoneInput: MessageSquare,
  condition: GitBranch,
  branch: GitBranch,
  delay: Clock,
  sendEmail: Mail,
  webhook: Globe,
  transferToAgent: UserPlus,
  start: Play,
  end: CheckCircle,
};

const nodeColors: Record<string, string> = {
  start: 'bg-green-500/20 border-green-500',
  aiResponse: 'bg-cyan-500/20 border-cyan-500',
  intentDetection: 'bg-purple-500/20 border-purple-500',
  sentimentAnalysis: 'bg-purple-500/20 border-purple-500',
  textInput: 'bg-amber-500/20 border-amber-500',
  emailInput: 'bg-amber-500/20 border-amber-500',
  phoneInput: 'bg-amber-500/20 border-amber-500',
  condition: 'bg-pink-500/20 border-pink-500',
  branch: 'bg-pink-500/20 border-pink-500',
  delay: 'bg-orange-500/20 border-orange-500',
  sendEmail: 'bg-blue-500/20 border-blue-500',
  webhook: 'bg-blue-500/20 border-blue-500',
  transferToAgent: 'bg-red-500/20 border-red-500',
  end: 'bg-red-500/20 border-red-500',
};

interface CustomNodeProps extends NodeProps {
  type?: string;
}

function CustomNode({ data, selected, type = 'aiResponse' }: CustomNodeProps) {
  const Icon = nodeIcons[type] || MessageSquare;
  const colorClass = nodeColors[type] || 'bg-slate-500/20 border-slate-500';

  return (
    <div className={cn(
      "w-48 rounded-xl border-2 p-3 transition-all",
      colorClass,
      selected ? "shadow-lg shadow-cyan-500/30" : ""
    )}>
      {type !== 'start' && (
        <Handle 
          type="target" 
          position={Position.Top} 
          className="!w-3 !h-3 !bg-slate-400 !border-2 !border-slate-600" 
        />
      )}
      
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg bg-slate-800/50 flex items-center justify-center">
          <Icon className="w-4 h-4 text-white" />
        </div>
        <span className="text-white font-medium text-sm truncate">
          {data.label || type}
        </span>
      </div>
      
      {data.message && (
        <p className="text-slate-300 text-xs line-clamp-2">{data.message}</p>
      )}
      
      {data.condition && (
        <div className="mt-2 p-2 bg-slate-800/50 rounded text-xs text-slate-400">
          {data.condition}
        </div>
      )}
      
      {type === 'delay' && data.delay && (
        <p className="text-slate-300 text-xs mt-1">{data.delay}ms</p>
      )}
      
      {type !== 'end' && (
        <Handle 
          type="source" 
          position={Position.Bottom} 
          className="!w-3 !h-3 !bg-slate-400 !border-2 !border-slate-600" 
        />
      )}
    </div>
  );
}

export default memo(CustomNode);